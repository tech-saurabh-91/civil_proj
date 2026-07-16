import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    const where: any = { isDeleted: false }
    if (projectId) where.projectId = projectId

    const documents = await db.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id

    const body = await req.json()
    const { projectId, title, type, fileData, filename, fileSize, mimeType, uploadedById } = body

    if (!projectId || !title || !filename) {
      return NextResponse.json({ error: 'projectId, title, and filename are required' }, { status: 400 })
    }

    const doc = await db.document.create({
      data: {
        project: { connect: { id: projectId } },
        title,
        type: type || 'OTHER',
        fileUrl: fileData || '',
        filename,
        fileSize: fileSize || 0,
        mimeType: mimeType || null,
        uploadedBy: { connect: { id: uploadedById || userId || 'system-user-001' } },
        createdBy: userId || null,
      },
    })

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (error) {
    console.error('POST document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
