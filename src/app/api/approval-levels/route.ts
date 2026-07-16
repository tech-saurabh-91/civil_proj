import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || 'Survey'

    const levels = await db.approvalLevelConfig.findMany({
      where: { entityType, isDeleted: false },
      include: {
        approvers: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
        },
      },
      orderBy: { level: 'asc' },
    })

    return NextResponse.json({ success: true, data: levels })
  } catch (error) {
    console.error('GET /api/approval-levels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only Admin can manage approval levels' }, { status: 403 })
    }

    const body = await request.json()
    const { entityType, levels } = body

    if (!entityType || !levels || !Array.isArray(levels)) {
      return NextResponse.json({ error: 'entityType and levels array required' }, { status: 400 })
    }

    await db.approvalLevelConfig.updateMany({
      where: { entityType },
      data: { isDeleted: true },
    })

    for (const level of levels) {
      const config = await db.approvalLevelConfig.create({
        data: {
          entityType,
          level: level.level,
          name: level.name,
          description: level.description || '',
          requiredRole: level.requiredRole,
          allowForward: level.allowForward ?? true,
          allowEscalate: level.allowEscalate ?? true,
          allowReverse: level.allowReverse ?? true,
        },
      })

      if (level.approverIds && Array.isArray(level.approverIds)) {
        for (const userId of level.approverIds) {
          await db.approvalLevelUser.create({
            data: { configId: config.id, userId },
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Approval levels saved' })
  } catch (error) {
    console.error('POST /api/approval-levels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
