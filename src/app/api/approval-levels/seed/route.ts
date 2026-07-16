import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const existing = await (db as any).approvalLevelConfig.count({
      where: { entityType: 'Survey' },
    })

    if (existing > 0) {
      return NextResponse.json({ success: true, message: 'Approval levels already exist', count: existing })
    }

    const defaults = [
      { entityType: 'Survey', level: 1, name: 'Supervisor Review', description: 'Peer or supervisor reviews the survey data', requiredRole: 'ENGINEER', allowForward: true, allowEscalate: true, allowReverse: false },
      { entityType: 'Survey', level: 2, name: 'Manager Review', description: 'Project manager approves field work', requiredRole: 'MANAGER', allowForward: true, allowEscalate: true, allowReverse: true },
      { entityType: 'Survey', level: 3, name: 'Admin Review', description: 'Administrator reviews compliance', requiredRole: 'ADMIN', allowForward: false, allowEscalate: true, allowReverse: true },
      { entityType: 'Survey', level: 4, name: 'Final Approval', description: 'Final authorization — locks survey', requiredRole: 'SUPER_ADMIN', allowForward: false, allowEscalate: false, allowReverse: true },
    ]

    const result = await (db as any).approvalLevelConfig.createMany({
      data: defaults,
    })

    return NextResponse.json({ success: true, message: 'Default approval levels seeded', count: result.count })
  } catch (error: any) {
    console.error('Seed approval levels error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
