import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, role, notes } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    const request = await (db as any).accessRequest.findUnique({
      where: { id },
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      )
    }

    const updatedRequest = await (db as any).accessRequest.update({
      where: { id },
      data: { status, notes: notes || null },
    })

    if (status === 'APPROVED') {
      const existingUser = await db.user.findUnique({
        where: { email: request.email },
      })

      if (!existingUser) {
        const tempPassword = await bcrypt.hash('Welcome@123', 12)
        const nameParts = request.name.split(' ')
        const firstName = nameParts[0] || request.name
        const lastName = nameParts.slice(1).join(' ') || ''

        await db.user.create({
          data: {
            email: request.email,
            password: tempPassword,
            firstName,
            lastName,
            phone: request.phone || null,
            role: role || 'ENGINEER',
            isActive: true,
          },
        })
      } else {
        await db.user.update({
          where: { email: request.email },
          data: { isActive: true },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: status === 'APPROVED'
        ? 'Request approved. User account created with default password: Welcome@123'
        : 'Request rejected.',
    })
  } catch (error) {
    console.error('PATCH access request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const request = await (db as any).accessRequest.findUnique({
      where: { id },
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    await (db as any).accessRequest.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Access request deleted.',
    })
  } catch (error) {
    console.error('DELETE access request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
