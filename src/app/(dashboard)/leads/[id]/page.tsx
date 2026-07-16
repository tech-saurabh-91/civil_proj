'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  ArrowRightLeft,
  Trash2,
  Mail,
  Phone,
  Building2,
  Globe,
  Calendar,
  IndianRupee,
  User,
  Tag,
  Save,
  X,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { showSuccess, showError } from '@/components/ui/toast'

interface LeadDetail {
  id: string
  name: string
  email: string
  phone: string
  company: string
  website: string
  source: string
  status: string
  priority: string
  estimatedValue: number | null
  notes: string
  createdAt: string
  updatedAt: string
  clientId: string | null
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null
  client: { id: string; companyName: string } | null
}

const statusWorkflow = [
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'QUALIFIED', label: 'Qualified' },
  { key: 'PROPOSAL', label: 'Proposal Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'WON', label: 'Won' },
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = params.id as string
  const isEdit = searchParams.get('edit') === 'true'

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState('')

  const [editData, setEditData] = useState({
    name: '', email: '', phone: '', company: '', website: '', source: '',
    status: '', priority: '', estimatedValue: '', notes: '',
  })

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data.data)
      }
    } catch {} finally { setLoading(false) }
  }, [leadId])

  useEffect(() => { fetchLead() }, [fetchLead])

  useEffect(() => {
    if (lead) {
      setEditData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        website: lead.website || '',
        source: lead.source || '',
        status: lead.status || 'NEW',
        priority: lead.priority || 'MEDIUM',
        estimatedValue: lead.estimatedValue?.toString() || '',
        notes: lead.notes || '',
      })
    }
  }, [lead])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          estimatedValue: editData.estimatedValue ? parseFloat(editData.estimatedValue) : null,
        }),
      })
      if (res.ok) {
        await fetchLead()
        setEditMode(false)
        showSuccess('Lead updated successfully.')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        showError(data.error || 'Failed to save lead.')
      }
    } catch { setError('Network error'); showError('Network error. Please try again.') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Lead deleted successfully.')
        router.push('/leads')
      } else {
        showError('Failed to delete lead.')
      }
    } catch { showError('Network error.') }
  }

  const handleConvert = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      })
      if (res.ok) {
        await fetchLead()
        showSuccess('Lead has been converted to a client! You can now manage this client from the Clients section.', { title: 'Lead Converted' })
      } else {
        const data = await res.json()
        showError(data.error || 'Failed to convert lead.')
      }
    } catch { showError('Network error.') }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="" breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Leads', href: '/leads' }, { label: 'Loading...' }]} />
        <Card><CardContent className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></CardContent></Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead Not Found" description="" breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Leads', href: '/leads' }, { label: 'Not Found' }]} />
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><p className="text-muted-foreground">Lead not found.</p><Button asChild className="mt-4"><Link href="/leads">Back to Leads</Link></Button></CardContent></Card>
      </div>
    )
  }

  const statusLabelMap: Record<string, string> = { NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', PROPOSAL: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost' }
  const statusColorMap: Record<string, string> = { NEW: 'bg-blue-100 text-blue-800', CONTACTED: 'bg-yellow-100 text-yellow-800', QUALIFIED: 'bg-purple-100 text-purple-800', PROPOSAL: 'bg-indigo-100 text-indigo-800', NEGOTIATION: 'bg-orange-100 text-orange-800', WON: 'bg-green-100 text-green-800', LOST: 'bg-red-100 text-red-800' }
  const priorityLabelMap: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }
  const priorityColorMap: Record<string, string> = { LOW: 'text-gray-600', MEDIUM: 'text-yellow-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600' }

  const currentStatusIdx = statusWorkflow.findIndex((s) => s.key === lead.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title={editMode ? 'Edit Lead' : lead.name}
        description={`${lead.company || 'No company'} · ${lead.source || 'Unknown source'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leads', href: '/leads' },
          { label: editMode ? 'Edit' : lead.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link href="/leads"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link></Button>
            {!editMode ? (
              <>
                {lead.status !== 'WON' && lead.status !== 'LOST' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                )}
                <Button variant="outline" onClick={handleConvert} disabled={lead.status === 'WON' || lead.status === 'LOST' || !!lead.client}><ArrowRightLeft className="mr-1 h-4 w-4" />Convert to Client</Button>
                {lead.status !== 'WON' && lead.status !== 'LOST' && (
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                <Button onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" />{saving ? 'Saving...' : 'Save'}</Button>
              </>
            )}
          </div>
        }
      />

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

      {lead.status === 'WON' && lead.client && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span><strong>This lead is CLOSED (Won).</strong> Converted to client <Link href={`/clients/${lead.client.id}`} className="font-medium underline">View Client</Link></span>
        </div>
      )}

      {lead.status === 'WON' && !lead.client && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span><strong>This lead is CLOSED (Won).</strong> Client record has been created.</span>
        </div>
      )}

      {lead.status === 'LOST' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span><strong>This lead is CLOSED (Lost).</strong> No further changes can be made.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Lead Information</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-[10px]', statusColorMap[lead.status] || 'bg-gray-100 text-gray-800')}>{statusLabelMap[lead.status] || lead.status}</Badge>
                  <Badge variant="outline" className={cn('text-[10px]', priorityColorMap[lead.priority] || 'text-gray-600')}>{priorityLabelMap[lead.priority] || lead.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Name *</Label><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Company</Label><Input value={editData.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Website</Label><Input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Source</Label><Select value={editData.source} onValueChange={(v) => setEditData({ ...editData, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Website">Website</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="LinkedIn">LinkedIn</SelectItem><SelectItem value="Cold Call">Cold Call</SelectItem><SelectItem value="Exhibition">Exhibition</SelectItem><SelectItem value="Social Media">Social Media</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NEW">New</SelectItem><SelectItem value="CONTACTED">Contacted</SelectItem><SelectItem value="QUALIFIED">Qualified</SelectItem><SelectItem value="PROPOSAL">Proposal Sent</SelectItem><SelectItem value="NEGOTIATION">Negotiation</SelectItem><SelectItem value="WON">Won</SelectItem><SelectItem value="LOST">Lost</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Priority</Label><Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Estimated Value (INR)</Label><Input type="number" value={editData.estimatedValue} onChange={(e) => setEditData({ ...editData, estimatedValue: e.target.value })} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Notes</Label><Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} /></div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Mail className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Email</p><a href={`mailto:${lead.email}`} className="text-sm font-medium text-primary hover:underline">{lead.email || '—'}</a></div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Phone className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Phone</p><a href={`tel:${lead.phone}`} className="text-sm font-medium text-primary hover:underline">{lead.phone || '—'}</a></div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Building2 className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Company</p><p className="text-sm font-medium">{lead.company || '—'}</p></div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Globe className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Website</p>{lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">Visit<ExternalLink className="h-3 w-3" /></a> : <p className="text-sm font-medium">—</p>}</div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><IndianRupee className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Estimated Value</p><p className="text-sm font-semibold">{formatCurrency(lead.estimatedValue || 0)}</p></div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Tag className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Source</p><p className="text-sm font-medium">{lead.source || '—'}</p></div></div>
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Calendar className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm font-medium">{formatDate(lead.createdAt)}</p></div></div>
                </div>
              )}
              {!editMode && lead.notes && (<><Separator className="my-4" /><div><p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p><p className="text-sm text-muted-foreground">{lead.notes}</p></div></>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Lead Progression</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {statusWorkflow.map((step, index) => {
                  const isCompleted = index < currentStatusIdx
                  const isCurrent = step.key === lead.status
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold', isCompleted && 'border-emerald-500 bg-emerald-500 text-white', isCurrent && 'border-primary bg-primary text-primary-foreground', !isCompleted && !isCurrent && 'border-muted-foreground/20 bg-muted text-muted-foreground')}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Circle className="h-4 w-4 fill-current" /> : <span className="text-[10px]">{index + 1}</span>}
                        </div>
                        <span className={cn('text-[10px] font-medium whitespace-nowrap', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
                      </div>
                      {index < statusWorkflow.length - 1 && <div className={cn('mx-2 h-[2px] w-8 sm:w-12', isCompleted ? 'bg-emerald-500' : 'bg-muted')} />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Assigned To</CardTitle></CardHeader>
            <CardContent>
              {lead.assignedTo ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{getInitials(lead.assignedTo.firstName, lead.assignedTo.lastName)}</AvatarFallback></Avatar>
                  <div><p className="text-sm font-semibold">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</p><p className="text-xs text-muted-foreground">{lead.assignedTo.email}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Unassigned</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Deal Value</span><span className="text-sm font-semibold">{formatCurrency(lead.estimatedValue || 0)}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Days Since Created</span><span className="text-sm font-semibold">{Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><Badge className={cn('text-[10px]', statusColorMap[lead.status])}>{statusLabelMap[lead.status]}</Badge></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Lead</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{lead.name}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
