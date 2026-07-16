"use client"

import { useState, useMemo, useEffect } from "react"
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
} from "lucide-react"

import { formatCurrency } from "@/lib/utils"
import { showSuccess } from "@/components/ui/toast"
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

interface Quotation {
  id: string
  title: string
  project: string
  totalAmount: number
  tax: number
  grandTotal: number
  validUntil: string
  status: string
  createdAt: string
}

const statusVariant: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
  Accepted: "success",
  Sent: "info",
  Draft: "secondary",
  Rejected: "destructive",
  Cancelled: "destructive",
}

export default function QuotationsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const res = await fetch("/api/quotations")
        if (res.ok) {
          const data = await res.json()
          setQuotations(data.data ?? data.quotations ?? (Array.isArray(data) ? data : []))
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchQuotations()
  }, [])

  const projectList = useMemo(() => [...new Set(quotations.map((q) => q.project))].sort(), [quotations])

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus = statusFilter === "all" || q.status === statusFilter
      const matchesProject = projectFilter === "all" || q.project === projectFilter
      return matchesStatus && matchesProject
    })
  }, [quotations, statusFilter, projectFilter])

  const handleExport = () => {
    const headers = ["Quotation #", "Title", "Project", "Total Amount", "Tax", "Grand Total", "Valid Until", "Status"]
    const rows = filteredQuotations.map(q => [
      q.id, q.title, q.project, q.totalAmount, q.tax, q.grandTotal, q.validUntil, q.status
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quotations-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess("Quotation data exported as CSV")
  }

  const totalValue = quotations.reduce((s, q) => s + q.grandTotal, 0)
  const draftCount = quotations.filter((q) => q.status === "Draft").length
  const sentCount = quotations.filter((q) => q.status === "Sent").length
  const acceptedCount = quotations.filter((q) => q.status === "Accepted").length

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Quotations"
          description="Create, manage and track project quotations"
          breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Quotations" }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading quotations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Create, manage and track project quotations"
        breadcrumbs={[
          { label: "Dashboard", href: '/dashboard' },
          { label: "Quotations" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/quotations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Quotations" value={quotations.length} icon={<FileText className="h-6 w-6" />} color="default" />
        <StatCard label="Draft" value={draftCount} icon={<Pencil className="h-6 w-6" />} color="warning" />
        <StatCard label="Sent" value={sentCount} icon={<Send className="h-6 w-6" />} color="info" />
        <StatCard label="Accepted" value={acceptedCount} icon={<Eye className="h-6 w-6" />} color="success" />
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectList.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono text-xs font-medium">{quotation.id}</TableCell>
                  <TableCell>
                    <Link href={`/quotations/${quotation.id}`} className="font-medium hover:text-primary transition-colors">
                      {quotation.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{quotation.project}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(quotation.totalAmount)}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(quotation.tax)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(quotation.grandTotal)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(quotation.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[quotation.status] || "secondary"}>
                      {quotation.status}
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
                          <Link href={`/quotations/${quotation.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/quotations/new`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send to Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredQuotations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quotations found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {quotations.length === 0 ? "No quotations yet. Create your first quotation." : "Try adjusting your filters"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
