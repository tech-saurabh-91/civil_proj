import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signatures = await db.digitalSignature.findMany({
      where: { isDeleted: false, userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: signatures.map((s: any) => ({
        ...s,
        signedByUser: s.user,
      })),
    })
  } catch (error) {
    console.error('GET /api/signatures error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { entityType, entityId, signatureData, ipAddress } = body

    if (!signatureData) {
      return NextResponse.json({ error: 'signatureData is required' }, { status: 400 })
    }

    const signature = await db.digitalSignature.create({
      data: {
        entityType: entityType || 'SIGNATURE',
        entityId: entityId || 'GENERAL',
        signatureData,
        userId: session.user.id,
        ipAddress: ipAddress || null,
      },
    })

    return NextResponse.json({ success: true, data: signature }, { status: 201 })
  } catch (error) {
    console.error('POST /api/signatures error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
