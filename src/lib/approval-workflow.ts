import { db } from '@/lib/db'

export interface ApprovalLevelConfig {
  level: number
  name: string
  description: string
  requiredRole: string
  allowForward: boolean
  allowEscalate: boolean
  allowReverse: boolean
}

export async function getApprovalWorkflow(entityType: string = 'Survey'): Promise<ApprovalLevelConfig[]> {
  const configs = await db.approvalLevelConfig.findMany({
    where: { entityType, isActive: true, isDeleted: false },
    orderBy: { level: 'asc' },
  })
  return configs.map((c: any) => ({
    level: c.level,
    name: c.name,
    description: c.description || '',
    requiredRole: c.requiredRole,
    allowForward: c.allowForward,
    allowEscalate: c.allowEscalate,
    allowReverse: c.allowReverse,
  }))
}

export async function getNextLevel(entityType: string, currentLevel: number): Promise<number | null> {
  const workflow = await getApprovalWorkflow(entityType)
  const next = currentLevel + 1
  if (next > workflow.length) return null
  return next
}

export async function getPrevLevel(entityType: string, currentLevel: number): Promise<number | null> {
  if (currentLevel <= 1) return null
  return currentLevel - 1
}

export async function getLevelConfig(entityType: string, level: number): Promise<ApprovalLevelConfig | undefined> {
  const workflow = await getApprovalWorkflow(entityType)
  return workflow.find((l) => l.level === level)
}

export async function canUserApproveAtLevel(userRole: string, entityType: string, level: number): Promise<boolean> {
  const config = await getLevelConfig(entityType, level)
  if (!config) return false
  if (userRole === 'SUPER_ADMIN') return true
  return config.requiredRole === userRole
}

export async function getTotalLevels(entityType: string = 'Survey'): Promise<number> {
  const count = await db.approvalLevelConfig.count({
    where: { entityType, isActive: true, isDeleted: false },
  })
  return count
}

export async function seedDefaultApprovalLevels() {
  const existing = await db.approvalLevelConfig.count({
    where: { entityType: 'Survey' },
  })
  if (existing > 0) return

  const defaults = [
    { level: 1, name: 'Supervisor Review', description: 'Peer or supervisor reviews the survey data', requiredRole: 'ENGINEER', allowForward: true, allowEscalate: true, allowReverse: false },
    { level: 2, name: 'Manager Review', description: 'Project manager approves field work', requiredRole: 'MANAGER', allowForward: true, allowEscalate: true, allowReverse: true },
    { level: 3, name: 'Admin Review', description: 'Administrator reviews compliance', requiredRole: 'ADMIN', allowForward: false, allowEscalate: true, allowReverse: true },
    { level: 4, name: 'Final Approval', description: 'Final authorization — locks survey', requiredRole: 'SUPER_ADMIN', allowForward: false, allowEscalate: false, allowReverse: true },
  ]

  for (const d of defaults) {
    await db.approvalLevelConfig.create({
      data: { ...d, entityType: 'Survey' },
    })
  }
}
