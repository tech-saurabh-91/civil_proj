'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Plus, Trash2, GripVertical, Settings, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ApprovalLevel {
  level: number
  name: string
  description: string
  requiredRole: string
  allowForward: boolean
  allowEscalate: boolean
  allowReverse: boolean
  approverIds: string[]
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

const ROLE_OPTIONS = [
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'SURVEYOR', label: 'Surveyor' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

export default function ApprovalLevelsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as string

  const [numberOfLevels, setNumberOfLevels] = useState(0)
  const [levels, setLevels] = useState<ApprovalLevel[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?limit=200')
      const json = await res.json()
      if (json.users) setUsers(json.users)
    } catch {
      toast.error('Failed to load users')
    }
  }, [])

  const fetchApprovalLevels = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/approval-levels?entityType=Survey')
      const json = await res.json()
      if (json.success && json.data.length > 0) {
        setNumberOfLevels(json.data.length)
        setLevels(json.data.map((l: any) => ({
          level: l.level,
          name: l.name,
          description: l.description || '',
          requiredRole: l.requiredRole,
          allowForward: l.allowForward,
          allowEscalate: l.allowEscalate,
          allowReverse: l.allowReverse,
          approverIds: l.approvers?.map((a: any) => a.userId) || [],
        })))
        setExpandedLevel(1)
      }
    } catch {
      toast.error('Failed to load approval levels')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchApprovalLevels()
  }, [fetchUsers, fetchApprovalLevels])

  const handleLevelCountChange = (count: number) => {
    setNumberOfLevels(count)
    const newLevels: ApprovalLevel[] = []
    for (let i = 1; i <= count; i++) {
      const existing = levels.find((l) => l.level === i)
      newLevels.push(existing || {
        level: i,
        name: `Level ${i}`,
        description: '',
        requiredRole: ROLE_OPTIONS[Math.min(i - 1, ROLE_OPTIONS.length - 1)].value,
        allowForward: true,
        allowEscalate: i < count,
        allowReverse: i > 1,
        approverIds: [],
      })
    }
    setLevels(newLevels)
    if (count > 0) setExpandedLevel(1)
  }

  const updateLevel = (levelNum: number, field: keyof ApprovalLevel, value: any) => {
    setLevels((prev) => prev.map((l) =>
      l.level === levelNum ? { ...l, [field]: value } : l
    ))
  }

  const toggleApprover = (levelNum: number, userId: string) => {
    setLevels((prev) => prev.map((l) => {
      if (l.level !== levelNum) return l
      const ids = l.approverIds.includes(userId)
        ? l.approverIds.filter((id) => id !== userId)
        : [...l.approverIds, userId]
      return { ...l, approverIds: ids }
    }))
  }

  const handleSave = async () => {
    if (numberOfLevels === 0) {
      toast.error('Select at least 1 level')
      return
    }

    const hasEmptyName = levels.some((l) => !l.name.trim())
    if (hasEmptyName) {
      toast.error('All levels must have a name')
      return
    }

    const hasEmptyApprovers = levels.some((l) => l.approverIds.length === 0)
    if (hasEmptyApprovers) {
      toast.error('Each level must have at least 1 approver mapped')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/approval-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'Survey', levels }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Approval levels saved successfully')
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" description="Only Admin can manage approval levels" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Workflow Configuration"
        description="Configure how many approval levels and who approves at each level"
        actions={
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Configuration
          </Button>
        }
      />

      {/* Step 1: Select Number of Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" /> Step 1: How Many Approval Levels?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant={numberOfLevels === n ? 'default' : 'outline'}
                  size="lg"
                  className="w-14 h-14 text-lg font-bold"
                  onClick={() => handleLevelCountChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {numberOfLevels === 0 && 'Select number of levels'}
              {numberOfLevels === 1 && '1 level — single approver'}
              {numberOfLevels > 1 && `${numberOfLevels} levels — sequential approval chain`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Configure Each Level */}
      {levels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Step 2: Configure Each Level & Map Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {levels.map((level, idx) => {
              const isExpanded = expandedLevel === level.level
              const userCount = level.approverIds.length
              const matchedUsers = users.filter((u) => u.role === level.requiredRole || u.role === 'SUPER_ADMIN')

              return (
                <div key={level.level} className="border rounded-lg overflow-hidden">
                  {/* Level Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {level.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          value={level.name}
                          onChange={(e) => updateLevel(level.level, 'name', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-muted-foreground focus:border-primary focus:outline-none px-1 py-0.5"
                          placeholder={`Level ${level.level} Name`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {ROLE_OPTIONS.find((r) => r.value === level.requiredRole)?.label || level.requiredRole}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {userCount > 0 ? `${userCount} approver(s) mapped` : 'No approvers mapped'}
                        {idx < levels.length - 1 && ' → forwards to next level'}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>

                  {/* Level Config (Expanded) */}
                  {isExpanded && (
                    <div className="p-4 border-t bg-muted/30 space-y-4">
                      {/* Role & Description */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Required Role</label>
                          <select
                            value={level.requiredRole}
                            onChange={(e) => updateLevel(level.level, 'requiredRole', e.target.value)}
                            className="w-full mt-1 h-9 rounded-md border bg-background px-3 text-sm"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">Description</label>
                          <input
                            value={level.description}
                            onChange={(e) => updateLevel(level.level, 'description', e.target.value)}
                            className="w-full mt-1 h-9 rounded-md border bg-background px-3 text-sm"
                            placeholder="What this level approves"
                          />
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={level.allowForward}
                            onChange={(e) => updateLevel(level.level, 'allowForward', e.target.checked)}
                            className="rounded"
                          />
                          Allow Forward
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={level.allowEscalate}
                            onChange={(e) => updateLevel(level.level, 'allowEscalate', e.target.checked)}
                            className="rounded"
                          />
                          Allow Escalate
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={level.allowReverse}
                            onChange={(e) => updateLevel(level.level, 'allowReverse', e.target.checked)}
                            className="rounded"
                          />
                          Allow Reverse
                        </label>
                      </div>

                      {/* Map Users */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                          Map Users (who can approve at this level)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {matchedUsers.map((user) => (
                            <label
                              key={user.id}
                              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                level.approverIds.includes(user.id)
                                  ? 'bg-primary/10 border-primary'
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={level.approverIds.includes(user.id)}
                                onChange={() => toggleApprover(level.level, user.id)}
                                className="rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px] shrink-0">{user.role}</Badge>
                            </label>
                          ))}
                          {matchedUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground col-span-full py-2">
                              No users with role {level.requiredRole} found
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Workflow Preview */}
      {levels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Workflow Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-blue-100 text-blue-700">Engineer Submits</Badge>
              {levels.map((level, idx) => (
                <div key={level.level} className="flex items-center gap-2">
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-amber-100 text-amber-700">
                    Level {level.level}: {level.name}
                  </Badge>
                  {level.approverIds.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({level.approverIds.length} user{level.approverIds.length > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              ))}
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
