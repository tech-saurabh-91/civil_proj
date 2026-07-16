"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity, AlertCircle, ArrowLeft, Building2, Clock, Coins, DollarSign,
  Download, Edit, FileText, FolderOpen, Loader2, Save, Settings, Target,
  TrendingUp, X, Upload, Eye, Trash2,
} from "lucide-react"

import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/ui/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface ProjectData {
  id: string; name: string; code: string; description?: string | null; type: string; status: string
  startDate?: string | null; endDate?: string | null; budget?: number | null; actualCost?: number | null
  address?: string | null; city?: string | null; state?: string | null; area?: number | null; floors?: number | null
  client?: { id: string; companyName: string; contactPerson: string; email: string; phone: string } | null
  manager?: { id: string; firstName: string; lastName: string; email: string } | null
  surveys?: { id: string; title: string; status: string; scheduledDate?: string | null }[]
  boqItems?: { id: string; serialNumber: number; description: string; category: string; quantity: number; unitRate: number; amount: number }[]
}

const statusVariant: Record<string, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  PLANNING: "info", IN_PROGRESS: "success", ON_HOLD: "warning", COMPLETED: "secondary", CANCELLED: "destructive",
  DRAFT: "secondary", ASSIGNED: "info", SUBMITTED: "info", UNDER_REVIEW: "warning", APPROVED: "success", REJECTED: "destructive",
}
const statusLabel: Record<string, string> = { PLANNING: "Planning", IN_PROGRESS: "In Progress", ON_HOLD: "On Hold", COMPLETED: "Completed", CANCELLED: "Cancelled" }
const typeLabel: Record<string, string> = { RESIDENTIAL: "Residential", COMMERCIAL: "Commercial", INDUSTRIAL: "Industrial", INFRASTRUCTURE: "Infrastructure", INTERIOR: "Interior", MEP: "MEP", RENOVATION: "Renovation" }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emptyForm = { name: "", description: "", type: "", status: "", startDate: "", endDate: "", budget: "", actualCost: "", address: "", city: "", state: "", area: "", floors: "" }
  const [editForm, setEditForm] = useState(emptyForm)

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

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?projectId=${id}`)
      const json = await res.json()
      setDocuments(json.data || [])
    } catch {}
  }, [id])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingDoc(true)
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            type: "OTHER",
            filename: file.name,
            fileData,
            fileSize: file.size,
          }),
        })
        if (res.ok) toast.success(`${file.name} uploaded`)
        else toast.error(`Failed to upload ${file.name}`)
      } catch { toast.error("Upload failed") }
    }
    setUploadingDoc(false)
    fetchDocuments()
    if (e.target) e.target.value = ""
  }

  const startEditing = () => {
    if (!project) return
    setEditForm({
      name: project.name || "", description: project.description || "", type: project.type || "RESIDENTIAL",
      status: project.status || "PLANNING", startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "", budget: project.budget ? String(project.budget) : "",
      actualCost: project.actualCost ? String(project.actualCost) : "", address: project.address || "",
      city: project.city || "", state: project.state || "", area: project.area ? String(project.area) : "",
      floors: project.floors ? String(project.floors) : "",
    })
    setIsEditing(true)
  }

  const saveEdits = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
      const json = await res.json()
      if (json.success) { setIsEditing(false); await fetchProject() }
    } catch {} finally { setSaving(false) }
  }

  const deleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) router.push("/projects")
    } catch {} finally { setDeleting(false) }
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
        <Button asChild variant="outline" className="mt-2">
          <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to Projects</Link>
        </Button>
      </div>
    </div>
  )

  const budget = project.budget || 0
  const spent = project.actualCost || 0
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0
  const remaining = budget - spent
  const mgrInit = project.manager ? getInitials(project.manager.firstName, project.manager.lastName) : "—"
  const mgrName = project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "Unassigned"
  const srvDone = (project.surveys || []).filter(s => s.status === "APPROVED").length
  const srvTotal = (project.surveys || []).length
  const daysLeft = project.endDate ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 864e5)) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name} description={project.code}
        breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Projects", href: "/projects" }, { label: project.name }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}><X className="mr-2 h-4 w-4" />Cancel</Button>
                <Button onClick={saveEdits} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                <Button variant="destructive" onClick={deleteProject} disabled={deleting}>{deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}</Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={statusVariant[project.status] || "secondary"} className="text-sm px-3 py-1">{statusLabel[project.status] || project.status}</Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">{typeLabel[project.type] || project.type}</Badge>
        {project.client && <span className="text-sm text-muted-foreground">{project.client.companyName}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Budget" value={formatCurrency(budget)} color="text-blue-600 bg-blue-50" />
        <MetricCard icon={<Coins className="h-5 w-5" />} label="Spent" value={formatCurrency(spent)} subtext={`${pct}% utilized`} color="text-amber-600 bg-amber-50" />
        <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Remaining" value={formatCurrency(remaining)} color="text-emerald-600 bg-emerald-50" />
        <MetricCard icon={<Target className="h-5 w-5" />} label="Surveys" value={`${srvDone}/${srvTotal}`} subtext={`${srvTotal - srvDone} pending`} color="text-teal-600 bg-teal-50" />
        <MetricCard icon={<FileText className="h-5 w-5" />} label="BOQ Items" value={String((project.boqItems || []).length)} color="text-violet-600 bg-violet-50" />
        {daysLeft !== null && <MetricCard icon={<Clock className="h-5 w-5" />} label="Days Left" value={String(daysLeft)} color="text-rose-600 bg-rose-50" />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2"><Building2 className="h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="surveys" className="gap-2"><Target className="h-4 w-4" />Surveys</TabsTrigger>
          <TabsTrigger value="boq" className="gap-2"><FileText className="h-4 w-4" />BOQ</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FolderOpen className="h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Activity</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Project Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2"><Label>Area (sq.ft)</Label><Input type="number" value={editForm.area} onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Floors</Label><Input type="number" value={editForm.floors} onChange={e => setEditForm(f => ({ ...f, floors: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>End Date</Label><Input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Budget (INR)</Label><Input type="number" value={editForm.budget} onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Actual Cost (INR)</Label><Input type="number" value={editForm.actualCost} onChange={e => setEditForm(f => ({ ...f, actualCost: e.target.value }))} /></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {project.description && <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {project.client && (<><InfoItem label="Client" value={project.client.companyName} /><InfoItem label="Contact" value={project.client.contactPerson} /></>)}
                      {project.area != null && <InfoItem label="Area" value={`${Number(project.area).toLocaleString("en-IN")} sq.ft`} />}
                      {project.floors != null && <InfoItem label="Floors" value={`${project.floors} floors`} />}
                      {project.startDate && <InfoItem label="Start Date" value={formatDate(project.startDate)} />}
                      {project.endDate && <InfoItem label="End Date" value={formatDate(project.endDate)} />}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Project Manager</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary font-bold">{mgrInit}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{mgrName}</p>{project.manager && <p className="text-sm text-muted-foreground">{project.manager.email}</p>}</div>
                  </div>
                </CardContent>
              </Card>
              {project.client && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Client Info</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{project.client.companyName}</p>
                    <p className="text-sm text-muted-foreground">{project.client.contactPerson}</p>
                    <p className="text-sm text-muted-foreground">{project.client.email}</p>
                    <p className="text-sm text-muted-foreground">{project.client.phone}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Budget vs Actual</CardTitle><CardDescription>Budget utilization and cost tracking</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Budget Utilization</span><span className="font-medium">{pct}%</span></div>
                <Progress value={pct} className="h-3" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Approved Budget</p><p className="text-lg font-bold mt-1">{formatCurrency(budget)}</p></div>
                <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Amount Spent</p><p className="text-lg font-bold mt-1">{formatCurrency(spent)}</p></div>
              </div>
            </CardContent>
          </Card>
          {project.startDate && project.endDate && (
            <Card>
              <CardHeader><CardTitle>Project Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6 pl-6">
                    {[{ date: project.startDate, event: "Project Start", status: "completed" }, { date: project.endDate, event: "Project End", status: "upcoming" }].map((item, i) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className={cn("absolute left-[-26px] h-3 w-3 rounded-full border-2 bg-background", item.status === "completed" && "border-primary bg-primary", item.status === "upcoming" && "border-muted-foreground/30")} />
                        <div><p className="text-sm font-medium">{item.event}</p><p className="text-xs text-muted-foreground">{formatDate(item.date)}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Surveys ({srvTotal})</CardTitle><CardDescription>{srvDone} completed, {srvTotal - srvDone} pending</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {srvTotal === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No surveys yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Surveys will appear here once created for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Survey</TableHead><TableHead>Date</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(project.surveys || []).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.scheduledDate ? formatDate(s.scheduledDate) : "—"}</TableCell>
                        <TableCell className="text-center"><Badge variant={statusVariant[s.status] || "secondary"}>{s.status.replace(/_/g, " ")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boq" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Bill of Quantities (BOQ)</CardTitle><CardDescription>Material and work quantity breakdown</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {(project.boqItems || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No BOQ items</h3>
                  <p className="mt-1 text-sm text-muted-foreground">BOQ items will appear here once added to this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Rate (INR)</TableHead><TableHead className="text-right">Amount (INR)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(project.boqItems || []).map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{item.serialNumber}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-sm">{item.category}</TableCell>
                        <TableCell className="text-right text-sm">{item.quantity.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right text-sm">{item.unitRate.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={5}>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency((project.boqItems || []).reduce((s, i) => s + i.amount, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{documents.length} document(s) uploaded</p>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}>
                  {uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Document
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleUploadDoc} />
              </div>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No documents uploaded</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Upload drawings, specifications, contracts, and other project documents</p>
                  <Button className="mt-4" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />Upload Document
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {doc.fileUrl && doc.fileUrl.startsWith("data:") && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingDoc(doc)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {doc.fileUrl && doc.fileUrl.startsWith("data:") && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <a href={doc.fileUrl} download={doc.filename}>
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {viewingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingDoc(null)}>
              <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{viewingDoc.title}</h3>
                    <p className="text-xs text-muted-foreground">{viewingDoc.filename}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={viewingDoc.fileUrl} download={viewingDoc.filename}>
                        <Download className="mr-2 h-4 w-4" />Download
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-[75vh]">
                  {viewingDoc.fileUrl?.startsWith("data:image") ? (
                    <img src={viewingDoc.fileUrl} alt={viewingDoc.title} className="max-w-full h-auto rounded" />
                  ) : viewingDoc.fileUrl?.startsWith("data:application/pdf") ? (
                    <iframe src={viewingDoc.fileUrl} className="w-full h-[600px] rounded border" />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-3" />
                      <p>Preview not available for this file type</p>
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <a href={viewingDoc.fileUrl} download={viewingDoc.filename}>
                          <Download className="mr-2 h-4 w-4" />Download to view
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card><CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No activity recorded</h3>
              <p className="mt-1 text-sm text-muted-foreground">Activity will appear here as the project progresses.</p>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Project Settings</CardTitle><CardDescription>Manage project configuration and preferences</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Project Code</Label><Input value={project.code} disabled className="font-mono" /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={editForm.status} onValueChange={val => setEditForm(f => ({ ...f, status: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={editForm.type} onValueChange={val => setEditForm(f => ({ ...f, type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                    <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                    <SelectItem value="INTERIOR">Interior</SelectItem>
                    <SelectItem value="MEP">MEP</SelectItem>
                    <SelectItem value="RENOVATION">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button onClick={saveEdits} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ icon, label, value, subtext, color }: { icon: React.ReactNode; label: string; value: string; subtext?: string; color: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>{icon}</div>
      <p className="text-xs text-muted-foreground mt-3">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </CardContent></Card>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div>
}
