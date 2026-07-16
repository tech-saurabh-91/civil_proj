import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const note = await db.voiceNote.findUnique({ where: { id } })
    if (!note || note.isDeleted) {
      return NextResponse.json({ error: 'Voice note not found' }, { status: 404 })
    }

    await db.voiceNote.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Voice note deleted' })
  } catch (error) {
    console.error('DELETE /api/voice-notes/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
