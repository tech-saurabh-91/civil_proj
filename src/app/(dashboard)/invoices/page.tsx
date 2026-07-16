"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Send,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"

import { formatCurrency } from "@/lib/utils"
import { showSuccess, showError } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  description?: string
  totalAmount: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  dueDate?: string
  paidDate?: string
  status: string
  createdAt: string
  project?: { id: string; name: string; code: string }
}

const statusVariant: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
  PAID: "success",
  PENDING: "warning",
  PARTIAL: "info",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?limit=100")
      const data = await res.json()
      if (data.success) setProjects(data.data)
    } catch {
      showError("Failed to load projects")
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: "500" })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (projectFilter !== "all") params.set("projectId", projectFilter)
      const res = await fetch(`/api/invoices?${params}`)
      const data = await res.json()
      if (data.success) setInvoices(data.data)
    } catch {
      showError("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, projectFilter])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        showSuccess("Invoice deleted")
        fetchInvoices()
      } else {
        showError(data.error || "Failed to delete invoice")
      }
    } catch {
      showError("Failed to delete invoice")
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    const headers = ["Invoice #", "Title", "Project", "Total Amount", "Tax", "Discount", "Grand Total", "Due Date", "Status"]
    const rows = invoices.map(q => [
      q.invoiceNumber, q.title, q.project?.name || "", q.totalAmount, q.taxAmount, q.discountAmount, q.grandTotal, q.dueDate || "", q.status
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess("Invoice data exported as CSV")
  }

  const totalValue = invoices.reduce((s, q) => s + q.grandTotal, 0)
  const pendingCount = invoices.filter((q) => q.status === "PENDING").length
  const paidCount = invoices.filter((q) => q.status === "PAID").length
  const overdueCount = invoices.filter((q) => q.status === "OVERDUE").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Create, manage and track project invoices"
        breadcrumbs={[
          { label: "Dashboard", href: '/dashboard' },
          { label: "Invoices" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/invoices/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Invoices" value={invoices.length} icon={<FileText className="h-6 w-6" />} color="default" />
        <StatCard label="Pending" value={pendingCount} icon={<Pencil className="h-6 w-6" />} color="warning" />
        <StatCard label="Paid" value={paidCount} icon={<Send className="h-6 w-6" />} color="success" />
        <StatCard label="Overdue" value={overdueCount} icon={<Eye className="h-6 w-6" />} color="danger" />
        <StatCard label="Total Value" value={formatCurrency(totalValue)} icon={<FileText className="h-6 w-6" />} color="default" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Link href={`/invoices/${invoice.id}`} className="font-medium hover:text-primary transition-colors">
                          {invoice.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{invoice.project?.name || "—"}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(invoice.taxAmount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[invoice.status] || "secondary"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/new`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send to Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(invoice.id)}
                              disabled={deletingId === invoice.id}
                            >
                              {deletingId === invoice.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {invoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or create a new invoice</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
