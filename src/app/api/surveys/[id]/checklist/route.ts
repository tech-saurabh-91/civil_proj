import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { category, item } = body

    if (!item) {
      return NextResponse.json({ error: 'item is required' }, { status: 400 })
    }

    const survey = await db.survey.findUnique({ where: { id } })
    if (!survey || survey.isDeleted) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const newItem = await db.surveyChecklistItem.create({
      data: {
        survey: { connect: { id } },
        category: category || 'General',
        item,
        isCompleted: false,
      },
    })

    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (error) {
    console.error('POST /api/surveys/[id]/checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
