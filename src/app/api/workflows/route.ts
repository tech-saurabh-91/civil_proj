import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (projectId) where.projectId = projectId

    const [workflows, total] = await Promise.all([
      db.workflow.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          steps: { orderBy: { stepNumber: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.workflow.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: workflows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET workflows error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, projectId, steps } = body

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Name and project are required' }, { status: 400 })
    }

    const workflow = await db.workflow.create({
      data: {
        name,
        description: description || null,
        project: { connect: { id: projectId } },
        totalSteps: steps ? steps.length : 1,
        steps: steps
          ? {
              create: steps.map((s: any, i: number) => ({
                stepNumber: s.stepNumber || i + 1,
                name: s.name,
                description: s.description || null,
                status: 'TODO' as const,
              })),
            }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error('POST workflow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
