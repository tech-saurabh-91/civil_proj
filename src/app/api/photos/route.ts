import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const surveyId = searchParams.get('surveyId')

    const where: any = { isDeleted: false }
    if (projectId) where.projectId = projectId
    if (surveyId) where.surveyId = surveyId

    const photos = await db.photo.findMany({
      where,
      include: {
        survey: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: photos })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id

    const body = await req.json()
    const { surveyId, projectId, caption, fileData, filename, latitude, longitude } = body

    if (!fileData || !filename) {
      return NextResponse.json({ error: 'fileData and filename are required' }, { status: 400 })
    }

    let resolvedSurveyId = surveyId
    let resolvedProjectId = projectId

    if (!resolvedSurveyId && resolvedProjectId) {
      const survey = await db.survey.findFirst({
        where: { projectId: resolvedProjectId, isDeleted: false },
        select: { id: true },
      })
      resolvedSurveyId = survey?.id
    }

    if (!resolvedSurveyId) {
      return NextResponse.json({ error: 'surveyId or projectId is required' }, { status: 400 })
    }

    const photo = await db.photo.create({
      data: {
        survey: { connect: { id: resolvedSurveyId } },
        ...(resolvedProjectId ? { project: { connect: { id: resolvedProjectId } } } : {}),
        url: fileData,
        filename,
        caption: caption || filename.replace(/\.[^/.]+$/, ''),
        latitude: latitude || null,
        longitude: longitude || null,
        takenAt: new Date(),
        createdBy: userId || null,
      },
    })

    return NextResponse.json({ success: true, data: photo }, { status: 201 })
  } catch (error) {
    console.error('POST photo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
