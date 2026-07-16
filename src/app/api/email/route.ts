import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { isDeleted: false }
    if (type === 'inbox') where.to = { contains: '@' }
    if (type === 'sent') where.from = { contains: '@' }

    const emails = await db.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: emails })
  } catch (error) {
    console.error('GET /api/email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id
    const body = await req.json()
    const { to, subject, body: emailBody } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 })
    }

    const email = await db.emailLog.create({
      data: {
        to,
        from: (session?.user as any)?.email || 'system@buildsurvey.in',
        subject,
        body: emailBody,
        status: 'SENT',
        sentAt: new Date(),
        createdBy: userId || null,
      },
    })

    return NextResponse.json({ success: true, data: email }, { status: 201 })
  } catch (error) {
    console.error('POST /api/email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
