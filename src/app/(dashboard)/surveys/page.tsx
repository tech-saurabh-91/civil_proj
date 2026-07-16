'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  AlertTriangle, ArrowLeft, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardClock, Clock, Download, FileText, Filter, Image as ImageIcon,
  LayoutGrid, MapPin, Mic, MoreHorizontal, Navigation, Plus, Search,
  TableIcon, X, Zap, Eye, Play, FileDown, Share2, Map,
  CheckSquare, Calendar, Users, Trash2, Loader2, Send, PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SurveyData {
  id: string
  title: string
  description: string | null
  project: string
  projectId: string
  type: string
  status: string
  engineer: { id: string; name: string; email: string; initials: string } | null
  scheduledDate: string
  hasGps: boolean
  gpsLatitude: number | null
  gpsLongitude: number | null
  duration: string | null
  checklistTotal: number
  checklistCompleted: number
  photoCount: number
  voiceNoteCount: number
  videoCount: number
  siteVisitCount: number
  weatherCondition: string | null
  siteCondition: string | null
  notes: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700',
  MANAGER_APPROVED: 'bg-teal-100 text-teal-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  MANAGER_APPROVED: 'Manager Approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
}

export default function SurveysPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as string | undefined
  const userId = (session?.user as any)?.id as string | undefined
  const canApprove = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [surveys, setSurveys] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignSurveyId, setAssignSurveyId] = useState<string | null>(null)
  const [assignEngineerId, setAssignEngineerId] = useState<string>('')
  const [engineers, setEngineers] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [engineersLoading, setEngineersLoading] = useState(false)

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/surveys?limit=200', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setSurveys(json.data ?? [])
    } catch {
      toast.error('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSurveys()
  }, [fetchSurveys])

  const openAssignDialog = async (surveyId: string) => {
    setAssignSurveyId(surveyId)
    setAssignEngineerId('')
    setAssignDialogOpen(true)
    if (engineers.length === 0) {
      setEngineersLoading(true)
      try {
        const res = await fetch('/api/users?role=ENGINEER&limit=50')
        const json = await res.json()
        const list = json.data ?? json.users ?? []
        setEngineers(list.filter((u: any) => u.role === 'ENGINEER' || u.role === 'SURVEYOR'))
      } catch {} finally {
        setEngineersLoading(false)
      }
    }
  }

  const handleAssign = async () => {
    if (!assignSurveyId || !assignEngineerId) return
    try {
      setActionLoading(assignSurveyId)
      const res = await fetch('/api/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignSurveyId, engineerId: assignEngineerId, status: 'ASSIGNED' }),
      })
      const json = await res.json()
      if (json.success) {
        const eng = engineers.find((e) => e.id === assignEngineerId)
        setSurveys((prev) =>
          prev.map((s) =>
            s.id === assignSurveyId
              ? { ...s, status: 'ASSIGNED', engineer: eng ? { id: eng.id, name: `${eng.firstName} ${eng.lastName}`, email: '', initials: `${eng.firstName[0]}${eng.lastName[0]}`.toUpperCase() } : s.engineer }
              : s
          )
        )
        toast.success('Engineer assigned successfully')
        setAssignDialogOpen(false)
      } else {
        toast.error(json.error || 'Failed to assign')
      }
    } catch {
      toast.error('Failed to assign engineer')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.project.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      const matchType = typeFilter === 'all' || s.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [surveys, searchQuery, statusFilter, typeFilter])

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage)
  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const summaryStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const draft = surveys.filter((s) => s.status === 'DRAFT').length
    const inProgress = surveys.filter((s) => s.status === 'IN_PROGRESS').length
    const pendingReview = surveys.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length
    const completed = surveys.filter((s) => s.status === 'APPROVED' || s.status === 'COMPLETED').length
    const overdue = surveys.filter(
      (s) => s.scheduledDate && s.scheduledDate < today && s.status !== 'APPROVED' && s.status !== 'COMPLETED'
    ).length
    const noEngineer = surveys.filter((s) => !s.engineer).length
    return { draft, inProgress, pendingReview, completed, overdue, noEngineer }
  }, [surveys])

  const handleStatusChange = async (surveyId: string, newStatus: string) => {
    try {
      setActionLoading(surveyId)
      const res = await fetch('/api/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: surveyId, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setSurveys((prev) =>
          prev.map((s) => (s.id === surveyId ? { ...s, status: newStatus } : s))
        )
        toast.success(`Survey ${STATUS_LABELS[newStatus] || newStatus.toLowerCase()}`)
      } else {
        toast.error(json.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update survey')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprovalAction = async (surveyId: string, action: string) => {
    try {
      setActionLoading(surveyId)
      const res = await fetch(`/api/surveys/${surveyId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        fetchSurveys()
      } else {
        toast.error(json.error || 'Action failed')
      }
    } catch {
      toast.error('Approval action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (surveyId: string) => {
    if (!confirm('Delete this survey?')) return
    try {
      setActionLoading(surveyId)
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setSurveys((prev) => prev.filter((s) => s.id !== surveyId))
        toast.success('Survey deleted')
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete survey')
    } finally {
      setActionLoading(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all'

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Site Surveys"
          description="Manage and track all construction site surveys"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Surveys' }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading surveys...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Site Surveys"
          description="Manage and track all construction site surveys"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Surveys' }]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/surveys/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> New Survey
                </Button>
              </Link>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<FileText className="h-6 w-6" />} label="Total Surveys" value={surveys.length} color="info" />
          <StatCard icon={<ClipboardClock className="h-6 w-6" />} label="Draft" value={summaryStats.draft} color="info" />
          <StatCard icon={<Play className="h-6 w-6" />} label="In Progress" value={summaryStats.inProgress} color="warning" />
          <StatCard icon={<Clock className="h-6 w-6" />} label="Pending Review" value={summaryStats.pendingReview} color="info" />
          <StatCard icon={<CheckCircle2 className="h-6 w-6" />} label="Completed" value={summaryStats.completed} color="success" />
          <StatCard icon={<AlertTriangle className="h-6 w-6" />} label="Overdue" value={summaryStats.overdue} color="danger" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search surveys..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Initial">Initial</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="As Built">As Built</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredSurveys.length} of {surveys.length}
                </span>
              </div>
              <div className="flex-1" />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedSurveys.map((survey) => {
              const progress = survey.checklistTotal > 0
                ? Math.round((survey.checklistCompleted / survey.checklistTotal) * 100)
                : 0
              return (
                <Card key={survey.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Link href={`/surveys/${survey.id}`} className="font-semibold text-sm hover:underline line-clamp-2">
                        {survey.title}
                      </Link>
                      <Badge className={cn('text-[10px] shrink-0 ml-2', STATUS_COLORS[survey.status])}>
                        {STATUS_LABELS[survey.status] || survey.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{survey.project} &middot; {survey.type}</p>
                    <Progress value={progress} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{progress}% complete</span>
                      <span>{survey.checklistCompleted}/{survey.checklistTotal} checks</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        {survey.engineer ? (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">{survey.engineer.initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[100px]">{survey.engineer.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {survey.hasGps && <Navigation className="h-3 w-3 text-emerald-500" />}
                        {survey.photoCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Camera className="h-3 w-3" /> {survey.photoCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              {filteredSurveys.length === 0 ? (
                <EmptyState
                  icon={<ClipboardClock className="h-6 w-6" />}
                  title="No surveys found"
                  description={surveys.length === 0 ? 'Create your first survey to get started.' : 'No surveys match your filters.'}
                  action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedIds.length === paginatedSurveys.length && paginatedSurveys.length > 0}
                              onCheckedChange={() => {
                                if (selectedIds.length === paginatedSurveys.length) setSelectedIds([])
                                else setSelectedIds(paginatedSurveys.map((s) => s.id))
                              }}
                            />
                          </TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Engineer</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                          <TableHead className="w-[30px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSurveys.map((survey) => {
                          const progress = survey.checklistTotal > 0
                            ? Math.round((survey.checklistCompleted / survey.checklistTotal) * 100)
                            : 0
                          const isActionLoading = actionLoading === survey.id

                          return (
                            <React.Fragment key={survey.id}>
                              <TableRow>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedIds.includes(survey.id)}
                                    onCheckedChange={() => {
                                      setSelectedIds((prev) =>
                                        prev.includes(survey.id) ? prev.filter((i) => i !== survey.id) : [...prev, survey.id]
                                      )
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Link href={`/surveys/${survey.id}`} className="font-medium text-sm hover:underline">
                                    {survey.title}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-sm">{survey.project}</TableCell>
                                <TableCell>
                                  {survey.engineer ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px]">{survey.engineer.initials}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{survey.engineer.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">{survey.type}</TableCell>
                                <TableCell>
                                  <Badge className={cn('text-[10px]', STATUS_COLORS[survey.status])}>
                                    {STATUS_LABELS[survey.status] || survey.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="w-[90px]">
                                    <Progress value={progress} className="h-1.5" />
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                      {survey.checklistCompleted}/{survey.checklistTotal}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {survey.scheduledDate || '—'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-0.5">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                          <Link href={`/surveys/${survey.id}`}>
                                            <Eye className="h-3.5 w-3.5" />
                                          </Link>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>View</TooltipContent>
                                    </Tooltip>

                                    {survey.status === 'DRAFT' || survey.status === 'ASSIGNED' ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={() => handleStatusChange(survey.id, 'IN_PROGRESS')}
                                          >
                                            <PlayCircle className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Start Survey</TooltipContent>
                                      </Tooltip>
                                    ) : survey.status === 'IN_PROGRESS' ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={() => handleStatusChange(survey.id, 'SUBMITTED')}
                                          >
                                            <Send className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Submit</TooltipContent>
                                      </Tooltip>
                                    ) : survey.status === 'SUBMITTED' && canApprove && userId !== survey.engineer?.id ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={() => handleApprovalAction(survey.id, 'APPROVE')}
                                          >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Approve</TooltipContent>
                                      </Tooltip>
                                    ) : survey.status === 'MANAGER_APPROVED' && canApprove && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={() => handleApprovalAction(survey.id, 'APPROVE')}
                                          >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Final Approve</TooltipContent>
                                      </Tooltip>
                                    ) : null}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/surveys/${survey.id}`)}>
                                          <Eye className="h-4 w-4 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        {(survey.status === 'APPROVED' || survey.status === 'REJECTED' || survey.status === 'COMPLETED') && (
                                          <DropdownMenuItem onClick={() => router.push(`/surveys/${survey.id}/report`)}>
                                            <FileText className="h-4 w-4 mr-2" /> View Report
                                          </DropdownMenuItem>
                                        )}
                                        {survey.status === 'DRAFT' && (
                                          <DropdownMenuItem onClick={() => openAssignDialog(survey.id)}>
                                            <Users className="h-4 w-4 mr-2" /> Assign Engineer
                                          </DropdownMenuItem>
                                        )}
                                        {survey.status === 'IN_PROGRESS' && (
                                          <DropdownMenuItem onClick={() => handleStatusChange(survey.id, 'SUBMITTED')}>
                                            <Send className="h-4 w-4 mr-2" /> Submit Survey
                                          </DropdownMenuItem>
                                        )}
                                        {survey.status === 'SUBMITTED' && canApprove && userId !== survey.engineer?.id && (
                                          <DropdownMenuItem onClick={() => handleApprovalAction(survey.id, 'APPROVE')}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                          </DropdownMenuItem>
                                        )}
                                        {survey.status === 'MANAGER_APPROVED' && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                                          <DropdownMenuItem onClick={() => handleApprovalAction(survey.id, 'APPROVE')}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Final Approve
                                          </DropdownMenuItem>
                                        )}
                                        {(survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED') && canApprove && userId !== survey.engineer?.id && (
                                          <DropdownMenuItem onClick={() => handleApprovalAction(survey.id, 'REJECT')} className="text-red-600">
                                            <AlertTriangle className="h-4 w-4 mr-2" /> Reject
                                          </DropdownMenuItem>
                                        )}
                                        {(survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED') && canApprove && userId !== survey.engineer?.id && (
                                          <DropdownMenuItem onClick={() => handleApprovalAction(survey.id, 'ESCALATE')}>
                                            <Navigation className="h-4 w-4 mr-2" /> Escalate
                                          </DropdownMenuItem>
                                        )}
                                        {(survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED') && canApprove && userId !== survey.engineer?.id && (
                                          <DropdownMenuItem onClick={() => handleApprovalAction(survey.id, 'REVERSE')}>
                                            <ArrowLeft className="h-4 w-4 mr-2" /> Reverse
                                          </DropdownMenuItem>
                                        )}
                                        {(survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED') && (!canApprove || userId === survey.engineer?.id) && (
                                          <DropdownMenuItem disabled>
                                            <Clock className="h-4 w-4 mr-2" /> Pending Review
                                          </DropdownMenuItem>
                                        )}
                                        {(survey.status === 'DRAFT' || survey.status === 'ASSIGNED') && (
                                          <DropdownMenuItem onClick={() => handleStatusChange(survey.id, 'IN_PROGRESS')}>
                                            <PlayCircle className="h-4 w-4 mr-2" /> Start Survey
                                          </DropdownMenuItem>
                                        )}
                                        {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleDelete(survey.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setExpandedRow(expandedRow === survey.id ? null : survey.id)
                                    }
                                  >
                                    <ChevronDown
                                      className={cn(
                                        'h-4 w-4 transition-transform',
                                        expandedRow === survey.id && 'rotate-180'
                                      )}
                                    />
                                  </Button>
                                </TableCell>
                              </TableRow>

                              {expandedRow === survey.id && (
                                <TableRow key={`${survey.id}-expanded`}>
                                  <TableCell colSpan={10} className="p-0">
                                    <div className="border-t bg-muted/30 px-6 py-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                          <span className="text-muted-foreground">Description:</span>{' '}
                                          <span>{survey.description || '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Weather:</span>{' '}
                                          <span>{survey.weatherCondition || '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Site Condition:</span>{' '}
                                          <span>{survey.siteCondition || '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">GPS:</span>{' '}
                                          <span>
                                            {survey.hasGps
                                              ? `${survey.gpsLatitude?.toFixed(4)}, ${survey.gpsLongitude?.toFixed(4)}`
                                              : 'Not logged'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Photos:</span>{' '}
                                          <span>{survey.photoCount}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Voice Notes:</span>{' '}
                                          <span>{survey.voiceNoteCount}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Site Visits:</span>{' '}
                                          <span>{survey.siteVisitCount}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Duration:</span>{' '}
                                          <span>{survey.duration || '—'}</span>
                                        </div>
                                      </div>
                                      {survey.notes && (
                                        <div className="rounded-lg border bg-background p-3 text-sm">
                                          <span className="font-medium">Notes:</span> {survey.notes}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows:</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(v) => {
                          setItemsPerPage(Number(v))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 15, 25, 50].map((opt) => (
                            <SelectItem key={opt} value={String(opt)}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {(currentPage - 1) * itemsPerPage + 1}–
                        {Math.min(currentPage * itemsPerPage, filteredSurveys.length)} of{' '}
                        {filteredSurveys.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assign Engineer Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Engineer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {engineersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : engineers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No engineers found. Create engineers first.</p>
              ) : (
                <Select value={assignEngineerId} onValueChange={setAssignEngineerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineers.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!assignEngineerId || !!actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
