import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id
    const userRole = (session?.user as any)?.role

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const whereLeads: any = { isDeleted: false }
    const whereProjects: any = { isDeleted: false }
    const whereSurveys: any = { isDeleted: false, engineerId: userId }

    if (userRole === 'ENGINEER' || userRole === 'SURVEYOR') {
      whereLeads.assignedToId = userId
      whereProjects.OR = [{ managerId: userId }]
    }

    const [leads, projects, surveys] = await Promise.all([
      db.lead.findMany({
        where: whereLeads,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true } },
        },
      }),
      db.project.findMany({
        where: whereProjects,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true } },
          _count: { select: { surveys: true } },
        },
      }),
      db.survey.findMany({
        where: whereSurveys,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { name: true } },
          _count: { select: { checklistItems: true, photos: true } },
        },
      }),
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

    return NextResponse.json({
      success: true,
      data: {
        leads: leads.map((l: any) => ({
          ...l,
          statusLabel: statusLabelMap[l.status] || l.status,
          statusColor: statusColorMap[l.status] || 'bg-gray-100 text-gray-800',
        })),
        projects,
        surveys: surveys.map((s: any) => ({
          id: s.id,
          title: s.title,
          project: s.project?.name || '',
          type: s.type?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || '',
          status: s.status,
          scheduledDate: s.scheduledDate ? new Date(s.scheduledDate).toISOString().split('T')[0] : '',
          checklistTotal: s._count.checklistItems,
          photoCount: s._count.photos,
          createdAt: s.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/my-assignments error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
