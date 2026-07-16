import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const projectId = searchParams.get('projectId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const where: any = { isDeleted: false }

    if (search) {
      const s = search.toLowerCase()
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
      ]
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      (db as any).invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, code: true } },
          items: { where: { isDeleted: false } },
        },
      }),
      (db as any).invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, projectId, items, description, dueDate, notes, discountAmount, quotationId } = body

    if (!title || !projectId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'title, projectId, and items (non-empty array) are required' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.description || !item.unit || item.quantity === undefined || item.unitRate === undefined) {
        return NextResponse.json(
          { success: false, error: 'Each item requires description, unit, quantity, and unitRate' },
          { status: 400 }
        )
      }
    }

    const lastInvoice = await (db as any).invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    })

    let nextNum = 1
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-')
      const last = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(last)) nextNum = last + 1
    }
    const year = new Date().getFullYear()
    const invoiceNumber = `INV-${year}-${String(nextNum).padStart(3, '0')}`

    const computedItems = items.map((item: any) => ({
      description: item.description,
      unit: item.unit,
      quantity: parseFloat(item.quantity),
      unitRate: parseFloat(item.unitRate),
      amount: parseFloat(item.quantity) * parseFloat(item.unitRate),
    }))

    const totalAmount = computedItems.reduce((sum: number, item: any) => sum + item.amount, 0)
    const discount = parseFloat(discountAmount) || 0
    const afterDiscount = totalAmount - discount
    const taxAmount = afterDiscount * 0.18
    const grandTotal = afterDiscount + taxAmount

    const invoice = await (db as any).invoice.create({
      data: {
        invoiceNumber,
        title,
        description: description || null,
        project: { connect: { id: projectId } },
        quotationId: quotationId || null,
        totalAmount,
        taxAmount,
        discountAmount: discount,
        grandTotal,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        items: {
          create: computedItems,
        },
      },
      include: {
        items: true,
        project: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
