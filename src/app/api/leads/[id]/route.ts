import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        client: { select: { id: true, companyName: true, contactPerson: true, email: true, phone: true } },
      },
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: lead })
  } catch (error) {
    console.error('GET /api/leads/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body

    if (action === 'convert') {
      const lead = await db.lead.findUnique({ where: { id } })
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
      }

      if (lead.clientId) {
        return NextResponse.json({ success: false, error: 'Lead already converted' }, { status: 400 })
      }

      const client = await db.client.create({
        data: {
          companyName: lead.company || `${lead.name}'s Company`,
          contactPerson: lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          country: 'India',
        },
      })

      await db.lead.update({
        where: { id },
        data: { status: 'WON', clientId: client.id, convertedAt: new Date() },
      })

      return NextResponse.json({ success: true, data: { clientId: client.id } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/leads/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      name, email, phone, company, source, status, priority,
      estimatedValue, notes, assignedToId, clientId, convertedAt,
    } = body

    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    if ((existing as any).status === 'WON' || (existing as any).status === 'LOST') {
      return NextResponse.json({ success: false, error: 'Cannot modify a closed lead (Won/Lost)' }, { status: 400 })
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (source !== undefined) updateData.source = source
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null
    if (notes !== undefined) updateData.notes = notes
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    if (status === 'WON' && !(existing as any).clientId) {
      const client = await db.client.create({
        data: {
          companyName: (existing as any).company || `${(existing as any).name}'s Company`,
          contactPerson: (existing as any).name,
          email: (existing as any).email || '',
          phone: (existing as any).phone || '',
          country: 'India',
        },
      })
      updateData.clientId = client.id
      updateData.convertedAt = new Date()
    }

    const updated = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, companyName: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/leads/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    await db.lead.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/leads/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
