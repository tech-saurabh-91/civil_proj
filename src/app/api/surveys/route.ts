import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const projectId = searchParams.get('projectId') || ''
    const engineerId = searchParams.get('engineerId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: any = { isDeleted: false }

    if (search) {
      const s = search.toLowerCase()
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (type) where.type = type
    if (projectId) where.projectId = projectId
    if (engineerId) where.engineerId = engineerId

    const [surveys, total] = await Promise.all([
      db.survey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, code: true } },
          engineer: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: {
            select: {
              checklistItems: true,
              photos: true,
              voiceNotes: true,
              videos: true,
              siteVisits: true,
            },
          },
        },
      }),
      db.survey.count({ where }),
    ])

    const surveyIds = surveys.map((s: any) => s.id)

    const [completedChecklists, siteVisits] = await Promise.all([
      db.surveyChecklistItem.groupBy({
        by: ['surveyId'],
        where: { surveyId: { in: surveyIds }, isDeleted: false, isCompleted: true },
        _count: { id: true },
      }),
      db.siteVisit.findMany({
        where: { surveyId: { in: surveyIds }, isDeleted: false },
        select: { surveyId: true, checkInAt: true, checkOutAt: true },
      }),
    ])

    const completedMap = new Map(completedChecklists.map((c: any) => [c.surveyId, c._count.id]))
    const visitMap = new Map<string, { count: number; totalMinutes: number }>()
    for (const v of siteVisits) {
      const sid = v.surveyId!
      const existing = visitMap.get(sid) || { count: 0, totalMinutes: 0 }
      existing.count++
      if (v.checkInAt && v.checkOutAt) {
        existing.totalMinutes += Math.round((new Date(v.checkOutAt).getTime() - new Date(v.checkInAt).getTime()) / 60000)
      }
      visitMap.set(sid, existing)
    }

    return NextResponse.json({
      success: true,
      data: surveys.map((s: any) => {
        const completedCount = (completedMap.get(s.id) as number) || 0
        const totalChecklist = s._count.checklistItems as number
        const progress = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0
        const visit = visitMap.get(s.id)

        return {
          id: s.id,
          title: s.title,
          description: s.description,
          project: s.project?.name || '',
          projectId: s.project?.id || '',
          type: s.type?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || '',
          status: s.status || 'DRAFT',
          engineer: s.engineer ? {
            id: s.engineer.id,
            name: `${s.engineer.firstName} ${s.engineer.lastName}`,
            email: s.engineer.email,
            initials: `${s.engineer.firstName?.[0] || ''}${s.engineer.lastName?.[0] || ''}`.toUpperCase(),
          } : null,
          scheduledDate: s.scheduledDate ? new Date(s.scheduledDate).toISOString().split('T')[0] : '',
          hasGps: !!(s.gpsLatitude && s.gpsLongitude),
          gpsLatitude: s.gpsLatitude,
          gpsLongitude: s.gpsLongitude,
          duration: visit?.totalMinutes ? `${Math.floor(visit.totalMinutes / 60)}h ${visit.totalMinutes % 60}m` : null,
          checklistTotal: totalChecklist,
          checklistCompleted: completedCount,
          photoCount: s._count.photos,
          voiceNoteCount: s._count.voiceNotes,
          videoCount: s._count.videos,
          siteVisitCount: s._count.siteVisits,
          weatherCondition: s.weatherCondition,
          siteCondition: s.siteCondition,
          notes: s.notes,
          createdAt: s.createdAt,
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch surveys:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surveys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      title,
      description,
      type,
      scheduledDate,
      engineerId,
      priority,
      weatherCondition,
      siteCondition,
      accessDetails,
      notes,
      gpsLatitude,
      gpsLongitude,
      checklistItems,
    } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { success: false, error: 'Project and title are required' },
        { status: 400 }
      )
    }

    const typeMap: Record<string, string> = {
      initial: 'INITIAL',
      detailed: 'DETAILED',
      'follow-up': 'FOLLOW_UP',
      final: 'FINAL',
      'as-built': 'AS_BUILT',
    }
    const normalizedType = type
      ? typeMap[type.toLowerCase()] || type.toUpperCase()
      : 'INITIAL'

    const survey = await db.survey.create({
      data: {
        project: { connect: { id: projectId } },
        title,
        description: description || null,
        type: normalizedType as any,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        engineer: engineerId ? { connect: { id: engineerId } } : undefined,
        weatherCondition: weatherCondition || null,
        siteCondition: siteCondition || null,
        accessDetails: accessDetails || null,
        notes: notes || null,
        gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
        gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
        checklistItems: checklistItems?.length
          ? {
              create: checklistItems.map((item: any) => ({
                category: item.category || 'General',
                item: item.item,
                isCompleted: false,
                notes: item.notes || null,
              })),
            }
          : undefined,
      },
      include: { _count: { select: { checklistItems: true } } },
    })

    return NextResponse.json({ success: true, data: survey }, { status: 201 })
  } catch (error) {
    console.error('Failed to create survey:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create survey' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, engineerId, scheduledDate, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.survey.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (status === 'MANAGER_APPROVED') {
      const session = await auth()
      const userRole = (session?.user as any)?.role
      const userId = (session?.user as any)?.id
      if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'Only Manager can do first-level approval' }, { status: 403 })
      }
      if (userId === existing.engineerId) {
        return NextResponse.json({ error: 'You cannot approve your own survey' }, { status: 403 })
      }
    }

    if (status === 'APPROVED') {
      const session = await auth()
      const userRole = (session?.user as any)?.role
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'Only Admin can give final approval' }, { status: 403 })
      }
    }

    if (status === 'REJECTED') {
      const session = await auth()
      const userRole = (session?.user as any)?.role
      const userId = (session?.user as any)?.id
      if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'Only Manager or Admin can reject surveys' }, { status: 403 })
      }
      if (userId === existing.engineerId) {
        return NextResponse.json({ error: 'You cannot reject your own survey' }, { status: 403 })
      }
    }

    const updateData: any = { ...rest }
    if (status) updateData.status = status
    if (engineerId !== undefined) {
      updateData.engineer = engineerId ? { connect: { id: engineerId } } : { disconnect: true }
    }
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate)
    if (status === 'COMPLETED') updateData.completedDate = new Date()
    if (status === 'SUBMITTED' && existing.status !== 'SUBMITTED') {
      updateData.currentApprovalLevel = 1
    }

    const survey = await db.survey.update({
      where: { id },
      data: updateData,
    })

    if (status === 'MANAGER_APPROVED' || status === 'APPROVED' || status === 'REJECTED') {
      const notifications = []
      const label = status === 'MANAGER_APPROVED' ? 'Manager Approved' : status === 'APPROVED' ? 'Final Approved' : 'Rejected'

      if (existing.engineerId) {
        notifications.push({
          userId: existing.engineerId,
          title: `Survey ${label}`,
          message: `Your survey "${existing.title}" has been ${label.toLowerCase()}.`,
          type: status === 'REJECTED' ? 'WARNING' as const : 'SUCCESS' as const,
          entityType: 'Survey',
          entityId: id,
        })
      }

      const project = await db.project.findUnique({ where: { id: existing.projectId }, include: { client: true } })
      if (project?.managerId && project.managerId !== existing.engineerId) {
        notifications.push({
          userId: project.managerId,
          title: `Survey ${label}`,
          message: `Survey "${existing.title}" for project "${project.name}" has been ${label.toLowerCase()}.`,
          type: status === 'REJECTED' ? 'WARNING' as const : 'SUCCESS' as const,
          entityType: 'Survey',
          entityId: id,
        })
      }

      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications })
      }

      if (status === 'APPROVED' && project?.client) {
        await db.emailLog.create({
          data: {
            to: project.client.email || project.client.name,
            from: 'noreply@buildsurvey.in',
            subject: `Survey Report Ready - ${existing.title}`,
            body: `Dear ${project.client.contactPerson || project.client.name},\n\nYour survey "${existing.title}" for project "${project.name}" has been approved.\n\nPlease find the report attached or login to view it.\n\nRegards,\nBuildSurvey Pro`,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: survey })
  } catch (error) {
    console.error('PATCH /api/surveys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
