import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const survey = await db.survey.findUnique({
      where: { id, isDeleted: false },
      include: {
        project: { select: { id: true, name: true, code: true } },
        engineer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedApprover: { select: { id: true, firstName: true, lastName: true, role: true } },
        checklistItems: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        photos: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
        voiceNotes: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
        siteVisits: {
          where: { isDeleted: false },
          orderBy: { checkInAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        _count: {
          select: {
            checklistItems: true,
            photos: true,
            voiceNotes: true,
            videos: true,
          },
        },
      },
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const completedChecklist = await db.surveyChecklistItem.count({
      where: { surveyId: id, isDeleted: false, isCompleted: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...survey,
        engineer: survey.engineer
          ? {
              ...survey.engineer,
              name: `${survey.engineer.firstName} ${survey.engineer.lastName}`,
              initials: `${survey.engineer.firstName?.[0] || ''}${survey.engineer.lastName?.[0] || ''}`.toUpperCase(),
            }
          : null,
        checklistCompleted: completedChecklist,
        progress: survey._count.checklistItems > 0
          ? Math.round((completedChecklist / survey._count.checklistItems) * 100)
          : 0,
      },
    })
  } catch (error) {
    console.error('GET /api/surveys/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, engineerId, scheduledDate, ...rest } = body

    const existing = await db.survey.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const updateData: any = { ...rest }
    if (status) updateData.status = status
    if (engineerId !== undefined) {
      updateData.engineer = engineerId ? { connect: { id: engineerId } } : { disconnect: true }
    }
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate)
    if (status === 'COMPLETED') updateData.completedDate = new Date()

    const survey = await db.survey.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: survey })
  } catch (error) {
    console.error('PATCH /api/surveys/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.survey.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    await db.survey.update({ where: { id }, data: { isDeleted: true } })
    return NextResponse.json({ success: true, message: 'Survey deleted' })
  } catch (error) {
    console.error('DELETE /api/surveys/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
