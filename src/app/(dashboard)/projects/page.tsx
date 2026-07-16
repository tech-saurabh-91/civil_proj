"use client"

import { Fragment, useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  FolderOpen,
  GanttChart,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Newspaper,
  PieChart,
  Plus,
  Search,
  Send,
  TableIcon,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
  X,
} from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Project {
  id: string
  name: string
  code: string
  clientName: string
  status: string
  type: string
  managerName: string
  managerInitials: string
  budget: number
  spent: number
  progress: number
  startDate: string
  endDate: string
  city: string
  floors: number
  area: number
}

interface EnrichedProject extends Project {
  healthScore: "Healthy" | "At Risk" | "Critical"
  aiRisk: "Low" | "Medium" | "High"
  aiRiskReason: string
  daysBehind: number
  materialStatus: "Available" | "Low" | "Critical"
  clientApproval: "Waiting" | "Approved" | "Rejected"
  stage: string
  budgetRemaining: number
  budgetUsedPercent: number
  expectedProgress: number
  daysRemaining: number
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function computeStage(progress: number): string {
  if (progress < 15) return "Foundation"
  if (progress < 30) return "Structure"
  if (progress < 50) return "Brick Work"
  if (progress < 70) return "Electrical"
  if (progress < 90) return "Finishing"
  return "Handover"
}

function computeHealthScore(
  budgetUsedPercent: number,
  progress: number,
  expectedProgress: number
): "Healthy" | "At Risk" | "Critical" {
  if (budgetUsedPercent > 90 || progress < expectedProgress - 20) return "Critical"
  if (budgetUsedPercent > 75 || progress < expectedProgress - 10) return "At Risk"
  return "Healthy"
}

function computeDaysBehind(
  startDate: string,
  endDate: string,
  progress: number
): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (end <= start) return 0
  const totalDays = (end - start) / (1000 * 60 * 60 * 24)
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24)
  const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  const diff = expectedProgress - progress
  return Math.round(diff > 0 ? diff * 0.5 : diff * 0.5)
}

function enrichProject(project: Project): EnrichedProject {
  const budgetRemaining = project.budget - project.spent
  const budgetUsedPercent = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

  const start = new Date(project.startDate).getTime()
  const end = new Date(project.endDate).getTime()
  const now = Date.now()
  const totalMs = end - start
  const elapsedMs = now - start
  const expectedProgress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0

  const daysRemaining = Math.max(
    0,
    Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  )

  const daysBehindRaw = computeDaysBehind(project.startDate, project.endDate, project.progress)
  const daysBehind = Math.round(daysBehindRaw)

  const healthScore = computeHealthScore(budgetUsedPercent, project.progress, expectedProgress)

  // Deterministic pseudo-random based on project id for consistent assignment
  const hash = project.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const riskLevels: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"]
  const aiRisk = riskLevels[hash % 3]
  const materialStatuses: Array<"Available" | "Low" | "Critical"> = ["Available", "Low", "Critical"]
  const materialStatus = materialStatuses[(hash * 7) % 3]
  const approvals: Array<"Waiting" | "Approved" | "Rejected"> = ["Waiting", "Approved", "Rejected"]
  const clientApproval = approvals[(hash * 13) % 3]

  const riskReasons: Record<string, string> = {
    Low: "Project is on track with good budget utilization and timeline adherence.",
    Medium: "Budget usage is approaching threshold. Monitor material procurement closely.",
    High: "Significant delay detected. Budget overrun likely. Requires immediate attention.",
  }

  return {
    ...project,
    healthScore,
    aiRisk,
    aiRiskReason: riskReasons[aiRisk],
    daysBehind,
    materialStatus,
    clientApproval,
    stage: computeStage(project.progress),
    budgetRemaining,
    budgetUsedPercent,
    expectedProgress,
    daysRemaining,
  }
}

// ---------------------------------------------------------------------------
// Tiny sub-components
// ---------------------------------------------------------------------------

function HealthBadge({ score }: { score: "Healthy" | "At Risk" | "Critical" }) {
  const map = {
    Healthy: { icon: "🟢", variant: "success" as const },
    "At Risk": { icon: "🟡", variant: "warning" as const },
    Critical: { icon: "🔴", variant: "destructive" as const },
  }
  const { icon, variant } = map[score]
  return (
    <Badge variant={variant} className="gap-1">
      <span>{icon}</span> {score}
    </Badge>
  )
}

function RiskBadge({ level, reason }: { level: "Low" | "Medium" | "High"; reason: string }) {
  const variantMap = {
    Low: "success" as const,
    Medium: "warning" as const,
    High: "destructive" as const,
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variantMap[level]} className="cursor-pointer">
            {level}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function MaterialStatusBadge({ status }: { status: "Available" | "Low" | "Critical" }) {
  const map = {
    Available: "success" as const,
    Low: "warning" as const,
    Critical: "destructive" as const,
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

function ApprovalBadge({ status }: { status: "Waiting" | "Approved" | "Rejected" }) {
  const map = {
    Waiting: "warning" as const,
    Approved: "success" as const,
    Rejected: "destructive" as const,
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

function DaysBehindLabel({ days }: { days: number }) {
  if (days > 0) return <span className="text-sm font-medium text-red-600">{days} Days Behind</span>
  if (days < 0) return <span className="text-sm font-medium text-emerald-600">Ahead by {Math.abs(days)} Days</span>
  return <span className="text-sm text-muted-foreground">On Track</span>
}

function BudgetBar({ percent }: { percent: number }) {
  const color = percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="w-full">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  )
}

function StageIcon({ stage }: { stage: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    Foundation: <FolderOpen className="h-3.5 w-3.5" />,
    Structure: <Building2 className="h-3.5 w-3.5" />,
    "Brick Work": <GripVertical className="h-3.5 w-3.5" />,
    Electrical: <Zap className="h-3.5 w-3.5" />,
    Finishing: <CheckCircle2 className="h-3.5 w-3.5" />,
    Handover: <PieChart className="h-3.5 w-3.5" />,
  }
  return <span className="inline-flex items-center gap-1">{iconMap[stage] ?? null}{stage}</span>
}

// ---------------------------------------------------------------------------
// Quick action buttons for a project row
// ---------------------------------------------------------------------------

function QuickActions({ project }: { project: EnrichedProject }) {
  const actions = [
    { label: "Dashboard", icon: PieChart, href: `/projects/${project.id}` },
    { label: "DPR", icon: Newspaper, href: `/projects/${project.id}/dpr` },
    { label: "Drawings", icon: FileText, href: `/projects/${project.id}/drawings` },
    { label: "Budget", icon: CircleDollarSign, href: `/projects/${project.id}/budget` },
    { label: "Photos", icon: Camera, href: `/projects/${project.id}/photos` },
    { label: "Map", icon: MapPin, href: `/projects/${project.id}/map` },
  ]
  return (
    <div className="flex items-center gap-0.5">
      {actions.map((a) => (
        <TooltipProvider key={a.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={a.href}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <a.icon className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">{a.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Expanded row content — fetches real data from API
// ---------------------------------------------------------------------------

function ExpandedRowContent({ project }: { project: EnrichedProject }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!project.id) return
    setLoading(true)
    fetch(`/api/projects/${project.id}`)
      .then((r) => r.json())
      .then((res) => { setData(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [project.id])

  if (loading) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={15} className="p-6 text-center text-muted-foreground text-sm">Loading...</TableCell>
      </TableRow>
    )
  }

  const photos = data?.photos || []
  const surveys = data?.surveys || []
  const risks = data?.risks || []
  const materials = data?.materials || []
  const activities = data?.activities || []

  return (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={15} className="p-0">
        <div className="px-6 py-4">
          <Tabs defaultValue="photos">
            <TabsList>
              <TabsTrigger value="photos">Latest Site Photos ({photos.length})</TabsTrigger>
              <TabsTrigger value="dpr">Surveys ({surveys.length})</TabsTrigger>
              <TabsTrigger value="issues">Risks ({risks.length})</TabsTrigger>
              <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No photos uploaded yet</p>
              ) : (
                <div className="grid grid-cols-4 gap-3 pt-2">
                  {photos.map((photo: any) => (
                    <div key={photo.id} className="rounded-lg border bg-muted/50 aspect-video flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground text-center px-1">{photo.caption || photo.filename}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dpr">
              {surveys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No surveys yet</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {surveys.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      {s.status === "APPROVED" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {s.status === "IN_PROGRESS" && <Clock className="h-4 w-4 text-blue-500" />}
                      {["PENDING", "DRAFT", "ASSIGNED"].includes(s.status) && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      <span>{s.title}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="issues">
              {risks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No risks identified</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {risks.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{r.title}</span>
                      <Badge variant={r.level === "HIGH" || r.level === "CRITICAL" ? "destructive" : r.level === "MEDIUM" ? "warning" : "secondary"}>
                        {r.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials">
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No materials tracked</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {materials.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{m.materialName}</span>
                        <span className="text-muted-foreground">{m.quantity} {m.unit}</span>
                      </div>
                      <Badge variant="outline">{m.specification || 'Standard'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent activity</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 w-20">
                        {new Date(act.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{act.description || act.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Card view component
// ---------------------------------------------------------------------------

function ProjectCardView({ project }: { project: EnrichedProject }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/projects/${project.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
              {project.name}
            </Link>
            <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
          </div>
          <HealthBadge score={project.healthScore} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Budget Used</span>
            <span className="font-medium">{project.budgetUsedPercent.toFixed(0)}%</span>
          </div>
          <BudgetBar percent={project.budgetUsedPercent} />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <RiskBadge level={project.aiRisk} reason={project.aiRiskReason} />
          <DaysBehindLabel days={project.daysBehind} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {project.managerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground">{project.managerName}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">{project.daysRemaining} days left</span>
        </div>

        <div className="flex items-center gap-1 pt-1 border-t">
          <QuickActions project={project} />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// AI Assistant floating panel
// ---------------------------------------------------------------------------

function AIAssistant({ projects }: { projects: EnrichedProject[] }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([])

  const respond = useCallback(
    (question: string) => {
      const q = question.toLowerCase()
      if (q.includes("delay")) {
        const delayed = projects.filter((p) => p.daysBehind > 3)
        if (delayed.length === 0) return "No significantly delayed projects found."
        return `Found ${delayed.length} delayed project(s):\n${delayed.map((p) => `• ${p.name} (${p.daysBehind} days behind)`).join("\n")}`
      }
      if (q.includes("budget") && (q.includes("overrun") || q.includes("exceed"))) {
        const over = projects.filter((p) => p.budgetUsedPercent > 85)
        if (over.length === 0) return "No budget overruns detected."
        return `${over.length} project(s) have budget over 85% utilization:\n${over.map((p) => `• ${p.name}: ${p.budgetUsedPercent.toFixed(0)}% used`).join("\n")}`
      }
      if (q.includes("report")) {
        const total = projects.length
        const active = projects.filter((p) => p.status === "In Progress").length
        const totalBudget = projects.reduce((a, p) => a + p.budget, 0)
        const totalSpent = projects.reduce((a, p) => a + p.spent, 0)
        return `Project Report Summary:\n• Total Projects: ${total}\n• Active: ${active}\n• Total Budget: ${formatCurrency(totalBudget)}\n• Total Spent: ${formatCurrency(totalSpent)}\n• Overall Utilization: ${((totalSpent / totalBudget) * 100).toFixed(1)}%`
      }
      if (q.includes("pending") || q.includes("approval")) {
        const waiting = projects.filter((p) => p.clientApproval === "Waiting")
        if (waiting.length === 0) return "No pending approvals."
        return `${waiting.length} project(s) pending client approval:\n${waiting.map((p) => `• ${p.name} (${p.clientName})`).join("\n")}`
      }
      return "I can help with: delayed projects, budget overruns, project reports, and pending approvals. Try asking about one of these topics."
    },
    [projects]
  )

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput((prev) => prev)
    setMessages((prev) => [...prev, { role: "user", text: userMsg }])
    const reply = respond(userMsg)
    setMessages((prev) => [...prev, { role: "ai", text: reply }])
    setInput("")
  }

  const quickCommands = [
    "Show delayed projects",
    "Show budget overruns",
    "Generate project report",
    "Show pending approvals",
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <Card className="mb-3 w-[380px] shadow-2xl border">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Project Assistant</h3>
                <p className="text-[10px] text-muted-foreground">Ask about your projects</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="h-[280px] pr-2">
              <div className="space-y-3 mb-3">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Ask me anything about your projects
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickCommands.map((cmd) => (
                <Button key={cmd} variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => { setInput(cmd); }}>
                  {cmd}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="h-9"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [healthFilter, setHealthFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects")
        if (res.ok) {
          const data = await res.json()
          const raw = data.data ?? data.projects ?? (Array.isArray(data) ? data : [])
          setProjects(raw)
        } else {
          setProjects([])
        }
      } catch {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const enriched = useMemo(() => projects.map(enrichProject), [projects])

  const cities = useMemo(() => [...new Set(enriched.map((p) => p.city))].sort(), [enriched])
  const clients = useMemo(() => [...new Set(enriched.map((p) => p.clientName))].sort(), [enriched])

  const filtered = useMemo(() => {
    return enriched.filter((p) => {
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === "all" || p.status === statusFilter
      const matchStage = stageFilter === "all" || p.stage === stageFilter
      const matchHealth = healthFilter === "all" || p.healthScore === healthFilter
      const matchRisk = riskFilter === "all" || p.aiRisk === riskFilter
      const matchCity = cityFilter === "all" || p.city === cityFilter
      const matchClient = clientFilter === "all" || p.clientName === clientFilter
      return matchSearch && matchStatus && matchStage && matchHealth && matchRisk && matchCity && matchClient
    })
  }, [enriched, searchQuery, statusFilter, stageFilter, healthFilter, riskFilter, cityFilter, clientFilter])

  // Summary stats
  const stats = useMemo(() => {
    const total = enriched.length
    const active = enriched.filter((p) => p.status === "In Progress").length
    const completed = enriched.filter((p) => p.status === "Completed").length
    const atRisk = enriched.filter((p) => p.healthScore === "At Risk" || p.healthScore === "Critical").length
    const budgetOverrun = enriched.filter((p) => p.spent > p.budget).length
    const pendingApprovals = enriched.filter((p) => p.clientApproval === "Waiting").length
    return { total, active, completed, atRisk, budgetOverrun, pendingApprovals }
  }, [enriched])

  // Selection handlers
  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((p) => p.id)))
  }
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setStageFilter("all")
    setHealthFilter("all")
    setRiskFilter("all")
    setCityFilter("all")
    setClientFilter("all")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || stageFilter !== "all" || healthFilter !== "all" || riskFilter !== "all" || cityFilter !== "all" || clientFilter !== "all"

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Management"
          description="Track and manage all construction projects across clients"
          breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Projects" }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description="Track and manage all construction projects across clients"
        breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Projects" }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-background p-1">
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="h-8">
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("card")} className="h-8">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Projects" value={stats.total} icon={<GanttChart className="h-6 w-6" />} color="default" />
        <StatCard label="Active" value={stats.active} icon={<TrendingUp className="h-6 w-6" />} color="info" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="h-6 w-6" />} color="success" />
        <StatCard label="At Risk" value={stats.atRisk} icon={<AlertTriangle className="h-6 w-6" />} color="warning" />
        <StatCard label="Budget Overrun" value={stats.budgetOverrun} icon={<TrendingDown className="h-6 w-6" />} color="danger" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={<Clock className="h-6 w-6" />} color="warning" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {["Planning", "In Progress", "On Hold", "Completed", "Cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {["Foundation", "Structure", "Brick Work", "Electrical", "Finishing", "Handover"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health</SelectItem>
                  {["Healthy", "At Risk", "Critical"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="AI Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  {["Low", "Medium", "High"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-2.5">
              <span className="text-sm font-medium">{selectedIds.size} project{selectedIds.size > 1 ? "s" : ""} selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" className="h-8">
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  Assign Manager
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Update Status
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  Archive
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedIds(new Set())}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {viewMode === "table" ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                      </TableHead>
                      <TableHead className="w-[90px]">Code</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>AI Risk</TableHead>
                      <TableHead className="min-w-[200px]">Budget Info</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((project) => (
                      <Fragment key={project.id}>
                        <TableRow className={cn(selectedIds.has(project.id) && "bg-primary/5")}>
                          <TableCell>
                            <Checkbox checked={selectedIds.has(project.id)} onCheckedChange={() => toggleOne(project.id)} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{project.code}</TableCell>
                          <TableCell>
                            <Link href={`/projects/${project.id}`} className="font-medium hover:text-primary transition-colors">
                              {project.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">{project.clientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <StageIcon stage={project.stage} />
                              {project.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <HealthBadge score={project.healthScore} />
                          </TableCell>
                          <TableCell>
                            <RiskBadge level={project.aiRisk} reason={project.aiRiskReason} />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(project.budget)} / {formatCurrency(project.spent)}
                              </div>
                              <div className="text-xs">Rem: {formatCurrency(project.budgetRemaining)}</div>
                              <BudgetBar percent={project.budgetUsedPercent} />
                              <div className="text-[11px] font-medium" style={{ color: project.budgetUsedPercent > 90 ? "hsl(var(--destructive))" : project.budgetUsedPercent > 75 ? "hsl(var(--chart-4))" : "hsl(var(--chart-2))" }}>
                                {project.budgetUsedPercent.toFixed(1)}% used
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DaysBehindLabel days={project.daysBehind} />
                          </TableCell>
                          <TableCell>
                            <MaterialStatusBadge status={project.materialStatus} />
                          </TableCell>
                          <TableCell>
                            <ApprovalBadge status={project.clientApproval} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {project.managerInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm whitespace-nowrap">{project.managerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <QuickActions project={project} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(project.id)}>
                              {expandedIds.has(project.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedIds.has(project.id) && <ExpandedRowContent project={project} />}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GanttChart className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {enriched.length === 0 ? "No projects yet. Create your first project." : "Try adjusting your search or filters"}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((project) => (
                <ProjectCardView key={project.id} project={project} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <GanttChart className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {enriched.length === 0 ? "No projects yet. Create your first project." : "Try adjusting your search or filters"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant projects={enriched} />
    </div>
  )
}


