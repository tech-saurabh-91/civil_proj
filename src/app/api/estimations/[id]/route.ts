import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const estimation = await db.costEstimation.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    })
    if (!estimation) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: estimation })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { actualAmount, description, category } = body

    const estimation = await db.costEstimation.update({
      where: { id },
      data: {
        ...(actualAmount !== undefined && { actualAmount: parseFloat(actualAmount) }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.costEstimation.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Estimation deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
