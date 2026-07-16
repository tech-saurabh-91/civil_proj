import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'ALL') where.status = status

    const approvals = await db.approval.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: approvals })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entityType, entityId, requestedById, comments } = body

    if (!entityType || !entityId || !requestedById) {
      return NextResponse.json({ error: 'entityType, entityId, and requestedById are required' }, { status: 400 })
    }

    const approval = await db.approval.create({
      data: {
        entityType,
        entityId,
        requestedBy: { connect: { id: requestedById } },
        comments: comments || null,
        status: 'PENDING',
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ success: true, data: approval })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
