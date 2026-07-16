"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import {
  AlertCircle, ArrowLeft, Coins, DollarSign, FileText, Loader2, TrendingUp,
} from "lucide-react"

import { cn, formatCurrency, calculatePercentage } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"

interface ProjectData {
  id: string; name: string; code: string; budget?: number | null; actualCost?: number | null
  boqItems?: { id: string; serialNumber: number; description: string; category: string; quantity: number; unitRate: number; amount: number }[]
}

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch(`/api/projects/${id}`)
      const json = await res.json()
      if (!json.success || !json.data) { setError(json.error || "Project not found"); return }
      setProject(json.data)
    } catch { setError("Failed to load project") } finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    </div>
  )

  if (error || !project) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || "The project you're looking for doesn't exist."}</p>
        <Button asChild variant="outline"><Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to Projects</Link></Button>
      </div>
    </div>
  )

  const budget = project.budget || 0
  const spent = project.actualCost || 0
  const remaining = budget - spent
  const utilization = calculatePercentage(spent, budget)
  const boqItems = project.boqItems || []

  const categoryMap = boqItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { total: 0, items: [] }
    acc[item.category].total += item.amount
    acc[item.category].items.push(item)
    return acc
  }, {} as Record<string, { total: number; items: typeof boqItems }>)

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].total - a[1].total)
  const budgetColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Overview"
        description={`Financial summary for ${project.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: '/dashboard' },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${id}` },
          { label: "Budget" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><DollarSign className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Total Budget</p>
          <p className="text-lg font-bold mt-0.5">{formatCurrency(budget)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Coins className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Actual Spent</p>
          <p className="text-lg font-bold mt-0.5">{formatCurrency(spent)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Remaining</p>
          <p className="text-lg font-bold mt-0.5">{formatCurrency(remaining)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><FileText className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Utilization</p>
          <p className="text-lg font-bold mt-0.5">{utilization}%</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Budget Utilization</CardTitle><CardDescription>Spent vs remaining budget</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Used</span>
              <span className="font-medium">{formatCurrency(spent)} of {formatCurrency(budget)}</span>
            </div>
            <Progress value={utilization} className="h-3" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Approved Budget</p>
              <p className="text-lg font-bold mt-1">{formatCurrency(budget)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Amount Spent</p>
              <p className="text-lg font-bold mt-1">{formatCurrency(spent)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Remaining Budget</p>
              <p className={cn("text-lg font-bold mt-1", remaining < 0 && "text-destructive")}>{formatCurrency(remaining)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Category-wise Breakdown</CardTitle><CardDescription>Budget distribution by category</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map(([cat, data], i) => {
                const catPct = calculatePercentage(data.total, budget)
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", budgetColors[i % budgetColors.length])} />
                        <span className="text-sm font-medium">{cat}</span>
                        <Badge variant="outline" className="text-[10px]">{data.items.length} items</Badge>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(data.total)} ({catPct}%)</span>
                    </div>
                    <Progress value={catPct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>BOQ Items</CardTitle><CardDescription>Bill of quantities detail ({boqItems.length} items)</CardDescription></CardHeader>
        <CardContent>
          {boqItems.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="No BOQ items" description="Bill of quantities items will appear here." />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-12">#</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Budget</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {boqItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{item.serialNumber}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{item.quantity.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(item.unitRate)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right text-sm">{calculatePercentage(item.amount, budget)}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell colSpan={5}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(boqItems.reduce((s, i) => s + i.amount, 0))}</TableCell>
                  <TableCell className="text-right">{calculatePercentage(boqItems.reduce((s, i) => s + i.amount, 0), budget)}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
