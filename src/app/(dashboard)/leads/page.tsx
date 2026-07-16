'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Users,
  Plus,
  TrendingUp,
  ArrowUpRight,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  ArrowRightLeft,
  Trash2,
  UserPlus,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { showSuccess, showError } from '@/components/ui/toast'

interface LeadData {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: string
  statusLabel: string
  statusColor: string
  priority: string
  priorityLabel: string
  priorityColor: string
  estimatedValue: number
  assignedTo: { firstName: string; lastName: string } | null
  createdAt: string
  source: string
}

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<LeadData | null>(null)
  const [converting, setConverting] = useState<string | null>(null)

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.data ?? data.leads ?? (Array.isArray(data) ? data : []))
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

  const handleDelete = async () => {
    if (!leadToDelete) return
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
        setDeleteDialogOpen(false)
        setLeadToDelete(null)
        showSuccess('Lead has been deleted successfully.')
      } else {
        showError('Failed to delete lead. Please try again.')
      }
    } catch { showError('Network error. Please try again.') }
  }

  const handleConvertToClient = async (lead: LeadData) => {
    setConverting(lead.id)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      })
      if (res.ok) {
        await fetchLeads()
        showSuccess(`"${lead.name}" has been converted to a client successfully!`, { title: 'Lead Converted' })
      } else {
        const data = await res.json()
        showError(data.error || 'Failed to convert lead.')
      }
    } catch { showError('Network error. Please try again.') } finally { setConverting(null) }
  }

  const statusCounts = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === 'NEW').length,
    converted: leads.filter((l) => l.status === 'WON').length,
    conversionRate: leads.length > 0
      ? Math.round((leads.filter((l) => l.status === 'WON').length / leads.length) * 100)
      : 0,
  }), [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false
      return true
    })
  }, [leads, statusFilter, priorityFilter])

  const columns: ColumnDef<LeadData, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {getInitials(row.original.name.split(' ')[0], row.original.name.split(' ')[1] || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.company}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[160px]">{row.original.email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{row.original.phone}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={cn('text-[10px]', row.original.statusColor)}>
          {row.original.statusLabel}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant="outline" className={cn('text-[10px]', row.original.priorityColor)}>
          {row.original.priorityLabel}
        </Badge>
      ),
    },
    {
      accessorKey: 'estimatedValue',
      header: 'Value',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatCurrency(row.original.estimatedValue)}</span>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const user = row.original.assignedTo
        if (!user) return <span className="text-xs text-muted-foreground">Unassigned</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-muted text-[10px] font-medium">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{user.firstName} {user.lastName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/leads/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/leads/${row.original.id}?edit=true`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleConvertToClient(row.original)}
              disabled={converting === row.original.id || row.original.status === 'WON' || row.original.status === 'LOST'}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              {converting === row.original.id ? 'Converting...' : 'Convert to Client'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { setLeadToDelete(row.original); setDeleteDialogOpen(true) }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lead Management"
          description="Track and manage your sales pipeline from inquiry to conversion."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leads' }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading leads...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management"
        description="Track and manage your sales pipeline from inquiry to conversion."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads' },
        ]}
        actions={
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="mr-1 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Leads"
          value={statusCounts.total}
          color="info"
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5" />}
          label="New Leads"
          value={statusCounts.new}
          color="default"
        />
        <StatCard
          icon={<ArrowUpRight className="h-5 w-5" />}
          label="Converted"
          value={statusCounts.converted}
          color="success"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Conversion Rate"
          value={`${statusCounts.conversionRate}%`}
          color="success"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="PROPOSAL">Proposal Sent</SelectItem>
            <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== 'all' || priorityFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('all'); setPriorityFilter('all') }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No leads found"
          description={leads.length === 0 ? "No leads yet. Add your first lead." : "No leads match your current filters."}
          action={{ label: 'Add Lead', onClick: () => (window.location.href = '/leads/new') }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLeads}
          searchKey="name"
          searchPlaceholder="Search leads by name..."
          pageSize={10}
          showColumnVisibility={false}
          showExport
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{leadToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
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
