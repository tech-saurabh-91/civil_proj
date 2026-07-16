"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Calculator,
  Download,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"

interface EstimationItem {
  id: string
  category: string
  description: string
  estimatedAmount: number
  actualAmount: number
  notes: string
}

interface CreateFormData {
  category: string
  description: string
  estimatedAmount: string
  actualAmount: string
  notes: string
}

const emptyForm: CreateFormData = { category: "", description: "", estimatedAmount: "", actualAmount: "", notes: "" }

export default function EstimationPage() {
  const [items, setItems] = useState<EstimationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState("PRJ-001")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<CreateFormData>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/estimations")
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load estimations")
      setItems(json.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleCreate = async () => {
    if (!formData.category || !formData.description || !formData.estimatedAmount) return
    setCreating(true)
    try {
      const res = await fetch("/api/estimations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          description: formData.description,
          estimatedAmount: Number(formData.estimatedAmount),
          actualAmount: Number(formData.actualAmount) || 0,
          notes: formData.notes,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to create item")
      setItems((prev) => [...prev, json.data])
      setFormData(emptyForm)
      setShowCreateForm(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create item")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this estimation item?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/estimations/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete item")
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete item")
    } finally {
      setDeletingId(null)
    }
  }

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items])

  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return items
    return items.filter((i) => i.category === categoryFilter)
  }, [items, categoryFilter])

  const totalEstimated = items.reduce((s, i) => s + i.estimatedAmount, 0)
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0)
  const netVariance = totalEstimated - totalActual

  const categorySummary = useMemo(() => {
    const summary: { name: string; estimated: number; actual: number; variance: number; variancePercent: number }[] = []
    categories.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat)
      const est = catItems.reduce((s, i) => s + i.estimatedAmount, 0)
      const act = catItems.reduce((s, i) => s + i.actualAmount, 0)
      const v = est - act
      summary.push({ name: cat, estimated: est, actual: act, variance: v, variancePercent: est > 0 ? parseFloat(((v / est) * 100).toFixed(1)) : 0 })
    })
    return summary
  }, [items, categories])

  const chartData = categorySummary.map((c) => ({ name: c.name, Estimated: c.estimated / 100000, Actual: c.actual / 100000 }))

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cost Estimation" description="Track estimated vs actual costs across project categories" breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Estimation" }]} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading estimations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cost Estimation" description="Track estimated vs actual costs across project categories" breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Estimation" }]} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button onClick={fetchItems} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Estimation"
        description="Track estimated vs actual costs across project categories"
        breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Estimation" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="mr-2 h-4 w-4" />
              {showCreateForm ? "Cancel" : "Add Item"}
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Estimation Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} />
              <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} />
              <Input placeholder="Estimated Amount (₹)" type="number" value={formData.estimatedAmount} onChange={(e) => setFormData((p) => ({ ...p, estimatedAmount: e.target.value }))} />
              <Input placeholder="Actual Amount (₹)" type="number" value={formData.actualAmount} onChange={(e) => setFormData((p) => ({ ...p, actualAmount: e.target.value }))} />
              <Input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} className="sm:col-span-2 lg:col-span-1" />
              <Button onClick={handleCreate} disabled={creating || !formData.category || !formData.description || !formData.estimatedAmount}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Estimated" value={formatCurrency(totalEstimated)} icon={<Calculator className="h-6 w-6" />} color="info" />
        <StatCard label="Total Actual" value={formatCurrency(totalActual)} icon={<Calculator className="h-6 w-6" />} color="warning" />
        <StatCard label="Net Variance" value={`${netVariance >= 0 ? "+" : ""}${formatCurrency(netVariance)}`} icon={netVariance >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />} color={netVariance >= 0 ? "success" : "danger"} />
        <StatCard label="Budget Utilization" value={`${totalEstimated > 0 ? ((totalActual / totalEstimated) * 100).toFixed(1) : 0}%`} icon={<Calculator className="h-6 w-6" />} color="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Estimated vs Actual by Category</CardTitle>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRJ-001">Worli Sky Residences Tower A</SelectItem>
                  <SelectItem value="PRJ-002">BKC Commercial Hub Phase 1</SelectItem>
                  <SelectItem value="PRJ-004">Prestige Lake Ridge Villas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}L`} />
                <Tooltip formatter={(value) => `₹${(Number(value) * 100000).toLocaleString("en-IN")}`} />
                <Legend />
                <Bar dataKey="Estimated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Category Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorySummary.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium text-sm">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">Est: {formatCurrency(cat.estimated)}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={cat.variance >= 0 ? "success" : "destructive"}>{cat.variance >= 0 ? "+" : ""}{cat.variancePercent}%</Badge>
                    <div className={cn("text-xs mt-1 font-medium", cat.variance >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {cat.variance >= 0 ? "+" : ""}{formatCurrency(cat.variance)}
                    </div>
                  </div>
                </div>
              ))}
              {categorySummary.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No categories found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Detailed Estimation Breakdown</CardTitle>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Estimated (₹)</TableHead>
                <TableHead className="text-right">Actual (₹)</TableHead>
                <TableHead className="text-right">Variance (₹)</TableHead>
                <TableHead className="text-right">Variance %</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const variance = item.estimatedAmount - item.actualAmount
                const variancePercent = item.estimatedAmount > 0 ? ((variance / item.estimatedAmount) * 100).toFixed(1) : "0.0"
                const isOver = variance < 0
                return (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.estimatedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.actualAmount)}</TableCell>
                    <TableCell className={cn("text-right font-medium", isOver ? "text-red-600" : "text-emerald-600")}>
                      {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isOver ? "destructive" : "success"}>
                        {variance >= 0 ? "+" : ""}{variancePercent}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>
                        {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No estimation items found.</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell colSpan={2}>Grand Total</TableCell>
                <TableCell className="text-right">{formatCurrency(totalEstimated)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
                <TableCell className={cn("text-right", netVariance < 0 ? "text-red-600" : "text-emerald-600")}>
                  {netVariance >= 0 ? "+" : ""}{formatCurrency(netVariance)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={netVariance >= 0 ? "success" : "destructive"}>
                    {netVariance >= 0 ? "+" : ""}{totalEstimated > 0 ? ((netVariance / totalEstimated) * 100).toFixed(1) : "0.0"}%
                  </Badge>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
