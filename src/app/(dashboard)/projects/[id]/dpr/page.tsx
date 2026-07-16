"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock, FileText, Loader2,
  Plus, Send, Target, AlertTriangle, XCircle,
} from "lucide-react"

import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"

interface ProjectData {
  id: string; name: string; code: string
  surveys?: { id: string; title: string; status: string; scheduledDate?: string | null }[]
  measurements?: { id: string; description: string; value?: number; unit?: string; createdAt?: string }[]
  activities?: { id: string; title: string; status: string; createdAt?: string }[]
  risks?: { id: string; title: string; severity: string; status: string }[]
}

interface DprEntry {
  id: string; note: string; timestamp: string
}

const surveyTaskStatus = (status: string) => {
  const map: Record<string, { label: string; icon: React.ReactNode; variant: "success" | "info" | "warning" | "destructive" }> = {
    APPROVED: { label: "DONE", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "success" },
    SUBMITTED: { label: "IN_PROGRESS", icon: <Clock className="h-3.5 w-3.5" />, variant: "info" },
    UNDER_REVIEW: { label: "IN_PROGRESS", icon: <Clock className="h-3.5 w-3.5" />, variant: "info" },
    IN_PROGRESS: { label: "IN_PROGRESS", icon: <Clock className="h-3.5 w-3.5" />, variant: "info" },
    ASSIGNED: { label: "PENDING", icon: <Clock className="h-3.5 w-3.5" />, variant: "warning" },
    DRAFT: { label: "PENDING", icon: <Clock className="h-3.5 w-3.5" />, variant: "warning" },
    REJECTED: { label: "PENDING", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
  }
  return map[status] || { label: "PENDING", icon: <Clock className="h-3.5 w-3.5" />, variant: "warning" as const }
}

export default function DprPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dprEntries, setDprEntries] = useState<DprEntry[]>([])
  const [newNote, setNewNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

  const submitDpr = async () => {
    if (!newNote.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    setDprEntries(prev => [{ id: Date.now().toString(), note: newNote.trim(), timestamp: new Date().toISOString() }, ...prev])
    setNewNote("")
    setSubmitting(false)
  }

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

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const surveys = project.surveys || []
  const measurements = project.measurements || []
  const activities = project.activities || []
  const risks = project.risks || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Progress Report"
        description={`${project.name} — ${today}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${id}` },
          { label: "DPR" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Target className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Total Tasks</p>
          <p className="text-lg font-bold mt-0.5">{surveys.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Completed</p>
          <p className="text-lg font-bold mt-0.5">{surveys.filter(s => s.status === "APPROVED").length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Measurements</p>
          <p className="text-lg font-bold mt-0.5">{measurements.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground mt-3">Open Risks</p>
          <p className="text-lg font-bold mt-0.5">{risks.filter(r => r.status !== "RESOLVED").length}</p>
        </CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Today&apos;s Tasks</CardTitle><CardDescription>Survey tasks and their status</CardDescription></CardHeader>
            <CardContent>
              {surveys.length === 0 ? (
                <EmptyState icon={<Target className="h-6 w-6" />} title="No tasks" description="No survey tasks for this project." />
              ) : (
                <div className="space-y-3">
                  {surveys.map(s => {
                    const ts = surveyTaskStatus(s.status)
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0">{ts.icon}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.title}</p>
                            {s.scheduledDate && <p className="text-xs text-muted-foreground">{formatDate(s.scheduledDate)}</p>}
                          </div>
                        </div>
                        <Badge variant={ts.variant} className="flex-shrink-0 ml-2">{ts.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Measurements</CardTitle><CardDescription>Completed work items</CardDescription></CardHeader>
            <CardContent>
              {measurements.length === 0 ? (
                <EmptyState icon={<FileText className="h-6 w-6" />} title="No measurements" description="No measurements recorded yet." />
              ) : (
                <div className="space-y-2">
                  {measurements.map(m => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.description}</p>
                        {m.createdAt && <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>}
                      </div>
                      {m.value != null && (
                        <span className="text-sm font-medium flex-shrink-0 ml-4">
                          {m.value.toLocaleString("en-IN")} {m.unit || ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activity Log</CardTitle><CardDescription>Recent activities</CardDescription></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <EmptyState icon={<Clock className="h-6 w-6" />} title="No activity" description="No activities recorded yet." />
              ) : (
                <div className="space-y-2">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", a.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-500")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        {a.createdAt && <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>}
                      </div>
                      <Badge variant={a.status === "COMPLETED" ? "success" : "info"} className="flex-shrink-0">
                        {a.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Issues</CardTitle><CardDescription>Risks requiring attention</CardDescription></CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No risks" description="No risks identified." />
              ) : (
                <div className="space-y-2">
                  {risks.filter(r => r.status !== "RESOLVED").map(r => (
                    <div key={r.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{r.title}</p>
                      <Badge variant={r.severity === "CRITICAL" || r.severity === "HIGH" ? "destructive" : "warning"} className="mt-1">
                        {r.severity}
                      </Badge>
                    </div>
                  ))}
                  {risks.every(r => r.status === "RESOLVED") && (
                    <p className="text-sm text-muted-foreground text-center py-4">All issues resolved</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">New DPR Entry</CardTitle><CardDescription>Add today&apos;s progress note</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe today's progress, issues, and observations..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={4}
              />
              <Button onClick={submitDpr} disabled={submitting || !newNote.trim()} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Entry
              </Button>
            </CardContent>
          </Card>

          {dprEntries.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Entries</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dprEntries.map(e => (
                    <div key={e.id} className="rounded-lg border p-3">
                      <p className="text-sm">{e.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(e.timestamp).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
