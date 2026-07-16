'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ClipboardList,
  FolderKanban,
  Phone,
  Mail,
  Building2,
  Calendar,
  IndianRupee,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Send,
  MessageSquare,
  Navigation,
  PlayCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { showSuccess, showError } from '@/components/ui/toast'

interface AssignedLead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: string
  statusLabel: string
  statusColor: string
  priority: string
  estimatedValue: number | null
  source: string
  notes: string
  createdAt: string
  client: { id: string; companyName: string } | null
}

interface AssignedProject {
  id: string
  name: string
  code: string
  status: string
  type: string
  budget: number | null
  startDate: string | null
  endDate: string | null
  city: string | null
  client: { id: string; companyName: string } | null
  _count: { surveys: number }
}

interface AssignedSurvey {
  id: string
  title: string
  project: string
  type: string
  status: string
  scheduledDate: string
  checklistTotal: number
  photoCount: number
  createdAt: string
}

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
const priorityColorMap: Record<string, string> = {
  LOW: 'text-gray-600', MEDIUM: 'text-yellow-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600',
}

export default function MyAssignmentsPage() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  const [leads, setLeads] = useState<AssignedLead[]>([])
  const [projects, setProjects] = useState<AssignedProject[]>([])
  const [surveys, setSurveys] = useState<AssignedSurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('surveys')

  // Lead update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateNote, setUpdateNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/my-assignments?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.data?.leads ?? [])
        setProjects(data.data?.projects ?? [])
        setSurveys(data.data?.surveys ?? [])
      }
    } catch {} finally { setLoading(false) }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateLead = async () => {
    if (!selectedLead || !updateStatus) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updateStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        if (updateStatus === 'WON') {
          showSuccess(`Lead "${selectedLead.name}" has been converted to a client! A new client record has been created.`, { title: 'Lead Converted to Client' })
        } else {
          showSuccess(`Lead status updated to ${statusLabelMap[updateStatus] || updateStatus}`)
        }
        setUpdateDialogOpen(false)
        setSelectedLead(null)
        setUpdateStatus('')
        setUpdateNote('')
        await fetchData()
      } else {
        showError(data.error || 'Failed to update lead status')
      }
    } catch { showError('Network error') } finally { setUpdating(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="Your assigned leads and projects" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Assignments' }]} />
        <Card><CardContent className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" /><p className="mt-2 text-sm text-muted-foreground">Loading assignments...</p></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assignments"
        description={`Leads and projects assigned to ${session?.user?.name || 'you'}`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Assignments' }]}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{leads.length}</p><p className="text-sm text-muted-foreground">Assigned Leads</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100"><FolderKanban className="h-6 w-6 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{projects.length}</p><p className="text-sm text-muted-foreground">My Projects</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100"><Clock className="h-6 w-6 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{leads.filter((l) => l.status === 'NEW' || l.status === 'CONTACTED').length}</p><p className="text-sm text-muted-foreground">Pending Follow-up</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{leads.filter((l) => l.status === 'WON').length}</p><p className="text-sm text-muted-foreground">Converted</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="surveys" className="gap-2">
            <Navigation className="h-4 w-4" />
            My Surveys ({surveys.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            My Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            My Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        {/* Surveys Tab */}
        <TabsContent value="surveys" className="space-y-4">
          {surveys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Navigation className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No surveys assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">No surveys have been assigned to you yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {surveys.map((survey) => {
                const SURVEY_STATUS_COLORS: Record<string, string> = {
                  DRAFT: 'bg-slate-100 text-slate-700', ASSIGNED: 'bg-blue-100 text-blue-700',
                  IN_PROGRESS: 'bg-amber-100 text-amber-700', SUBMITTED: 'bg-purple-100 text-purple-700',
                  APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700',
                }
                const SURVEY_STATUS_LABELS: Record<string, string> = {
                  DRAFT: 'Draft', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
                  SUBMITTED: 'Submitted', MANAGER_APPROVED: 'Manager Approved',
                  APPROVED: 'Approved', REJECTED: 'Rejected',
                }
                return (
                  <Card key={survey.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">{survey.title}</h3>
                            <Badge className={cn('text-[10px]', SURVEY_STATUS_COLORS[survey.status])}>
                              {SURVEY_STATUS_LABELS[survey.status] || survey.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{survey.project}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{survey.scheduledDate || 'No date'}</span>
                            <span>{survey.type}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{survey.checklistTotal} checklist items</span>
                            <span>{survey.photoCount} photos</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {survey.status === 'ASSIGNED' && (
                            <Link href={`/surveys/${survey.id}`}>
                              <Button size="sm">
                                <PlayCircle className="h-4 w-4 mr-1.5" /> Start
                              </Button>
                            </Link>
                          )}
                          {survey.status === 'IN_PROGRESS' && (
                            <Link href={`/surveys/${survey.id}`}>
                              <Button size="sm">
                                <Send className="h-4 w-4 mr-1.5" /> Submit
                              </Button>
                            </Link>
                          )}
                          <Link href={`/surveys/${survey.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No leads assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">Contact your admin to get leads assigned to you.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(lead.name.split(' ')[0], lead.name.split(' ')[1] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">{lead.name}</h3>
                            <Badge className={cn('text-[10px]', statusColorMap[lead.status])}>{statusLabelMap[lead.status] || lead.status}</Badge>
                            <Badge variant="outline" className={cn('text-[10px]', priorityColorMap[lead.priority])}>{lead.priority}</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>}
                            {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                            {lead.source && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.source}</span>}
                          </div>
                          {lead.estimatedValue && (
                            <p className="mt-1 text-xs"><span className="text-muted-foreground">Value:</span> <span className="font-semibold">{formatCurrency(lead.estimatedValue)}</span></p>
                          )}
                          {lead.client && (
                            <p className="mt-1 text-xs text-muted-foreground">Converted to: <Link href={`/clients/${lead.client.id}`} className="text-primary hover:underline">{lead.client.companyName}</Link></p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lead.phone && (
                          <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${lead.phone}`}>
                            <Phone className="h-3 w-3 mr-1" />Call
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${lead.email}`}>
                            <Mail className="h-3 w-3 mr-1" />Email
                          </Button>
                        )}
                        {lead.status !== 'WON' && lead.status !== 'LOST' && (
                          <Button size="sm" onClick={() => { setSelectedLead(lead); setUpdateStatus(lead.status); setUpdateDialogOpen(true) }}>
                            <Send className="h-3 w-3 mr-1" />Update
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/leads/${lead.id}`}><Eye className="h-3 w-3" /></Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No projects assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">Projects will appear here once you are assigned as manager.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/projects/${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{project.name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{project.code}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{project.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {project.client && <p className="text-muted-foreground"><Building2 className="h-3 w-3 inline mr-1" />{project.client.companyName}</p>}
                    {project.city && <p className="text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{project.city}</p>}
                    {project.budget && <p className="font-semibold"><IndianRupee className="h-3 w-3 inline mr-1" />{formatCurrency(project.budget)}</p>}
                    <p className="text-muted-foreground"><ClipboardList className="h-3 w-3 inline mr-1" />{project._count.surveys} Surveys</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Update Lead Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Update Lead Status
            </DialogTitle>
            <DialogDescription>
              Update the status for <strong>{selectedLead?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Status *</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="WON">Won (Convert to Client)</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {updateStatus === 'WON' && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-400">
                <p className="font-medium">This will:</p>
                <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                  <li>Mark this lead as <strong>Won (Closed)</strong></li>
                  <li>Automatically create a new Client record</li>
                  <li>Status cannot be changed after conversion</li>
                </ul>
              </div>
            )}
            {updateStatus === 'LOST' && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-400">
                <p className="font-medium">This will mark the lead as <strong>Lost (Closed)</strong>. Status cannot be changed after this.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Add notes about this update..." value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateLead}
              disabled={!updateStatus || updating}
              variant={updateStatus === 'WON' ? 'default' : updateStatus === 'LOST' ? 'destructive' : 'default'}
              className={updateStatus === 'WON' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {updating ? 'Updating...' : updateStatus === 'WON' ? 'Convert to Client' : updateStatus === 'LOST' ? 'Mark as Lost' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
