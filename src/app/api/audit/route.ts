import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const entityId = searchParams.get('entityId')

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (userId) where.userId = userId
    if (entityId) where.entityId = entityId

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({ success: true, data: logs, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('GET /api/audit error:', error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
