import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

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
    const changes: Record<string, { old: any; new: any }> = {}

    if (name && name !== (existing as any).name) { updateData.name = name; changes.name = { old: (existing as any).name, new: name } }
    if (email !== undefined && email !== (existing as any).email) { updateData.email = email; changes.email = { old: (existing as any).email, new: email } }
    if (phone !== undefined && phone !== (existing as any).phone) { updateData.phone = phone; changes.phone = { old: (existing as any).phone, new: phone } }
    if (company !== undefined && company !== (existing as any).company) { updateData.company = company; changes.company = { old: (existing as any).company, new: company } }
    if (source !== undefined && source !== (existing as any).source) { updateData.source = source; changes.source = { old: (existing as any).source, new: source } }
    if (status && status !== (existing as any).status) { updateData.status = status; changes.status = { old: (existing as any).status, new: status } }
    if (priority && priority !== (existing as any).priority) { updateData.priority = priority; changes.priority = { old: (existing as any).priority, new: priority } }
    if (estimatedValue !== undefined) {
      const newVal = estimatedValue ? parseFloat(estimatedValue) : null
      if (newVal !== (existing as any).estimatedValue) {
        updateData.estimatedValue = newVal
        changes.estimatedValue = { old: (existing as any).estimatedValue, new: newVal }
      }
    }
    if (notes !== undefined && notes !== (existing as any).notes) { updateData.notes = notes; changes.notes = { old: (existing as any).notes, new: notes } }
    if (assignedToId !== undefined && assignedToId !== (existing as any).assignedToId) { updateData.assignedToId = assignedToId; changes.assignedToId = { old: (existing as any).assignedToId, new: assignedToId } }

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

    if (Object.keys(changes).length > 0) {
      const session = await auth()
      const userId = (session?.user as any)?.id || 'system'
      const userName = (session?.user as any)?.name || 'System'

      let description = `Updated lead "${(existing as any).name}"`
      if (changes.status) description = `Lead "${(existing as any).name}" status changed from ${changes.status.old} to ${changes.status.new}`
      if (changes.assignedToId) description = `Lead "${(existing as any).name}" reassigned`

      await db.auditLog.create({
        data: {
          userId,
          action: 'UPDATED',
          entityType: 'Lead',
          entityId: id,
          description,
          oldValues: changes,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      })
    }

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
