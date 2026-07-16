import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body = await req.json()

    const item = await db.surveyChecklistItem.findUnique({ where: { id: itemId } })
    if (!item || item.isDeleted || item.surveyId !== id) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    const updated = await db.surveyChecklistItem.update({
      where: { id: itemId },
      data: { isCompleted: body.isCompleted },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/surveys/[id]/checklist/[itemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params

    const item = await db.surveyChecklistItem.findUnique({ where: { id: itemId } })
    if (!item || item.isDeleted || item.surveyId !== id) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    await db.surveyChecklistItem.update({
      where: { id: itemId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Item deleted' })
  } catch (error) {
    console.error('DELETE /api/surveys/[id]/checklist/[itemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
