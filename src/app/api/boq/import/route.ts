import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, items } = body

    if (!projectId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'projectId and items (non-empty array) are required' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.description || !item.category || !item.unit || item.quantity === undefined || item.unitRate === undefined) {
        return NextResponse.json(
          { success: false, error: 'Each item requires description, category, unit, quantity, and unitRate' },
          { status: 400 }
        )
      }
    }

    const createdItems = await Promise.all(
      items.map((item: any, idx: number) =>
        (db as any).bOQItem.create({
          data: {
            project: { connect: { id: projectId } },
            serialNumber: item.serialNumber || idx + 1,
            description: item.description,
            category: item.category,
            unit: item.unit,
            quantity: parseFloat(item.quantity),
            unitRate: parseFloat(item.unitRate),
            amount: parseFloat(item.quantity) * parseFloat(item.unitRate),
            notes: item.notes || null,
          },
        })
      )
    )

    return NextResponse.json(
      { success: true, data: createdItems, count: createdItems.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to import BOQ items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import BOQ items' },
      { status: 500 }
    )
  }
}
