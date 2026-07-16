"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  BarChart3,
  ClipboardList,
  IndianRupee,
  TrendingUp,
  Users,
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
} from "lucide-react"

import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/ui/page-header"
import { Modal } from "@/components/ui/modal"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"

const reportTemplates = [
  { id: "survey", name: "Survey Report", description: "Comprehensive survey findings, measurements, and site conditions", icon: <ClipboardList className="h-6 w-6" />, color: "bg-blue-100 text-blue-600" },
  { id: "project-summary", name: "Project Summary", description: "High-level overview of project status, milestones, and KPIs", icon: <FileText className="h-6 w-6" />, color: "bg-emerald-100 text-emerald-600" },
  { id: "boq", name: "BOQ Report", description: "Bill of Quantities with itemized costs and quantities", icon: <FileSpreadsheet className="h-6 w-6" />, color: "bg-amber-100 text-amber-600" },
  { id: "financial", name: "Financial Report", description: "Revenue, expenses, profit margins, and payment status", icon: <IndianRupee className="h-6 w-6" />, color: "bg-violet-100 text-violet-600" },
  { id: "progress", name: "Progress Report", description: "Construction progress tracking with photo documentation", icon: <TrendingUp className="h-6 w-6" />, color: "bg-teal-100 text-teal-600" },
  { id: "client", name: "Client Report", description: "Client-facing deliverables and project updates", icon: <Users className="h-6 w-6" />, color: "bg-rose-100 text-rose-600" },
]

interface GeneratedReport {
  id: string
  title: string
  project: string
  type: string
  generatedBy: string
  generatedByInitials: string
  date: string
  format: string
  size: string
}

const reportTypeColors: Record<string, string> = {
  "Survey Report": "bg-blue-100 text-blue-800",
  "Progress Report": "bg-emerald-100 text-emerald-800",
  "BOQ Report": "bg-amber-100 text-amber-800",
  "Financial Report": "bg-violet-100 text-violet-800",
  "Project Summary": "bg-teal-100 text-teal-800",
  "Client Report": "bg-rose-100 text-rose-800",
}

const formatIcon: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-4 w-4 text-red-500" />,
  Excel: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
}

const reportSections = [
  "Executive Summary", "Project Overview", "Survey Findings", "Measurements",
  "Photo Documentation", "Risk Assessment", "Recommendations",
]

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [formatFilter, setFormatFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState("All Projects")
  const [selectedSections, setSelectedSections] = useState<string[]>(reportSections)
  const [selectedFormat, setSelectedFormat] = useState("PDF")
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports")
        if (res.ok) {
          const data = await res.json()
          setReports(data.data ?? data.reports ?? (Array.isArray(data) ? data : []))
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const projects = useMemo(() => ["All Projects", ...new Set(reports.map((r) => r.project))], [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        searchQuery === "" ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.project.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || report.type === typeFilter
      const matchesFormat = formatFilter === "all" || report.format === formatFilter
      return matchesSearch && matchesType && matchesFormat
    })
  }, [reports, searchQuery, typeFilter, formatFilter])

  const totalPages = Math.ceil(filteredReports.length / pageSize)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Generate, manage, and download project reports"
          breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading reports...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, manage, and download project reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Reports" },
        ]}
        actions={
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        }
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Report Templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", template.color)}>
                    {template.icon}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{template.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setShowGenerateModal(true)}
                  >
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">Recent Reports</CardTitle>
            <div className="flex items-center gap-3">
              <SearchInput placeholder="Search reports..." className="w-[220px]" onSearch={setSearchQuery} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reportTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Formats" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Link href={`/reports/${report.id}`} className="font-medium hover:text-primary transition-colors">
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{report.project}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", reportTypeColors[report.type] || "")}>{report.type}</Badge>
                  </TableCell>
                  <TableCell><span className="text-sm">{report.generatedBy}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(report.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {formatIcon[report.format]}
                      <span className="text-sm">{report.format}</span>
                    </div>
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
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="mr-2 h-4 w-4" />View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />Download {report.format}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reports found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {reports.length === 0 ? "No reports yet. Generate your first report." : "Try adjusting your search or filters"}
              </p>
            </div>
          )}

          <div className="mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredReports.length} pageSize={pageSize} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        title="Generate Report"
        description="Configure and generate a new report"
        maxWidth="lg"
        cancelLabel="Cancel"
        confirmLabel="Generate Report"
        onCancel={() => setShowGenerateModal(false)}
        onConfirm={() => setShowGenerateModal(false)}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="From Date" defaultValue="2026-06-01" />
            <DatePicker label="To Date" defaultValue="2026-07-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sections to Include</label>
            <div className="grid grid-cols-2 gap-2">
              {reportSections.map((section) => (
                <label key={section} className="flex items-center gap-2 rounded-md border p-2.5 text-sm cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={selectedSections.includes(section)} onCheckedChange={() => toggleSection(section)} />
                  {section}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Output Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF Document</SelectItem>
                <SelectItem value="Excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="Word">Word Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
