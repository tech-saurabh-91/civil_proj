import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true, contactPerson: true, email: true, phone: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        surveys: {
          where: { isDeleted: false },
          select: { id: true, title: true, status: true, scheduledDate: true, completedDate: true, engineerId: true, type: true, gpsLatitude: true, gpsLongitude: true },
          orderBy: { createdAt: 'desc' },
        },
        boqItems: { where: { isDeleted: false }, select: { id: true, serialNumber: true, description: true, category: true, quantity: true, unitRate: true, amount: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const surveyIds = project.surveys.map((s: any) => s.id)

    const [photos, measurements, risks, materials, activities] = await Promise.all([
      surveyIds.length > 0
        ? db.photo.findMany({ where: { surveyId: { in: surveyIds }, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 20 })
        : [],
      surveyIds.length > 0
        ? db.measurement.findMany({ where: { surveyId: { in: surveyIds }, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 20 })
        : [],
      surveyIds.length > 0
        ? db.riskAssessment.findMany({ where: { surveyId: { in: surveyIds }, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 20 })
        : [],
      surveyIds.length > 0
        ? db.materialRequirement.findMany({ where: { surveyId: { in: surveyIds }, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 20 })
        : [],
      db.activity.findMany({ where: { projectId: id, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ])

    return NextResponse.json({
      success: true,
      data: { ...project, photos, measurements, risks, materials, activities },
    })
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      name, description, type, status, startDate, endDate,
      budget, actualCost, address, city, state, latitude, longitude,
      area, floors, managerId, leadUserId,
    } = body

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type) {
      const typeMap: Record<string, string> = {
        'residential': 'RESIDENTIAL', 'commercial': 'COMMERCIAL', 'industrial': 'INDUSTRIAL',
        'infrastructure': 'INFRASTRUCTURE', 'interior': 'INTERIOR', 'mep': 'MEP', 'renovation': 'RENOVATION',
      }
      const validTypes = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'INTERIOR', 'MEP', 'RENOVATION']
      const normalized = typeMap[type.toLowerCase()] || type
      updateData.type = validTypes.includes(normalized) ? normalized : 'RESIDENTIAL'
    }
    if (status) updateData.status = status
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost)
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null
    if (floors !== undefined) updateData.floors = parseInt(floors, 10)
    if (managerId !== undefined) {
      updateData.manager = managerId ? { connect: { id: managerId } } : { disconnect: true }
    }
    if (leadUserId !== undefined) {
      updateData.leadUser = leadUserId ? { connect: { id: leadUserId } } : { disconnect: true }
    }

    const updated = await db.project.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, companyName: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    await db.project.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Project deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
