import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: workflow })
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
    const { status, name, description, currentStep } = body

    const workflow = await db.workflow.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(currentStep !== undefined && { currentStep }),
      },
      include: {
        project: { select: { id: true, name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: workflow })
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
    await db.workflowStep.deleteMany({ where: { workflowId: id } })
    await db.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Workflow deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
