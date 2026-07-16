import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const existingClients = await db.client.count({ where: { isDeleted: false } })
    if (existingClients > 0) {
      return NextResponse.json({ success: true, message: 'Data already seeded', clients: existingClients })
    }

    const clientData = [
      { companyName: 'DLF', contactPerson: 'Rahul Mehta', email: 'rahul@dlf.in', phone: '+91-9876543210', address: 'DLF Cyber City, Gurgaon' },
      { companyName: 'Tata Projects', contactPerson: 'Vikram Singh', email: 'vikram@tataprojects.in', phone: '+91-9876543211', address: 'Tata Experience Centre, Hyderabad' },
      { companyName: 'L&T', contactPerson: 'Suresh Kumar', email: 'suresh@lt.com', phone: '+91-9876543212', address: 'L&T Campus, Chennai' },
      { companyName: 'Sobha Ltd', contactPerson: 'Anita Rao', email: 'anita@sobha.com', phone: '+91-9876543213', address: 'Sobha Dream Acres, Bangalore' },
      { companyName: 'Godrej', contactPerson: 'Priya Nair', email: 'priya@godrej.com', phone: '+91-9876543214', address: 'Godrej BKC, Mumbai' },
    ]

    const clients = []
    for (const c of clientData) {
      const client = await db.client.create({ data: c })
      clients.push(client)
    }

    const users = await db.user.findMany({ where: { isDeleted: false, role: { in: ['MANAGER', 'ADMIN'] } } })
    const managerId = users[0]?.id || null

    const projectData = [
      { name: 'Skyline Residency Tower', code: 'SRC-001', type: 'RESIDENTIAL' as const, status: 'IN_PROGRESS' as const, budget: 45000000, actualCost: 31500000, city: 'Gurgaon', floors: 22, area: 185000, clientId: clients[0].id, managerId },
      { name: 'Greenfield Industrial Park', code: 'GIP-002', type: 'INDUSTRIAL' as const, status: 'IN_PROGRESS' as const, budget: 120000000, actualCost: 72000000, city: 'Pune', floors: 4, area: 450000, clientId: clients[1].id, managerId },
      { name: 'Metro Station Complex', code: 'MSC-003', type: 'INFRASTRUCTURE' as const, status: 'IN_PROGRESS' as const, budget: 250000000, actualCost: 200000000, city: 'Mumbai', floors: 3, area: 320000, clientId: clients[2].id, managerId },
      { name: 'Lakeside Villas Phase II', code: 'LV2-004', type: 'RESIDENTIAL' as const, status: 'PLANNING' as const, budget: 60000000, actualCost: 4200000, city: 'Bangalore', floors: 8, area: 98000, clientId: clients[3].id, managerId },
      { name: 'Cyber Tech Park', code: 'CTP-005', type: 'COMMERCIAL' as const, status: 'IN_PROGRESS' as const, budget: 180000000, actualCost: 144000000, city: 'Hyderabad', floors: 15, area: 280000, clientId: clients[4].id, managerId },
      { name: 'Heritage Mall Renovation', code: 'HMR-006', type: 'COMMERCIAL' as const, status: 'ON_HOLD' as const, budget: 35000000, actualCost: 14000000, city: 'Delhi', floors: 4, area: 75000, clientId: clients[0].id, managerId },
      { name: 'Coastal Highway Bridge', code: 'CHB-007', type: 'INFRASTRUCTURE' as const, status: 'IN_PROGRESS' as const, budget: 350000000, actualCost: 280000000, city: 'Chennai', floors: 0, area: 120000, clientId: clients[2].id, managerId },
      { name: 'Smart City Township', code: 'SCT-008', type: 'RESIDENTIAL' as const, status: 'COMPLETED' as const, budget: 90000000, actualCost: 87000000, city: 'Nagpur', floors: 12, area: 210000, clientId: clients[1].id, managerId },
      { name: 'IT SEZ Tower B', code: 'IST-009', type: 'COMMERCIAL' as const, status: 'IN_PROGRESS' as const, budget: 75000000, actualCost: 22500000, city: 'Pune', floors: 18, area: 160000, clientId: clients[4].id, managerId },
      { name: 'Waterfront Apartments', code: 'WFA-010', type: 'RESIDENTIAL' as const, status: 'IN_PROGRESS' as const, budget: 55000000, actualCost: 41250000, city: 'Mumbai', floors: 14, area: 115000, clientId: clients[3].id, managerId },
      { name: 'Warehouse District Hub', code: 'WDH-011', type: 'INDUSTRIAL' as const, status: 'PLANNING' as const, budget: 40000000, actualCost: 2000000, city: 'Nagpur', floors: 1, area: 380000, clientId: clients[2].id, managerId },
      { name: 'Downtown Office Complex', code: 'DOC-012', type: 'COMMERCIAL' as const, status: 'COMPLETED' as const, budget: 110000000, actualCost: 105000000, city: 'Delhi', floors: 20, area: 240000, clientId: clients[0].id, managerId },
    ]

    for (const p of projectData) {
      await db.project.create({ data: p })
    }

    return NextResponse.json({ success: true, message: 'Seeded clients and projects', clients: clients.length, projects: projectData.length })
  } catch (error: any) {
    console.error('Seed error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
