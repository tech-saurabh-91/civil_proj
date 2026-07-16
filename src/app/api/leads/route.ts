import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: any = { isDeleted: false }

    if (search) {
      const s = search.toLowerCase()
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { company: { contains: s, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status
    if (assignedTo) where.assignedToId = assignedTo

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          client: { select: { id: true, companyName: true } },
        },
      }),
      db.lead.count({ where }),
    ])

    const statusLabelMap: Record<string, string> = {
      NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified',
      PROPOSAL: 'Proposal Sent', NEGOTIATION: 'Negotiation',
      WON: 'Won', LOST: 'Lost',
    }
    const statusColorMap: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800', CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-purple-100 text-purple-800', PROPOSAL: 'bg-indigo-100 text-indigo-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800', WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    }
    const priorityLabelMap: Record<string, string> = {
      LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical',
    }
    const priorityColorMap: Record<string, string> = {
      LOW: 'text-gray-600', MEDIUM: 'text-yellow-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600',
    }

    return NextResponse.json({
      success: true,
      data: leads.map((l: any) => ({
        ...l,
        statusLabel: statusLabelMap[l.status] || l.status,
        statusColor: statusColorMap[l.status] || 'bg-gray-100 text-gray-800',
        priorityLabel: priorityLabelMap[l.priority] || l.priority,
        priorityColor: priorityColorMap[l.priority] || 'text-gray-600',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      priority,
      estimatedValue,
      notes,
      assignedToId,
      clientId,
      followUpDate,
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Lead name is required' },
        { status: 400 }
      )
    }

    const lead = await db.lead.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || null,
        status: status || 'NEW',
        priority: priority || 'MEDIUM',
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        notes: notes || null,
        assignedToId: assignedToId || null,
        clientId: clientId || null,
      },
    })

    try {
      const session = await auth()
      const userId = (session?.user as any)?.id || 'system'
      await db.auditLog.create({
        data: {
          userId,
          action: 'CREATED',
          entityType: 'Lead',
          entityId: lead.id,
          description: `Created new lead "${name}"`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })
    } catch {}

    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  } catch (error) {
    console.error('Failed to create lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
