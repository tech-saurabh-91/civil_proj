'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  GitBranch,
  Clock,
  CheckCircle,
  FileText,
  MoreHorizontal,
  Eye,
  Trash2,
  Workflow,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/components/ui/toast'

interface WorkflowStep {
  id: string
  stepNumber: number
  name: string
  status: string
}

interface WorkflowItem {
  id: string
  name: string
  description?: string
  status: string
  currentStep: number
  totalSteps: number
  createdAt: string
  project?: { id: string; name: string }
  steps: WorkflowStep[]
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-amber-100 text-amber-800',
}

const stepStatusColors: Record<string, string> = {
  DONE: 'bg-emerald-500 text-white',
  IN_PROGRESS: 'bg-blue-500 text-white',
  TODO: 'bg-gray-200 text-gray-500',
  BLOCKED: 'bg-red-500 text-white',
}

const stepLineColors: Record<string, string> = {
  DONE: 'bg-emerald-500',
  IN_PROGRESS: 'bg-blue-500',
  TODO: 'bg-gray-200',
  BLOCKED: 'bg-red-500',
}

const displayStatus: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'In Progress',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const stepDisplayStatus: Record<string, string> = {
  DONE: 'completed',
  IN_PROGRESS: 'in-progress',
  TODO: 'pending',
  BLOCKED: 'rejected',
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createProject, setCreateProject] = useState('')
  const [createSteps, setCreateSteps] = useState<string[]>([''])
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?limit=100')
      const data = await res.json()
      if (data.success) setProjects(data.data)
    } catch {
      showError('Failed to load projects')
    }
  }, [])

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '200' })
      if (statusFilter !== 'all') params.set('status', statusFilter.toUpperCase())
      if (projectFilter !== 'all') params.set('projectId', projectFilter)
      const res = await fetch(`/api/workflows?${params}`)
      const data = await res.json()
      if (data.success) setWorkflows(data.data)
    } catch {
      showError('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, projectFilter])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const projectsList = [...new Set(workflows.map((w) => w.project?.name).filter(Boolean))]

  const stats = [
    { label: 'Total Workflows', value: workflows.length, change: 0, trend: 'up' as const, color: 'info' as const, icon: <Workflow className="h-5 w-5" /> },
    { label: 'Active', value: workflows.filter((w) => w.status === 'ACTIVE').length, change: 0, trend: 'up' as const, color: 'success' as const, icon: <GitBranch className="h-5 w-5" /> },
    { label: 'Completed', value: workflows.filter((w) => w.status === 'COMPLETED').length, change: 0, trend: 'up' as const, color: 'success' as const, icon: <CheckCircle className="h-5 w-5" /> },
    { label: 'Draft', value: workflows.filter((w) => w.status === 'DRAFT').length, change: 0, trend: 'down' as const, color: 'warning' as const, icon: <FileText className="h-5 w-5" /> },
  ]

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showSuccess('Workflow deleted')
        fetchWorkflows()
      } else {
        showError(data.error || 'Failed to delete workflow')
      }
    } catch {
      showError('Failed to delete workflow')
    } finally {
      setDeletingId(null)
    }
  }

  const addCreateStep = () => setCreateSteps([...createSteps, ''])

  const removeCreateStep = (index: number) => {
    if (createSteps.length > 1) setCreateSteps(createSteps.filter((_, i) => i !== index))
  }

  const updateCreateStep = (index: number, value: string) => {
    const updated = [...createSteps]
    updated[index] = value
    setCreateSteps(updated)
  }

  const handleCreate = async () => {
    if (!createName.trim()) {
      showError('Workflow name is required')
      return
    }
    try {
      setCreating(true)
      const body: Record<string, unknown> = {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        projectId: createProject || undefined,
        steps: createSteps.filter((s) => s.trim()).map((s, i) => ({
          name: s.trim(),
          order: i + 1,
        })),
      }
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        showSuccess('Workflow created')
        setShowCreateDialog(false)
        setCreateName('')
        setCreateDesc('')
        setCreateProject('')
        setCreateSteps([''])
        fetchWorkflows()
      } else {
        showError(data.error || 'Failed to create workflow')
      }
    } catch {
      showError('Failed to create workflow')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workflow Management</h1>
          <p className="text-muted-foreground">Manage and track all project workflows and approvals.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">
              All Workflows ({filteredWorkflows.length})
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading workflows...</span>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No workflows found</h3>
              <p className="text-sm text-muted-foreground">Create your first workflow to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <GitBranch className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge
                              className={cn(
                                'text-[10px] capitalize',
                                statusColors[workflow.status]
                              )}
                            >
                              {displayStatus[workflow.status] || workflow.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{workflow.id.slice(0, 8)}</span>
                            {workflow.project && (
                              <>
                                <span>&middot;</span>
                                <span>{workflow.project.name}</span>
                              </>
                            )}
                            <span>&middot;</span>
                            <span>{formatDate(workflow.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {workflow.steps.length > 0 && (
                        <div className="ml-13">
                          <div className="flex items-center gap-1">
                            {workflow.steps.map((step, index) => (
                              <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold',
                                      stepStatusColors[step.status] || 'bg-gray-200 text-gray-500'
                                    )}
                                  >
                                    {index + 1}
                                  </div>
                                  <span className="mt-1 text-[10px] text-muted-foreground whitespace-nowrap max-w-[80px] text-center truncate">
                                    {step.name}
                                  </span>
                                </div>
                                {index < workflow.steps.length - 1 && (
                                  <div
                                    className={cn(
                                      'h-0.5 w-8 mx-0.5 mb-5',
                                      stepLineColors[step.status] || 'bg-gray-200'
                                    )}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-13 lg:ml-0">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Step {workflow.currentStep}/{workflow.totalSteps}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {deletingId === workflow.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/workflows/${workflow.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(workflow.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Workflow Name *</Label>
              <Input
                placeholder="e.g. Site Survey Approval"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this workflow..."
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={createProject} onValueChange={setCreateProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button variant="outline" size="sm" onClick={addCreateStep}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {createSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      placeholder={`Step ${index + 1} name`}
                      value={step}
                      onChange={(e) => updateCreateStep(index, e.target.value)}
                      className="flex-1"
                    />
                    {createSteps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeCreateStep(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Create Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
