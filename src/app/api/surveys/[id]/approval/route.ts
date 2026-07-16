import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import {
  getNextLevel,
  getPrevLevel,
  getLevelConfig,
  canUserApproveAtLevel,
  getTotalLevels,
} from '@/lib/approval-workflow'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, toUserId, notes } = body

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const userRole = (session.user as any).role as string

    const survey = await db.survey.findUnique({ where: { id } })
    if (!survey || survey.isDeleted) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.status !== 'SUBMITTED' && survey.status !== 'MANAGER_APPROVED') {
      return NextResponse.json(
        { error: 'Survey is not in an approval-pending state' },
        { status: 400 }
      )
    }

    const totalLevels = await getTotalLevels('Survey')

    if (action === 'APPROVE') {
      const currentLevel = survey.currentApprovalLevel
      if (currentLevel === 0) {
        return NextResponse.json({ error: 'Survey not submitted for approval' }, { status: 400 })
      }

      const canApprove = await canUserApproveAtLevel(userRole, 'Survey', currentLevel)
      if (!canApprove && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: `You cannot approve at level ${currentLevel}` },
          { status: 403 }
        )
      }

      if (userId === survey.engineerId && currentLevel === 1) {
        return NextResponse.json(
          { error: 'You cannot approve your own survey' },
          { status: 403 }
        )
      }

      const nextLevel = await getNextLevel('Survey', currentLevel)
      const levelConfig = await getLevelConfig('Survey', currentLevel)

      await db.approvalLog.create({
        data: {
          surveyId: id,
          level: currentLevel,
          action: 'APPROVE',
          fromUserId: userId,
          notes: notes || null,
        },
      })

      if (nextLevel) {
        const nextConfig = await getLevelConfig('Survey', nextLevel)
        await db.survey.update({
          where: { id },
          data: {
            currentApprovalLevel: nextLevel,
            status: 'SUBMITTED',
          },
        })

        const notifications = []
        if (survey.engineerId) {
          notifications.push({
            userId: survey.engineerId,
            title: `Survey Approved - Level ${currentLevel}`,
            message: `Your survey "${survey.title}" passed ${levelConfig?.name}. Now at ${nextConfig?.name}.`,
            type: 'SUCCESS' as const,
            entityType: 'Survey',
            entityId: id,
          })
        }
        if (notifications.length > 0) {
          await db.notification.createMany({ data: notifications })
        }

        return NextResponse.json({
          success: true,
          message: `Approved at Level ${currentLevel}. Forwarded to Level ${nextLevel} (${nextConfig?.name})`,
          data: { nextLevel, status: 'SUBMITTED', totalLevels },
        })
      } else {
        await db.survey.update({
          where: { id },
          data: {
            currentApprovalLevel: 0,
            status: 'APPROVED',
            completedDate: new Date(),
          },
        })

        const notifications = []
        if (survey.engineerId) {
          notifications.push({
            userId: survey.engineerId,
            title: 'Survey Final Approved',
            message: `Your survey "${survey.title}" has been fully approved across all ${totalLevels} levels.`,
            type: 'SUCCESS' as const,
            entityType: 'Survey',
            entityId: id,
          })
        }

        const project = await db.project.findUnique({
          where: { id: survey.projectId },
          include: { client: true },
        })
        if (project?.managerId && project.managerId !== survey.engineerId) {
          notifications.push({
            userId: project.managerId,
            title: 'Survey Final Approved',
            message: `Survey "${survey.title}" for project "${project.name}" has been fully approved.`,
            type: 'SUCCESS' as const,
            entityType: 'Survey',
            entityId: id,
          })
        }
        if (notifications.length > 0) {
          await db.notification.createMany({ data: notifications })
        }

        if (project?.client) {
          await db.emailLog.create({
            data: {
              to: project.client.email || project.client.name,
              from: 'noreply@buildsurvey.in',
              subject: `Survey Report Ready - ${survey.title}`,
              body: `Dear ${project.client.contactPerson || project.client.name},\n\nYour survey "${survey.title}" for project "${project.name}" has been fully approved.\n\nPlease login to view the report.\n\nRegards,\nBuildSurvey Pro`,
              status: 'SENT',
              sentAt: new Date(),
            },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Survey fully approved across all levels',
          data: { nextLevel: 0, status: 'APPROVED', totalLevels },
        })
      }
    }

    if (action === 'REJECT') {
      const currentLevel = survey.currentApprovalLevel
      if (currentLevel === 0) {
        return NextResponse.json({ error: 'Survey not submitted for approval' }, { status: 400 })
      }

      const canApprove = await canUserApproveAtLevel(userRole, 'Survey', currentLevel)
      if (!canApprove && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: `You cannot reject at level ${currentLevel}` },
          { status: 403 }
        )
      }

      await db.approvalLog.create({
        data: {
          surveyId: id,
          level: currentLevel,
          action: 'REJECT',
          fromUserId: userId,
          notes: notes || null,
        },
      })

      await db.survey.update({
        where: { id },
        data: {
          currentApprovalLevel: 0,
          status: 'REJECTED',
        },
      })

      const notifications = []
      if (survey.engineerId) {
        const levelConfig = await getLevelConfig('Survey', currentLevel)
        notifications.push({
          userId: survey.engineerId,
          title: 'Survey Rejected',
          message: `Your survey "${survey.title}" was rejected at Level ${currentLevel} (${levelConfig?.name}). ${notes || ''}`,
          type: 'WARNING' as const,
          entityType: 'Survey',
          entityId: id,
        })
      }
      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications })
      }

      return NextResponse.json({
        success: true,
        message: `Survey rejected at Level ${currentLevel}`,
        data: { status: 'REJECTED', totalLevels },
      })
    }

    if (action === 'FORWARD') {
      const currentLevel = survey.currentApprovalLevel
      const levelConfig = await getLevelConfig('Survey', currentLevel)
      if (!levelConfig?.allowForward) {
        return NextResponse.json(
          { error: 'Forwarding not allowed at this level' },
          { status: 400 }
        )
      }

      if (!toUserId) {
        return NextResponse.json({ error: 'toUserId required for forward' }, { status: 400 })
      }

      const targetUser = await db.user.findUnique({ where: { id: toUserId } })
      if (!targetUser || targetUser.isDeleted) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }

      const canApprove = await canUserApproveAtLevel(targetUser.role, 'Survey', currentLevel)
      if (!canApprove && targetUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: `User ${targetUser.firstName} ${targetUser.lastName} cannot approve at level ${currentLevel}` },
          { status: 400 }
        )
      }

      await db.approvalLog.create({
        data: {
          surveyId: id,
          level: currentLevel,
          action: 'FORWARD',
          fromUserId: userId,
          toUserId: toUserId,
          notes: notes || `Forwarded to ${targetUser.firstName} ${targetUser.lastName}`,
        },
      })

      await db.survey.update({
        where: { id },
        data: { assignedApproverId: toUserId },
      })

      await db.notification.create({
        data: {
          userId: toUserId,
          title: 'Survey Forwarded for Your Approval',
          message: `Survey "${survey.title}" has been forwarded to you for Level ${currentLevel} (${levelConfig?.name}) approval.`,
          type: 'INFO' as const,
          entityType: 'Survey',
          entityId: id,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Forwarded to ${targetUser.firstName} ${targetUser.lastName}`,
        data: { assignedApproverId: toUserId, totalLevels },
      })
    }

    if (action === 'ESCALATE') {
      const currentLevel = survey.currentApprovalLevel
      const levelConfig = await getLevelConfig('Survey', currentLevel)
      if (!levelConfig?.allowEscalate) {
        return NextResponse.json(
          { error: 'Escalation not allowed at this level' },
          { status: 400 }
        )
      }

      const nextLevel = await getNextLevel('Survey', currentLevel)
      if (!nextLevel) {
        return NextResponse.json({ error: 'No higher level available' }, { status: 400 })
      }

      const nextConfig = await getLevelConfig('Survey', nextLevel)

      await db.approvalLog.create({
        data: {
          surveyId: id,
          level: currentLevel,
          action: 'ESCALATE',
          fromUserId: userId,
          notes: notes || `Escalated from Level ${currentLevel} to Level ${nextLevel}`,
        },
      })

      await db.survey.update({
        where: { id },
        data: {
          currentApprovalLevel: nextLevel,
          assignedApproverId: null,
        },
      })

      const notifications = []
      if (survey.engineerId) {
        notifications.push({
          userId: survey.engineerId,
          title: 'Survey Escalated',
          message: `Your survey "${survey.title}" has been escalated from Level ${currentLevel} to Level ${nextLevel} (${nextConfig?.name}).`,
          type: 'INFO' as const,
          entityType: 'Survey',
          entityId: id,
        })
      }
      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications })
      }

      return NextResponse.json({
        success: true,
        message: `Escalated to Level ${nextLevel} (${nextConfig?.name})`,
        data: { nextLevel, totalLevels },
      })
    }

    if (action === 'REVERSE') {
      const currentLevel = survey.currentApprovalLevel
      const levelConfig = await getLevelConfig('Survey', currentLevel)
      if (!levelConfig?.allowReverse) {
        return NextResponse.json(
          { error: 'Reversal not allowed at this level' },
          { status: 400 }
        )
      }

      const prevLevel = await getPrevLevel('Survey', currentLevel)
      if (prevLevel === null) {
        return NextResponse.json({ error: 'No lower level to reverse to' }, { status: 400 })
      }

      const prevConfig = await getLevelConfig('Survey', prevLevel)

      await db.approvalLog.create({
        data: {
          surveyId: id,
          level: currentLevel,
          action: 'REVERSE',
          fromUserId: userId,
          notes: notes || `Reversed from Level ${currentLevel} to Level ${prevLevel}`,
        },
      })

      await db.survey.update({
        where: { id },
        data: {
          currentApprovalLevel: prevLevel,
          assignedApproverId: null,
          status: 'SUBMITTED',
        },
      })

      const notifications = []
      if (survey.engineerId) {
        notifications.push({
          userId: survey.engineerId,
          title: 'Survey Reversed',
          message: `Your survey "${survey.title}" has been sent back from Level ${currentLevel} to Level ${prevLevel} (${prevConfig?.name}).`,
          type: 'WARNING' as const,
          entityType: 'Survey',
          entityId: id,
        })
      }
      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications })
      }

      return NextResponse.json({
        success: true,
        message: `Reversed to Level ${prevLevel} (${prevConfig?.name})`,
        data: { prevLevel, status: 'SUBMITTED', totalLevels },
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: APPROVE, REJECT, FORWARD, ESCALATE, REVERSE' }, { status: 400 })
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const logs = await db.approvalLog.findMany({
      where: { surveyId: id },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true, role: true } },
        toUser: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('GET approval logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
