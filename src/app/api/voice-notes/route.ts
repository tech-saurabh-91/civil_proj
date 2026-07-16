import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const surveyId = searchParams.get('surveyId') || ''

    const where: any = { isDeleted: false }
    if (surveyId) where.surveyId = surveyId

    const notes = await db.voiceNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        survey: { select: { id: true, title: true, project: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    console.error('GET /api/voice-notes error:', error)
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
    const { filename, url, duration, transcription, surveyId } = body

    if (!filename || !url) {
      return NextResponse.json({ error: 'filename and url are required' }, { status: 400 })
    }

    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId is required' }, { status: 400 })
    }

    const note = await db.voiceNote.create({
      data: {
        filename,
        url,
        duration: duration ? parseFloat(duration) : null,
        transcription: transcription || null,
        survey: { connect: { id: surveyId } },
        createdBy: session.user.id,
      },
      include: {
        survey: { select: { id: true, title: true, project: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error('POST /api/voice-notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
