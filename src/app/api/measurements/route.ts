import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const surveyId = searchParams.get('surveyId')

    const where: any = {}
    if (surveyId) where.surveyId = surveyId

    const [measurements, total] = await Promise.all([
      db.measurement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          survey: { select: { id: true, title: true, project: { select: { name: true } } } },
        },
      }),
      db.measurement.count({ where }),
    ])

    return NextResponse.json({ success: true, data: measurements, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('GET /api/measurements error:', error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { surveyId, category, description, length, width, height, area, volume, unit } = body

    if (!surveyId || !category) {
      return NextResponse.json({ success: false, error: 'surveyId and category are required' }, { status: 400 })
    }

    const measurement = await db.measurement.create({
      data: {
        surveyId,
        category,
        description: description || '',
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        area: area ? parseFloat(area) : null,
        volume: volume ? parseFloat(volume) : null,
        unit: unit || 'm',
      },
    })

    return NextResponse.json({ success: true, data: measurement })
  } catch (error: any) {
    console.error('POST /api/measurements error:', error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
