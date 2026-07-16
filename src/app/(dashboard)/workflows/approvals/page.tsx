'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  GitBranch,
  Layers,
  Eye,
  Filter,
  Search,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/components/ui/toast'

interface ApprovalItem {
  id: string
  entityType: string
  entityId: string
  title?: string
  description?: string
  status: string
  comments?: string
  requestedAt: string
  respondedAt?: string
  workflow?: { id: string; name: string; workflowNumber?: string }
  approver?: { id: string; firstName: string; lastName: string; email?: string }
  requestedBy?: { id: string; firstName: string; lastName: string }
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-800',
}

const typeIcons: Record<string, React.ReactNode> = {
  workflow: <GitBranch className="h-4 w-4 text-blue-600" />,
  quotation: <FileText className="h-4 w-4 text-violet-600" />,
  boq: <Layers className="h-4 w-4 text-amber-600" />,
  drawing: <FileText className="h-4 w-4 text-emerald-600" />,
  'change-order': <GitBranch className="h-4 w-4 text-orange-600" />,
  invoice: <FileText className="h-4 w-4 text-rose-600" />,
  safety: <CheckCircle className="h-4 w-4 text-teal-600" />,
  procurement: <Layers className="h-4 w-4 text-indigo-600" />,
}

const typeBgColors: Record<string, string> = {
  workflow: 'bg-blue-50',
  quotation: 'bg-violet-50',
  boq: 'bg-amber-50',
  drawing: 'bg-emerald-50',
  'change-order': 'bg-orange-50',
  invoice: 'bg-rose-50',
  safety: 'bg-teal-50',
  procurement: 'bg-indigo-50',
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [comment, setComment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter.toUpperCase())
      const res = await fetch(`/api/approvals?${params}`)
      const data = await res.json()
      if (data.success) setApprovals(data.data)
    } catch {
      showError('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  const filteredApprovals = approvals.filter((a) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && a.status === 'PENDING') ||
      (activeTab === 'approved' && a.status === 'APPROVED') ||
      (activeTab === 'rejected' && (a.status === 'REJECTED' || a.status === 'REVISION_REQUIRED'))
    const matchesSearch =
      a.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.workflow?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.workflow?.workflowNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED' || a.status === 'REVISION_REQUIRED').length

  const handleAction = (id: string, type: 'APPROVED' | 'REJECTED') => {
    setSelectedApproval(id)
    setActionType(type)
    setComment('')
    setCommentDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedApproval) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/approvals/${selectedApproval}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType,
          comments: comment.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showSuccess(actionType === 'APPROVED' ? 'Approved successfully' : 'Rejected successfully')
        setCommentDialogOpen(false)
        setComment('')
        setSelectedApproval(null)
        fetchApprovals()
      } else {
        showError(data.error || 'Failed to update approval')
      }
    } catch {
      showError('Failed to update approval')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pending Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending items across all workflows.</p>
        </div>
        <Badge variant="warning" className="text-sm px-3 py-1">{pendingCount} Pending</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({approvals.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[220px]"
            />
          </div>
        </div>

        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading approvals...</span>
                </CardContent>
              </Card>
            ) : (
              <ApprovalList
                approvals={filteredApprovals}
                onAction={handleAction}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder={
                actionType === 'APPROVED'
                  ? 'Add approval comments (optional)...'
                  : 'Provide reason for rejection...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'APPROVED' ? 'default' : 'destructive'}
                onClick={confirmAction}
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {actionType === 'APPROVED' ? (
                  <>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Confirm Approve
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-4 w-4" />
                    Confirm Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApprovalList({
  approvals,
  onAction,
}: {
  approvals: ApprovalItem[]
  onAction: (id: string, type: 'APPROVED' | 'REJECTED') => void
}) {
  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {approvals.map((approval) => {
            const entityType = approval.entityType?.toLowerCase() || 'workflow'
            const title = approval.workflow?.name || approval.entityType
            const subtitle = [
              approval.workflow?.workflowNumber,
              approval.workflow?.name,
              approval.description,
            ].filter(Boolean).join(' · ')

            return (
              <div
                key={approval.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      typeBgColors[entityType] || 'bg-gray-50'
                    )}
                  >
                    {typeIcons[entityType] || <FileText className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{title}</h4>
                      <Badge
                        className={cn(
                          'text-[10px] capitalize',
                          statusColors[approval.status] || 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {approval.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(approval.requestedAt)}
                      </span>
                      {approval.approver && (
                        <span>Assigned to {approval.approver.firstName} {approval.approver.lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
                {approval.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => onAction(approval.id, 'APPROVED')}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onAction(approval.id, 'REJECTED')}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Reject
                    </Button>
                    {approval.workflow && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/workflows/${approval.workflow.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
                {approval.status === 'APPROVED' && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                )}
                {(approval.status === 'REJECTED' || approval.status === 'REVISION_REQUIRED') && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {approval.status === 'REVISION_REQUIRED' ? 'Revision Required' : 'Rejected'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
