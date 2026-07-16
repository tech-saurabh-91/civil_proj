'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  Bot, Search, FolderKanban, ClipboardList, IndianRupee, FileText,
  Camera, AlertTriangle, Clock, Users, Package, FileCheck,
  ShieldAlert, TrendingUp, UserPlus, Send, Bell, CheckCircle,
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind,
  X, ChevronRight, ArrowUpRight, AlertCircle, Info, Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Project {
  id: string; name: string; code: string; status: string; budget: number;
  actualCost: number; startDate: string; endDate: string; client: string;
  manager: string; area: number; floors: number; city: string;
}
interface Survey {
  id: string; title: string; status: string; scheduledDate: string;
  completedDate: string | null; engineerId: string; projectId: string;
}
interface Notification {
  id: string; title: string; message: string; type: string;
  isRead: boolean; userId: string; createdAt: string;
}
interface Lead {
  id: string; name: string; email: string; phone: string; company: string;
  status: string; priority: string; estimatedValue: number | null;
  source: string; assignedTo: { firstName: string; lastName: string } | null;
  client: { id: string; companyName: string } | null;
  convertedAt: string | null; createdAt: string;
}
interface Material {
  id: string; materialName: string; quantity: number; unit: string;
  estimatedCost: number; status: string; priority: string; supplierName: string;
}
interface WeatherData {
  temperature: number; humidity: number; windSpeed: number;
  description: string; icon: string; city: string;
  daily: { date: string; max: number; min: number; description: string; icon: string }[];
}

const quickActions = [
  { label: 'New Project', href: '/projects/new', icon: <FolderKanban className="h-4 w-4" /> },
  { label: 'Create DPR', href: '/reports/generate', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'Purchase Order', href: '/boq', icon: <IndianRupee className="h-4 w-4" /> },
  { label: 'Upload Site Photo', href: '/media/photos', icon: <Camera className="h-4 w-4" /> },
  { label: 'Create BOQ', href: '/boq', icon: <FileText className="h-4 w-4" /> },
  { label: 'New Lead', href: '/leads/new', icon: <UserPlus className="h-4 w-4" /> },
  { label: 'Send Quotation', href: '/quotations/new', icon: <Send className="h-4 w-4" /> },
]

const statusColorMap: Record<string, string> = {
  IN_PROGRESS: '#10b981', PLANNING: '#3b82f6', COMPLETED: '#8b5cf6',
  ON_HOLD: '#f59e0b', CRITICAL: '#ef4444', NOT_STARTED: '#94a3b8', CANCELLED: '#6b7280',
}
const statusLabel: Record<string, string> = {
  IN_PROGRESS: 'In Progress', PLANNING: 'Planning', COMPLETED: 'Completed',
  ON_HOLD: 'On Hold', CRITICAL: 'Critical', NOT_STARTED: 'Not Started', CANCELLED: 'Cancelled',
}
const notifSeverityBorder: Record<string, string> = {
  critical: 'border-l-red-500', warning: 'border-l-orange-500',
  info: 'border-l-blue-500', completed: 'border-l-green-500',
}
const notifSeverityIcon: Record<string, { icon: React.ElementType; bg: string }> = {
  critical: { icon: AlertTriangle, bg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
  warning: { icon: AlertCircle, bg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' },
  info: { icon: Info, bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  completed: { icon: CheckCircle, bg: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
}
const materialPriorityStyles: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
  LOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
}

const formatCurrency = (v: number | null | undefined) => { if (v == null) return '₹0'; return v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}` }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  MANAGER_APPROVED: 'bg-teal-100 text-teal-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? 's' : ''} ago`
}

function getWeatherIcon(code: number) {
  if (code <= 1) return Sun
  if (code <= 3) return CloudSun
  if (code <= 49) return Cloud
  if (code <= 59) return CloudRain
  if (code <= 69) return CloudSnow
  if (code <= 79) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  if (code <= 99) return CloudLightning
  return Cloud
}

function getWeatherLabel(code: number) {
  if (code <= 1) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 49) return 'Overcast'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 82) return 'Rain Showers'
  if (code <= 86) return 'Snow Showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Cloudy'
}

const WMO_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DashboardPage() {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [notifTab, setNotifTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentTime(new Date())
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/surveys').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()),
      fetch('/api/leads?limit=100').then(r => r.json()),
      fetch('/api/materials').then(r => r.json()),
    ]).then(([projRes, survRes, notifRes, leadRes, matRes]) => {
      if (projRes.success) setProjects(projRes.data)
      if (survRes.success) {
        setSurveys(survRes.data)
        setPendingApprovals((survRes.data || []).filter((s: any) =>
          s.status === 'SUBMITTED' || s.status === 'MANAGER_APPROVED'
        ))
      }
      if (notifRes.success) setNotifications(notifRes.data)
      if (leadRes.success) setLeads(leadRes.data ?? [])
      if (matRes.success) setMaterials(matRes.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))

    const fetchWeather = (lat: number, lon: number, tz: string) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${encodeURIComponent(tz)}&forecast_days=4`)
        .then(r => r.json())
        .then(data => {
          if (data.current) {
            const daily = data.daily
            setWeather({
              temperature: Math.round(data.current.temperature_2m),
              humidity: data.current.relative_humidity_2m,
              windSpeed: Math.round(data.current.wind_speed_10m),
              description: getWeatherLabel(data.current.weather_code),
              icon: String(data.current.weather_code),
              daily: daily.time.map((d: string, i: number) => ({
                date: d,
                max: Math.round(daily.temperature_2m_max[i]),
                min: Math.round(daily.temperature_2m_min[i]),
                description: getWeatherLabel(daily.weather_code[i]),
                icon: String(daily.weather_code[i]),
              })),
              city: data.timezone?.split('/')?.pop()?.replace('_', ' ') || 'Your Location',
            })
          }
        }).catch(() => {})

      reverseGeocode(lat, lon)
    }

    const reverseGeocode = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1&language=en`)
        const data = await res.json()
        if (data.results?.[0]) {
          setWeather((prev: any) => prev ? { ...prev, city: data.results[0].name } : prev)
        }
      } catch {}
    }

    const defaultLat = 21.1458
    const defaultLon = 79.0882
    const defaultTz = 'Asia/Kolkata'

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTz
          fetchWeather(lat, lon, tz)
        },
        () => {
          fetchWeather(defaultLat, defaultLon, defaultTz)
        },
        { timeout: 5000 }
      )
    } else {
      fetchWeather(defaultLat, defaultLon, defaultTz)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userName = useMemo(() => session?.user?.name?.split(' ')[0] ?? 'User', [session])

  const greeting = useMemo(() => {
    if (!currentTime) return 'Good morning'
    const h = currentTime.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [currentTime])

  const handleApprovalAction = async (surveyId: string, action: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        setPendingApprovals((prev) => prev.filter((s) => s.id !== surveyId))
      } else {
        toast.error(json.error || 'Action failed')
      }
    } catch {
      toast.error('Action failed')
    }
  }

  const today = (currentTime ?? new Date()).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const kpis = useMemo(() => {
    const active = projects.filter(p => p.status === 'IN_PROGRESS').length
    const completed = projects.filter(p => p.status === 'COMPLETED').length
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
    const totalSpent = projects.reduce((s, p) => s + (p.actualCost || 0), 0)
    const surveysPending = surveys.filter(s => s.status !== 'APPROVED').length
    const totalLeads = leads.length
    const convertedLeads = leads.filter(l => l.status === 'WON').length
    return [
      { label: 'Total Projects', value: projects.length, color: 'info' as const, icon: <FolderKanban className="h-5 w-5" /> },
      { label: 'Active Projects', value: active, color: 'success' as const, icon: <TrendingUp className="h-5 w-5" /> },
      { label: 'Completed', value: completed, color: 'success' as const, icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Total Budget', value: formatCurrency(totalBudget), color: 'info' as const, icon: <IndianRupee className="h-5 w-5" /> },
      { label: 'Total Leads', value: totalLeads, color: 'info' as const, icon: <Users className="h-5 w-5" /> },
      { label: 'Converted', value: convertedLeads, color: 'success' as const, icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Surveys Pending', value: surveysPending, color: 'warning' as const, icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Notifications', value: notifications.filter(n => !n.isRead).length, color: 'info' as const, icon: <Bell className="h-5 w-5" /> },
    ]
  }, [projects, surveys, notifications, leads])

  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabel[status] || status, value, color: statusColorMap[status] || '#94a3b8',
    }))
  }, [projects])

  const projectCards = useMemo(() => {
    return projects.slice(0, 8).map(p => {
      const budgetPct = p.budget > 0 ? Math.round((p.actualCost / p.budget) * 100) : 0
      const end = new Date(p.endDate)
      const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
      const health = budgetPct > 100 ? 'Critical' : budgetPct > 85 ? 'At Risk' : 'Good'
      return { ...p, budgetPct, daysLeft, health }
    })
  }, [projects])

  const filteredNotifs = useMemo(() => {
    const mapped = notifications.map(n => ({
      ...n, category: n.type?.toLowerCase() || 'info',
      severity: n.type?.toLowerCase() || 'info',
      time: timeAgo(n.createdAt),
    }))
    if (notifTab === 'all') return mapped
    return mapped.filter(n => n.category === notifTab)
  }, [notifications, notifTab])

  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return projects
      .filter(p => p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q))
      .slice(0, 8)
      .map(p => ({ category: 'Projects', name: p.name, detail: `${p.code} · ${statusLabel[p.status] || p.status}`, href: '/projects' }))
  }, [searchQuery, projects])

  const criticalMaterials = useMemo(() => {
    return materials
      .filter(m => m.status === 'CRITICAL' || m.status === 'LOW' || m.priority === 'HIGH')
      .slice(0, 5)
  }, [materials])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting}, {userName}
          </h1>
          <p className="text-muted-foreground">{today} — Here&apos;s your project overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/surveys/new"><ClipboardList className="mr-1 h-4 w-4" />New Survey</Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/projects/new"><FolderKanban className="mr-1 h-4 w-4" />New Project</Link>
          </Button>
          <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Link href="/reports/generate"><ClipboardList className="mr-1 h-4 w-4" />Create DPR</Link>
          </Button>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Link href="/boq"><FileText className="mr-1 h-4 w-4" />Create BOQ</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/media/photos"><Camera className="mr-1 h-4 w-4" />Upload Photo</Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative" ref={searchRef}>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true) }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search projects, vendors, clients..."
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {isSearchOpen && searchQuery && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[400px] overflow-y-auto shadow-lg">
            <CardContent className="p-2">
              {searchResults.length > 0 ? (
                searchResults.map((r, i) => (
                  <Link key={i} href={r.href}
                    onClick={() => { setIsSearchOpen(false); setSearchQuery('') }}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.detail}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} color={kpi.color} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.label} asChild variant="outline" size="sm" className="h-9 text-xs font-medium">
                <Link href={action.href}>{action.icon}<span className="ml-1.5">{action.label}</span></Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Lead Conversions */}
      {leads.filter(l => l.status === 'WON').length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Lead Conversions</CardTitle>
              <p className="text-xs text-muted-foreground">Leads converted to clients by your team</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leads">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.filter(l => l.status === 'WON').slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{lead.name}</p>
                      <Badge className="text-[10px] bg-green-100 text-green-800">Converted</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.company && `${lead.company} · `}
                      {lead.assignedTo ? `Assigned to ${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                      {lead.client?.companyName && ` → Client: ${lead.client.companyName}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {lead.estimatedValue && <span>Value: {formatCurrency(lead.estimatedValue)}</span>}
                      {lead.convertedAt && <span>Converted: {new Date(lead.convertedAt).toLocaleDateString('en-IN')}</span>}
                      {lead.source && <span>Source: {lead.source}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link href={lead.client ? `/clients/${lead.client.id}` : `/leads/${lead.id}`}>
                      {lead.client ? 'View Client' : 'View Lead'} <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
              <p className="text-xs text-muted-foreground">Surveys waiting for your approval</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/surveys">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((survey: any) => (
                <div key={survey.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{survey.title}</p>
                      <Badge className={`text-[10px] ${STATUS_COLORS[survey.status] || 'bg-gray-100'}`}>
                        Level {survey.currentApprovalLevel || '?'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {survey.project || 'Unknown Project'}
                      {survey.engineer?.name && ` · By ${survey.engineer.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleApprovalAction(survey.id, 'APPROVE')}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700" onClick={() => handleApprovalAction(survey.id, 'REJECT')}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="h-8">
                      <Link href={`/surveys/${survey.id}`}><ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather + Material Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live Weather */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Weather — {weather?.city || 'Your Location'}</CardTitle>
                <p className="text-xs text-muted-foreground">Live from Open-Meteo</p>
              </div>
              <Badge variant="outline" className="text-[10px]"><Wind className="mr-1 h-3 w-3" />Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {weather ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  {(() => { const Icon = getWeatherIcon(Number(weather.icon)); return <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30"><Icon className="h-8 w-8 text-amber-600" /></div> })()}
                  <div>
                    <p className="text-3xl font-bold">{weather.temperature}°C</p>
                    <p className="text-sm text-muted-foreground">{weather.description}</p>
                    <p className="text-xs text-muted-foreground">Humidity: {weather.humidity}% · Wind: {weather.windSpeed} km/h</p>
                  </div>
                </div>
                {weather.daily.length > 1 && (
                  <div className="grid grid-cols-3 gap-3 border-t pt-4">
                    {weather.daily.slice(1, 4).map((day, i) => {
                      const DayIcon = getWeatherIcon(Number(day.icon))
                      const dayName = i === 0 ? 'Tomorrow' : WMO_DAYS[new Date(day.date).getDay()]
                      return (
                        <div key={day.date} className="text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{dayName}</p>
                          <DayIcon className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                          <p className="text-sm font-semibold">{day.max}°</p>
                          <p className="text-[10px] text-muted-foreground">{day.min}°</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-2 text-sm text-muted-foreground">Loading weather...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Material Alerts — Real Data */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Material Alerts</CardTitle>
              {criticalMaterials.length > 0 && <Badge variant="destructive" className="text-[10px]">{criticalMaterials.length} Alert{criticalMaterials.length > 1 ? 's' : ''}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {criticalMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No critical material alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalMaterials.map((mat) => (
                  <div key={mat.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={cn('h-2 w-2 shrink-0 rounded-full', mat.status === 'CRITICAL' || mat.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-500')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{mat.materialName}</p>
                        <Badge className={cn('text-[9px] px-1.5 py-0', materialPriorityStyles[mat.priority] || materialPriorityStyles.MEDIUM)}>
                          {mat.status || mat.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{mat.quantity} {mat.unit} — {formatCurrency(mat.estimatedCost)}</p>
                      {mat.supplierName && <p className="text-[10px] text-muted-foreground mt-0.5">Supplier: {mat.supplierName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Progress + Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading projects...</div>
            ) : projectCards.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No projects found.</div>
            ) : (
              <div className="space-y-4">
                {projectCards.map((p) => (
                  <div key={p.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client} · {p.city}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn('text-[9px] border', p.health === 'Good' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' : p.health === 'At Risk' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400')}>
                          {p.health}
                        </Badge>
                        <Badge className={cn('text-[9px] px-1.5 py-0', p.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400')}>
                          {statusLabel[p.status] || p.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{p.budgetPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', p.budgetPct >= 80 ? 'bg-emerald-500' : p.budgetPct >= 50 ? 'bg-blue-500' : 'bg-amber-500')}
                          style={{ width: `${Math.min(p.budgetPct, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Budget Used — {formatCurrency(p.actualCost)} of {formatCurrency(p.budget)}</span>
                        <span className={cn('font-semibold', p.budgetPct > 95 ? 'text-red-600' : p.budgetPct > 80 ? 'text-amber-600' : 'text-emerald-600')}>
                          {p.budgetPct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', p.budgetPct > 95 ? 'bg-red-500' : p.budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(p.budgetPct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.daysLeft} days left</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.manager}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectCards.slice(0, 6).map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, budget: Math.round(p.budget / 100000), spent: Math.round(p.actualCost / 100000) }))} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(value: unknown) => [`₹${value}L`, '']} />
                    <Legend verticalAlign="bottom" height={36} iconType="square" iconSize={10} />
                    <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" />
                    <Bar dataKey="spent" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {projectStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {projectStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No project data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Notification Center</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notifications"><Bell className="mr-1 h-3 w-3" />View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={notifTab} onValueChange={setNotifTab}>
            <TabsList className="mb-3">
              <TabsTrigger value="all" className="text-[11px] px-2.5 py-1">All</TabsTrigger>
              <TabsTrigger value="project" className="text-[11px] px-2.5 py-1">Project</TabsTrigger>
              <TabsTrigger value="procurement" className="text-[11px] px-2.5 py-1">Procurement</TabsTrigger>
              <TabsTrigger value="finance" className="text-[11px] px-2.5 py-1">Finance</TabsTrigger>
              <TabsTrigger value="safety" className="text-[11px] px-2.5 py-1">Safety</TabsTrigger>
            </TabsList>
            <TabsContent value={notifTab} className="mt-0">
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {loading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading notifications...</p>
                ) : filteredNotifs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No notifications in this category.</p>
                ) : (
                  filteredNotifs.map((notif) => {
                    const sevConfig = notifSeverityIcon[notif.severity] || notifSeverityIcon.info
                    const SevIcon = sevConfig.icon
                    return (
                      <div key={notif.id} className={cn('flex items-start gap-3 rounded-lg border p-3 border-l-2 transition-colors hover:bg-muted/50', notifSeverityBorder[notif.severity] || 'border-l-blue-500')}>
                        <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', sevConfig.bg)}>
                          <SevIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none mb-0.5">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
