"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Ruler, Plus, Search, Download, Filter, ChevronDown, ChevronUp,
  Camera, PenLine, FileText, CheckCircle, XCircle, Clock, AlertTriangle,
  BarChart3, Upload, Eye, Pencil, History, MapPin, Layers, Bot,
  ClipboardCheck, TrendingUp, TrendingDown, ArrowRight, Image,
  User, FileCheck, Building2,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Measurement {
  id: number
  projectName: string
  boqItem: string
  boqCode: string
  boqQty: number
  executedQty: number
  category: string
  unit: string
  verificationStatus: "Pending" | "Verified" | "Approved" | "Rejected"
  measuredBy: string
  measuredDate: string
  verifiedBy: string
  siteLocation: string
  description: string
  hasPhotos: boolean
  hasDrawing: boolean
  hasMB: boolean
  aiSuggestion?: string
}

const STATUS_OPTIONS = ["Pending", "Verified", "Approved", "Rejected"]

const CATEGORY_COLORS: Record<string, string> = {
  Earthwork: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  Concrete: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  "Brick Masonry": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400",
  Plastering: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400",
  Steel: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  Flooring: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400",
  Painting: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-400",
  Waterproofing: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-400",
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  Pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400", icon: <Clock className="h-3 w-3" /> },
  Verified: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400", icon: <Eye className="h-3 w-3" /> },
  Approved: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400", icon: <CheckCircle className="h-3 w-3" /> },
  Rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400", icon: <XCircle className="h-3 w-3" /> },
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [aiCommand, setAiCommand] = useState("")

  // Filters
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("All")
  const [boqFilter, setBoqFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [engineerFilter, setEngineerFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [varianceFilter, setVarianceFilter] = useState("All")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/measurements")
        if (res.ok) {
          const data = await res.json()
          const arr = data.data ?? data.measurements ?? (Array.isArray(data) ? data : [])
          if (arr.length > 0) setMeasurements(arr)
          else setMeasurements([])
        } else {
          setMeasurements([])
        }
      } catch {
        setMeasurements([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    return measurements.filter((m) => {
      if (search && !m.projectName.toLowerCase().includes(search.toLowerCase()) && !m.boqItem.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase()) && !m.siteLocation.toLowerCase().includes(search.toLowerCase())) return false
      if (projectFilter !== "All" && m.projectName !== projectFilter) return false
      if (boqFilter !== "All" && m.boqCode !== boqFilter) return false
      if (statusFilter !== "All" && m.verificationStatus !== statusFilter) return false
      if (engineerFilter !== "All" && m.measuredBy !== engineerFilter) return false
      if (dateFrom && m.measuredDate < dateFrom) return false
      if (dateTo && m.measuredDate > dateTo) return false
      if (varianceFilter !== "All") {
        const v = ((m.executedQty - m.boqQty) / m.boqQty) * 100
        if (varianceFilter === "Over" && v <= 0) return false
        if (varianceFilter === "Under" && v >= 0) return false
        if (varianceFilter === "Within" && Math.abs(v) > 5) return false
      }
      return true
    })
  }, [measurements, search, projectFilter, boqFilter, statusFilter, engineerFilter, dateFrom, dateTo, varianceFilter])

  const uniqueProjects = useMemo(() => [...new Set(measurements.map(m => m.projectName))].sort(), [measurements])
  const uniqueEngineers = useMemo(() => [...new Set(measurements.map(m => m.measuredBy))].sort(), [measurements])

  const getVariance = (m: Measurement) => ((m.executedQty - m.boqQty) / m.boqQty) * 100
  const getRemaining = (m: Measurement) => m.boqQty - m.executedQty

  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const todayCount = measurements.filter((m) => m.measuredDate === today).length
    const totalExecuted = measurements.reduce((s, m) => s + m.executedQty, 0)
    const pendingCount = measurements.filter((m) => m.verificationStatus === "Pending").length
    const approvedCount = measurements.filter((m) => m.verificationStatus === "Approved").length
    const billable = measurements.filter((m) => m.verificationStatus === "Approved").reduce((s, m) => s + m.executedQty, 0)
    const totalBoq = measurements.reduce((s, m) => s + m.boqQty, 0)
    const utilization = totalBoq > 0 ? (totalExecuted / totalBoq) * 100 : 0
    return { todayCount, totalExecuted, pendingCount, approvedCount, billable, utilization }
  }, [measurements])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([])
    else setSelectedIds(filtered.map((m) => m.id))
  }

  const uniqueBoqs = [...new Set(measurements.map((m) => m.boqCode))]

  const aiInsights = [
    { text: "Concrete quantity exceeded BOQ by 5%", type: "warning" as const },
    { text: "Steel consumption is within limit", type: "success" as const },
    { text: `${summary.pendingCount} measurements pending verification`, type: "info" as const },
    { text: "Slab quantity approved for billing", type: "success" as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Measurements" description="Track and manage all construction site measurements" breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Measurements" }]} />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading measurements...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurements"
        description="Track and manage all construction site measurements"
        breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Measurements" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Measurement</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Ruler className="h-6 w-6" />} label="Today's Measurements" value={summary.todayCount} color="default" />
        <StatCard icon={<Layers className="h-6 w-6" />} label="Total Executed Qty" value={`${summary.totalExecuted.toLocaleString("en-IN")} m³`} color="info" />
        <StatCard icon={<Clock className="h-6 w-6" />} label="Pending Verification" value={summary.pendingCount} color="warning" />
        <StatCard icon={<CheckCircle className="h-6 w-6" />} label="Approved Measurements" value={summary.approvedCount} color="success" />
        <StatCard icon={<FileCheck className="h-6 w-6" />} label="Billable Quantity" value={`${summary.billable.toLocaleString("en-IN")} m³`} color="success" />
        <StatCard icon={<BarChart3 className="h-6 w-6" />} label="BOQ Utilization %" value={`${summary.utilization.toFixed(1)}%`} color="info" />
      </div>

      {/* AI Insights Widget */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> AI Measurement Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {aiInsights.map((insight, i) => (
              <div key={i} className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm",
                insight.type === "warning" && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                insight.type === "success" && "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                insight.type === "info" && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
              )}>
                {insight.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                {insight.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                {insight.type === "info" && <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                <span className="text-foreground">{insight.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Add Measurement", icon: <Plus className="h-4 w-4" />, variant: "default" as const },
          { label: "Capture Site", icon: <Camera className="h-4 w-4" />, variant: "outline" as const },
          { label: "Import Survey", icon: <Upload className="h-4 w-4" />, variant: "outline" as const },
          { label: "Verify Qty", icon: <ClipboardCheck className="h-4 w-4" />, variant: "outline" as const },
          { label: "Generate MB", icon: <FileText className="h-4 w-4" />, variant: "outline" as const },
        ].map((action) => (
          <Button key={action.label} variant={action.variant} size="sm" className="gap-2">
            {action.icon} {action.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Projects</SelectItem>
                {uniqueProjects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={boqFilter} onValueChange={setBoqFilter}>
              <SelectTrigger><SelectValue placeholder="BOQ Item" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All BOQ</SelectItem>
                {uniqueBoqs.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={engineerFilter} onValueChange={setEngineerFilter}>
              <SelectTrigger><SelectValue placeholder="Engineer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Engineers</SelectItem>
                {uniqueEngineers.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" placeholder="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Select value={varianceFilter} onValueChange={setVarianceFilter}>
              <SelectTrigger><SelectValue placeholder="Variance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Variance</SelectItem>
                <SelectItem value="Over">Over BOQ</SelectItem>
                <SelectItem value="Under">Under BOQ</SelectItem>
                <SelectItem value="Within">Within ±5%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"><ClipboardCheck className="h-4 w-4 mr-1" />Verify</Button>
            <Button size="sm" variant="outline"><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
            <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1" />Generate MB</Button>
            <Button size="sm" variant="outline"><User className="h-4 w-4 mr-1" />Assign Engineer</Button>
          </div>
        </div>
      )}

      {/* View Toggle & Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{filtered.length} measurements</div>
        <div className="flex gap-1 rounded-md border p-0.5">
          <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="h-7 px-3">
            <Layers className="h-3.5 w-3.5 mr-1" />Table
          </Button>
          <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("card")} className="h-7 px-3">
            <Building2 className="h-3.5 w-3.5 mr-1" />Cards
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>BOQ Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="min-w-[180px]">Executed Qty</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Variance %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Measured By</TableHead>
                    <TableHead>Verified By</TableHead>
                    <TableHead>Site Location</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const variance = getVariance(m)
                    const remaining = getRemaining(m)
                    const progress = m.boqQty > 0 ? Math.min((m.executedQty / m.boqQty) * 100, 100) : 0
                    const isOver = variance > 0
                    const isExpanded = expandedRow === m.id
                    return (
                      <TableRow key={m.id} className={cn("group", isExpanded && "bg-muted/50")}>
                        <TableCell>
                          <Checkbox checked={selectedIds.includes(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{m.projectName}</p>
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="info" className="text-xs mb-0.5">{m.boqCode}</Badge>
                            <p className="text-xs text-muted-foreground">{m.boqItem}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", CATEGORY_COLORS[m.category])}>
                            {m.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-medium">{m.executedQty.toLocaleString("en-IN")} {m.unit}</span>
                              <span className="text-muted-foreground">/ {m.boqQty.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all", isOver ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min(progress, 100)}%` }} />
                              {isOver && (
                                <div className="absolute inset-0 bg-red-500/20" style={{ width: `${Math.min(progress, 100)}%` }} />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-mono text-sm font-medium", remaining < 0 ? "text-red-600" : "text-muted-foreground")}>
                            {remaining.toLocaleString("en-IN")} {m.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("inline-flex items-center gap-1 font-mono text-sm font-medium",
                            isOver ? "text-red-600" : variance < -5 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {isOver ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", STATUS_CONFIG[m.verificationStatus].color)}>
                            {STATUS_CONFIG[m.verificationStatus].icon}
                            {m.verificationStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{m.measuredBy}</p>
                            <p className="text-xs text-muted-foreground">{m.measuredDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{m.verifiedBy || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[120px] truncate">{m.siteLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Drawing"><PenLine className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Photo"><Camera className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="MB"><FileText className="h-3.5 w-3.5" /></Button>
                            {m.verificationStatus === "Pending" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="Verify"><CheckCircle className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedRow(isExpanded ? null : m.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12">
                        <Ruler className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                        <p className="mt-3 text-sm font-medium">No measurements found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Expanded Row Content */}
            {expandedRow && (() => {
              const m = filtered.find((x) => x.id === expandedRow)
              if (!m) return null
              const variance = getVariance(m)
              const remaining = getRemaining(m)
              return (
                <div className="border-t bg-muted/30 p-4">
                  <Tabs defaultValue="photos">
                    <TabsList className="mb-3">
                      <TabsTrigger value="photos"><Camera className="h-3.5 w-3.5 mr-1" />Site Photos</TabsTrigger>
                      <TabsTrigger value="drawing"><PenLine className="h-3.5 w-3.5 mr-1" />Drawing</TabsTrigger>
                      <TabsTrigger value="boq"><BarChart3 className="h-3.5 w-3.5 mr-1" />BOQ Details</TabsTrigger>
                      <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1" />Previous</TabsTrigger>
                      <TabsTrigger value="ai"><Bot className="h-3.5 w-3.5 mr-1" />AI Suggestions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="photos" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {m.hasPhotos ? (
                          [1, 2, 3].map((i) => (
                            <div key={i} className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
                              <div className="text-center text-muted-foreground">
                                <Image className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-xs">Site Photo {i}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 text-center py-6 text-muted-foreground text-sm">No photos attached</div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="drawing" className="mt-0">
                      {m.hasDrawing ? (
                        <div className="aspect-[2/1] rounded-lg border bg-muted flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <PenLine className="h-10 w-10 mx-auto mb-2" />
                            <p className="text-sm font-medium">Drawing Reference</p>
                            <p className="text-xs">structural-drawing-{m.boqCode.toLowerCase()}.pdf</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">No drawing attached</div>
                      )}
                    </TabsContent>

                    <TabsContent value="boq" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">BOQ Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">BOQ Code:</span><span className="font-medium">{m.boqCode}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Item:</span><span className="font-medium">{m.boqItem}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-medium">{m.category}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Unit:</span><span className="font-medium">{m.unit}</span></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Quantity Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">BOQ Quantity:</span><span className="font-medium font-mono">{m.boqQty.toLocaleString("en-IN")} {m.unit}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Executed:</span><span className="font-medium font-mono">{m.executedQty.toLocaleString("en-IN")} {m.unit}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Remaining:</span><span className={cn("font-medium font-mono", remaining < 0 ? "text-red-600" : "")}>{remaining.toLocaleString("en-IN")} {m.unit}</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-3">BOQ vs Executed</h4>
                          <QuantityComparisonWidget boqQty={m.boqQty} executedQty={m.executedQty} unit={m.unit} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Previous Measurement (v1)</h4>
                          <div className="rounded-lg border p-3 text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Executed:</span><span className="font-mono">{(m.executedQty * 0.85).toFixed(1)} {m.unit}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Variance:</span><span className="font-mono text-amber-600">-15%</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>06 Jul 2026</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Current Measurement (v2)</h4>
                          <div className="rounded-lg border p-3 text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Executed:</span><span className="font-mono">{m.executedQty.toLocaleString("en-IN")} {m.unit}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Variance:</span><span className={cn("font-mono", variance > 0 ? "text-red-600" : "text-emerald-600")}>{variance > 0 ? "+" : ""}{variance.toFixed(1)}%</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>{m.measuredDate}</span></div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-0">
                      {m.aiSuggestion ? (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <div className="flex items-start gap-2">
                            <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">AI Analysis</p>
                              <p className="text-sm text-muted-foreground mt-1">{m.aiSuggestion}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">No AI suggestions for this measurement</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const variance = getVariance(m)
            const remaining = getRemaining(m)
            const progress = m.boqQty > 0 ? Math.min((m.executedQty / m.boqQty) * 100, 100) : 0
            return (
              <Card key={m.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{m.projectName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info" className="text-xs">{m.boqCode}</Badge>
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", CATEGORY_COLORS[m.category])}>{m.category}</span>
                        </div>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", STATUS_CONFIG[m.verificationStatus].color)}>
                        {STATUS_CONFIG[m.verificationStatus].icon}
                        {m.verificationStatus}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">{m.boqItem}</p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", variance > 0 ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>BOQ: {m.boqQty.toLocaleString("en-IN")} {m.unit}</span>
                        <span>Executed: {m.executedQty.toLocaleString("en-IN")} {m.unit}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Remaining:</span> <span className={cn("font-mono font-medium", remaining < 0 ? "text-red-600" : "")}>{remaining.toLocaleString("en-IN")}</span></div>
                      <div><span className="text-muted-foreground">Variance:</span> <span className={cn("font-mono font-medium", variance > 0 ? "text-red-600" : "text-emerald-600")}>{variance > 0 ? "+" : ""}{variance.toFixed(1)}%</span></div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{m.siteLocation}
                    </div>
                  </div>

                  <div className="flex items-center border-t divide-x">
                    <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-none text-xs"><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-none text-xs"><Camera className="h-3.5 w-3.5 mr-1" />Photo</Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-none text-xs"><FileText className="h-3.5 w-3.5 mr-1" />MB</Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-none text-xs"><History className="h-3.5 w-3.5 mr-1" />History</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {aiAssistantOpen && (
          <Card className="mb-3 w-80 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                {[
                  { cmd: "Show pending measurements", icon: <Clock className="h-3.5 w-3.5" /> },
                  { cmd: "Show quantity variance", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                  { cmd: "Show awaiting approval", icon: <CheckCircle className="h-3.5 w-3.5" /> },
                  { cmd: "Generate MB report", icon: <FileText className="h-3.5 w-3.5" /> },
                  { cmd: "Compare BOQ vs Actual", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.cmd}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-muted transition-colors"
                    onClick={() => {
                      setAiCommand(item.cmd)
                      if (item.cmd.includes("pending")) setStatusFilter("Pending")
                      else if (item.cmd.includes("variance")) setVarianceFilter("Over")
                      else if (item.cmd.includes("approval")) setStatusFilter("Verified")
                      setAiAssistantOpen(false)
                    }}
                  >
                    {item.icon} {item.cmd}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask AI..." value={aiCommand} onChange={(e) => setAiCommand(e.target.value)} className="text-sm" />
                <Button size="icon" className="h-8 w-8 shrink-0"><ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
        >
          <Bot className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

function QuantityComparisonWidget({ boqQty, executedQty, unit }: { boqQty: number; executedQty: number; unit: string }) {
  const max = Math.max(boqQty, executedQty)
  const boqPct = max > 0 ? (boqQty / max) * 100 : 0
  const execPct = max > 0 ? (executedQty / max) * 100 : 0
  const remaining = Math.max(boqQty - executedQty, 0)
  const remPct = max > 0 ? (remaining / max) * 100 : 0
  const isOver = executedQty > boqQty

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />BOQ Qty</span>
          <span className="font-mono">{boqQty.toLocaleString("en-IN")} {unit}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary/70" style={{ width: `${boqPct}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${isOver ? "bg-red-500" : "bg-emerald-500"}`} />Executed</span>
          <span className="font-mono">{executedQty.toLocaleString("en-IN")} {unit}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${execPct}%` }} />
        </div>
      </div>
      {!isOver && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Remaining</span>
            <span className="font-mono">{remaining.toLocaleString("en-IN")} {unit}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${remPct}%` }} />
          </div>
        </div>
      )}
      {isOver && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Over-consumed by {(executedQty - boqQty).toLocaleString("en-IN")} {unit}
        </div>
      )}
    </div>
  )
}
