import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (projectId) where.projectId = projectId

    const estimations = await db.costEstimation.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: estimations })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, category, description, estimatedAmount, actualAmount } = body

    if (!category || !estimatedAmount || !projectId) {
      return NextResponse.json({ error: 'Category, estimatedAmount, and projectId are required' }, { status: 400 })
    }

    const estimation = await db.costEstimation.create({
      data: {
        project: { connect: { id: projectId } },
        category,
        description: description || null,
        estimatedAmount: parseFloat(estimatedAmount),
        actualAmount: actualAmount ? parseFloat(actualAmount) : null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: estimation })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
