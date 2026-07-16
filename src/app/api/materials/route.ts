import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const surveyId = searchParams.get('surveyId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { isDeleted: false }
    if (surveyId) where.surveyId = surveyId

    const materials = await db.materialRequirement.findMany({
      where,
      include: {
        survey: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: materials })
  } catch (error) {
    console.error('GET /api/materials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { surveyId, materialName, specification, quantity, unit, estimatedCost, supplier, notes } = body

    if (!surveyId || !materialName || !quantity || !unit) {
      return NextResponse.json({ error: 'surveyId, materialName, quantity, and unit are required' }, { status: 400 })
    }

    const material = await db.materialRequirement.create({
      data: {
        survey: { connect: { id: surveyId } },
        materialName,
        specification: specification || null,
        quantity: parseFloat(quantity),
        unit,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        supplier: supplier || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: material }, { status: 201 })
  } catch (error) {
    console.error('POST /api/materials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
