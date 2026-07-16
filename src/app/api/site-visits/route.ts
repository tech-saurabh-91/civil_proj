import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const date = searchParams.get('date')

    const where: any = { isDeleted: false }
    if (userId) where.userId = userId
    if (projectId) where.projectId = projectId
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.checkInAt = { gte: start, lte: end }
    }

    const visits = await db.siteVisit.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { checkInAt: 'desc' },
      take: 200,
    })

    const summary = visits.map((v: any) => {
      const duration = v.checkOutAt
        ? Math.round((new Date(v.checkOutAt).getTime() - new Date(v.checkInAt).getTime()) / 60000)
        : null
      return {
        ...v,
        durationMinutes: duration,
      }
    })

    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error('GET /api/site-visits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { userId, projectId, latitude, longitude, accuracy } = body

    const uid = userId || (session?.user as any)?.id
    if (!uid || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'userId, latitude, longitude required' }, { status: 400 })
    }

    const activeVisit = await db.siteVisit.findFirst({
      where: {
        userId: uid,
        checkOutAt: null,
        isDeleted: false,
      },
    })

    if (activeVisit) {
      return NextResponse.json({ success: true, data: activeVisit })
    }

    const visit = await db.siteVisit.create({
      data: {
        user: { connect: { id: uid } },
        ...(projectId ? { project: { connect: { id: projectId } } } : {}),
        latitude,
        longitude,
        accuracy: accuracy || null,
        status: 'CHECKED_IN',
        createdBy: uid,
      },
    })

    return NextResponse.json({ success: true, data: visit }, { status: 201 })
  } catch (error) {
    console.error('POST /api/site-visits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    if (action === 'check-out') {
      const visit = await db.siteVisit.update({
        where: { id },
        data: { checkOutAt: new Date(), status: 'CHECKED_OUT' },
      })
      return NextResponse.json({ success: true, data: visit })
    }

    if (action === 'check-in') {
      const { latitude, longitude, accuracy, projectId } = body
      const visit = await db.siteVisit.update({
        where: { id },
        data: {
          checkOutAt: null,
          status: 'CHECKED_IN',
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          accuracy: accuracy || undefined,
        },
      })
      return NextResponse.json({ success: true, data: visit })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/site-visits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
