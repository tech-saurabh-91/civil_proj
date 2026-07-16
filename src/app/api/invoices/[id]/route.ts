import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoice = await (db as any).invoice.findUnique({
      where: { id },
      include: {
        items: { where: { isDeleted: false } },
        project: { select: { id: true, name: true, code: true } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, status, dueDate, paidDate, notes, discountAmount, description } = body

    const existing = await (db as any).invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null
    if (notes !== undefined) updateData.notes = notes
    if (discountAmount !== undefined) {
      updateData.discountAmount = parseFloat(discountAmount)
      updateData.grandTotal = existing.totalAmount - parseFloat(discountAmount) + existing.taxAmount
    }

    const updated = await (db as any).invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: { where: { isDeleted: false } },
        project: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/invoices/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await (db as any).invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    await (db as any).invoice.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
