import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const hash = await bcrypt.hash('Admin@123', 10)
    const hash2 = await bcrypt.hash('Manager@123', 10)
    const hash3 = await bcrypt.hash('Engineer@123', 10)
    const hash4 = await bcrypt.hash('Surveyor@123', 10)
    const hash5 = await bcrypt.hash('Accountant@123', 10)
    const hash6 = await bcrypt.hash('Client@123', 10)

    const usersData = [
      // SUPER_ADMIN
      { email: 'superadmin@buildsurvey.in', password: hash, firstName: 'Super', lastName: 'Admin', phone: '9000000001', role: 'SUPER_ADMIN' as const, isActive: true },
      // ADMIN
      { email: 'admin@buildsurvey.in', password: hash, firstName: 'Saurabh', lastName: 'Singh', phone: '9000000002', role: 'ADMIN' as const, isActive: true },
      // MANAGER
      { email: 'priya.sharma@buildsurvey.in', password: hash2, firstName: 'Priya', lastName: 'Sharma', phone: '9000000003', role: 'MANAGER' as const, isActive: true },
      { email: 'manager2@buildsurvey.in', password: hash2, firstName: 'Rajesh', lastName: 'Kumar', phone: '9000000004', role: 'MANAGER' as const, isActive: true },
      // ENGINEER
      { email: 'raj.mehta@buildsurvey.in', password: hash3, firstName: 'Raj', lastName: 'Mehta', phone: '9000000005', role: 'ENGINEER' as const, isActive: true },
      { email: 'amit.patel@buildsurvey.in', password: hash3, firstName: 'Amit', lastName: 'Patel', phone: '9000000006', role: 'ENGINEER' as const, isActive: true },
      { email: 'vikram.singh@buildsurvey.in', password: hash3, firstName: 'Vikram', lastName: 'Singh', phone: '9000000007', role: 'ENGINEER' as const, isActive: true },
      { email: 'sneha.reddy@buildsurvey.in', password: hash3, firstName: 'Sneha', lastName: 'Reddy', phone: '9000000008', role: 'ENGINEER' as const, isActive: true },
      // SURVEYOR
      { email: 'neha.gupta@buildsurvey.in', password: hash4, firstName: 'Neha', lastName: 'Gupta', phone: '9000000009', role: 'SURVEYOR' as const, isActive: true },
      { email: 'rahul.verma@buildsurvey.in', password: hash4, firstName: 'Rahul', lastName: 'Verma', phone: '9000000010', role: 'SURVEYOR' as const, isActive: true },
      { email: 'anjali.nair@buildsurvey.in', password: hash4, firstName: 'Anjali', lastName: 'Nair', phone: '9000000011', role: 'SURVEYOR' as const, isActive: true },
      // ACCOUNTANT
      { email: 'accountant@buildsurvey.in', password: hash5, firstName: 'Suresh', lastName: 'Menon', phone: '9000000012', role: 'ACCOUNTANT' as const, isActive: true },
      // CLIENT
      { email: 'client@buildsurvey.in', password: hash6, firstName: 'Client', lastName: 'User', phone: '9000000013', role: 'CLIENT' as const, isActive: true },
    ]

    let created = 0
    let skipped = 0
    for (const u of usersData) {
      const existing = await db.user.findUnique({ where: { email: u.email } })
      if (!existing) {
        await db.user.create({ data: u })
        created++
      } else {
        skipped++
      }
    }

    return NextResponse.json({ success: true, message: 'Users seeded', created, skipped, total: usersData.length })
  } catch (error: any) {
    console.error('Seed users error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
