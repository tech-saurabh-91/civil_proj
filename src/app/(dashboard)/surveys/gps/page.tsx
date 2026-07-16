'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  MapPin, Clock, Users, RefreshCw, LocateFixed, Route, Shield, Timer,
  Battery, Gauge, Circle, AlertTriangle, Navigation, CalendarCheck,
  FileText, Eye, Phone, Camera, CheckCircle2, CircleDot, ArrowRight,
  ChevronRight, X, Filter, Bell, Briefcase, Signal, ClipboardList,
  UserCheck, LogIn, MapPinned,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { cn } from '@/lib/utils'

interface ActiveUser {
  userId: string
  userName: string
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  batteryLevel: number | null
  isMoving: boolean
  timestamp: string
  minutesAgo: number
  status: 'active' | 'idle' | 'offline'
  projectName: string
  projectId: string | null
}

interface RoutePoint {
  lat: number
  lng: number
  timestamp: string
  speed: number | null
  accuracy: number | null
}

interface Geofence {
  id: string
  name: string
  centerLat: number
  centerLng: number
  radius: number
  projectId: string
  engineerId: string | null
}

interface GeofenceSummary {
  userId: string
  userName: string
  surveyId: string
  surveyName: string
  firstSeen: string
  lastSeen: string
  everInside: boolean
  currentInside: boolean
  entries: number
  exits: number
  durationMinutes: number
}

interface EngineerData {
  userId: string
  userName: string
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  batteryLevel: number | null
  isMoving: boolean
  timestamp: string
  minutesAgo: number
  status: 'active' | 'idle' | 'offline'
  projectName: string
  projectId: string | null
  fieldStatus: 'On Site' | 'Travelling' | 'Outside Geofence' | 'Offline'
  lastCheckin: string
  phone: string
  role: string
}

const TIMELINE_STEPS = [
  'Assigned', 'Started Travel', 'Reached Site', 'Survey Started',
  'Survey Completed', 'Left Site', 'Returned',
]

export default function GpsTrackingPage() {
  const { data: session } = useSession()
  const sessionUser = session?.user as any
  const currentUserId = sessionUser?.id || ''

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [routes, setRoutes] = useState<Record<string, RoutePoint[]>>({})
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [geofenceSummary, setGeofenceSummary] = useState<GeofenceSummary[]>([])
  const [totalLocations, setTotalLocations] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [lastSent, setLastSent] = useState('')
  const [error, setError] = useState('')
  const [watchId, setWatchId] = useState<number | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showGeofences, setShowGeofences] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState<string | null>(null)
  const [filterProject, setFilterProject] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [allEngineers, setAllEngineers] = useState<any[]>([])
  const [siteVisits, setSiteVisits] = useState<any[]>([])

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any>({})
  const routeLayersRef = useRef<any>({})
  const geofenceLayersRef = useRef<any>({})
  const LRef = useRef<any>(null)

  const fetchEngineers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=ENGINEER')
      const data = await res.json()
      const engineers = data.data ?? data.users ?? []
      setAllEngineers(engineers)
    } catch {}
  }, [])

  const fetchSiteVisits = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/site-visits?date=${today}`)
      const data = await res.json()
      setSiteVisits(data.data ?? [])
    } catch {}
  }, [])

  const getDisplayUsers = useCallback((): EngineerData[] => {
    const base: EngineerData[] = activeUsers.map((u) => {
      const engineer = allEngineers.find((e: any) => e.id === u.userId)
      const fieldStatus =
        u.status === 'offline'
          ? ('Offline' as const)
          : geofenceSummary.find((g) => g.userId === u.userId && g.currentInside)
            ? ('On Site' as const)
            : u.isMoving
              ? ('Travelling' as const)
              : ('Outside Geofence' as const)
      return {
        userId: u.userId,
        userName: u.userName,
        latitude: u.latitude,
        longitude: u.longitude,
        accuracy: u.accuracy,
        speed: u.speed,
        batteryLevel: u.batteryLevel,
        isMoving: u.isMoving,
        timestamp: u.timestamp,
        minutesAgo: u.minutesAgo,
        status: u.status,
        projectName: u.projectName,
        projectId: u.projectId,
        fieldStatus,
        lastCheckin: engineer?.lastLoginAt
          ? new Date(engineer.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : `${u.minutesAgo}m ago`,
        phone: engineer?.phone || '',
        role: engineer?.role || 'ENGINEER',
      }
    })

    if (base.length === 0) {
      return allEngineers
        .filter((e: any) => e.role === 'ENGINEER' || e.role === 'SURVEYOR')
        .map((e: any) => ({
          userId: e.id,
          userName: `${e.firstName} ${e.lastName}`,
          latitude: 20.5937,
          longitude: 78.9629,
          accuracy: null,
          speed: null,
          batteryLevel: null,
          isMoving: false,
          timestamp: e.lastLoginAt || new Date().toISOString(),
          minutesAgo: e.lastLoginAt
            ? Math.round((Date.now() - new Date(e.lastLoginAt).getTime()) / 60000)
            : 999,
          status: 'offline' as const,
          projectName: 'Unassigned',
          projectId: null,
          fieldStatus: 'Offline' as const,
          lastCheckin: e.lastLoginAt
            ? new Date(e.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : 'Never',
          phone: e.phone || '',
          role: e.role,
        }))
    }

    let filtered = base
    if (filterProject !== 'all') {
      filtered = filtered.filter((e) => e.projectId === filterProject)
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((e) => e.fieldStatus === filterStatus)
    }
    return filtered
  }, [activeUsers, geofenceSummary, allEngineers, filterProject, filterStatus])

  const displayUsers = getDisplayUsers()

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/gps?hours=24&route=true')
      const data = await res.json()
      setActiveUsers(data.activeUsers || [])
      setRoutes(data.routes || {})
      setGeofences(data.geofences || [])
      setGeofenceSummary(data.geofenceSummary || [])
      setTotalLocations(data.total || 0)
      updateMap(data.activeUsers || [], data.routes || {}, data.geofences || [])
    } catch {}
  }, [])

  const updateMap = (
    users: ActiveUser[],
    userRoutes: Record<string, RoutePoint[]>,
    fenceList: Geofence[]
  ) => {
    if (!mapRef.current || !LRef.current) return
    const L = LRef.current

    Object.values(markersRef.current).forEach((m: any) => mapRef.current.removeLayer(m))
    markersRef.current = {}
    Object.values(routeLayersRef.current).forEach((l: any) => mapRef.current.removeLayer(l))
    routeLayersRef.current = {}
    Object.values(geofenceLayersRef.current).forEach((l: any) => mapRef.current.removeLayer(l))
    geofenceLayersRef.current = {}

    if (showGeofences) {
      for (const fence of fenceList) {
        const circle = L.circle([fence.centerLat, fence.centerLng], {
          radius: fence.radius,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '8, 6',
        })
          .addTo(mapRef.current)
          .bindPopup(`<b>${fence.name}</b><br/>Geofence: ${fence.radius}m radius`)
        geofenceLayersRef.current[fence.id] = circle
      }
    }

    const statusColor: Record<string, string> = {
      active: '#22c55e',
      idle: '#eab308',
      offline: '#94a3b8',
    }
    for (const u of users) {
      const color = statusColor[u.status] || '#94a3b8'
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;position:relative">
          <span style="color:white;font-size:12px;font-weight:bold">${u.userName.split(' ').map((n: string) => n[0]).join('')}</span>
          ${u.isMoving ? '<span style="position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid white"></span>' : ''}
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      markersRef.current[u.userId] = L.marker([u.latitude, u.longitude], { icon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="min-width:160px">
            <b>${u.userName}</b><br/>
            <span style="color:#666">${u.projectName}</span><br/>
            <span style="color:#888;font-size:12px">${u.minutesAgo}m ago</span>
            ${u.speed ? `<br/><span style="color:#888;font-size:12px">Speed: ${u.speed.toFixed(1)} m/s</span>` : ''}
          </div>`
        )
    }

    if (showRoutes) {
      for (const [uid, pts] of Object.entries(userRoutes)) {
        if (pts.length < 2) continue
        const latlngs = pts.map((p) => [p.lat, p.lng] as [number, number])
        const polyline = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '6, 4',
        }).addTo(mapRef.current)
        routeLayersRef.current[uid] = polyline
      }
    }

    if (users.length > 0 && !selectedUser) {
      mapRef.current.setView([users[0].latitude, users[0].longitude], 13)
    }
  }

  useEffect(() => {
    fetchEngineers()
    fetchSiteVisits()
    fetchData()
    const interval = setInterval(fetchData, 12000)
    const engineerInterval = setInterval(fetchEngineers, 30000)
    return () => { clearInterval(interval); clearInterval(engineerInterval) }
  }, [fetchData, fetchEngineers, fetchSiteVisits])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const L = require('leaflet')
    LRef.current = L
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 12,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }
  }, [])

  useEffect(() => {
    updateMap(activeUsers, routes, geofences)
  }, [showRoutes, showGeofences])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      return
    }
    setError('')
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords
        let battery = null
        try {
          const b = await (navigator as any).getBattery?.()
          if (b) battery = Math.round(b.level * 100)
        } catch {}
        try {
          await fetch('/api/gps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, latitude, longitude, accuracy, speed, batteryLevel: battery }),
          })
          setLastSent(new Date().toLocaleTimeString())
          fetchData()
        } catch {}
      },
      (err) => setError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 }
    )
    setWatchId(id)
    setIsTracking(true)
  }

  const stopTracking = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    setWatchId(null)
    setIsTracking(false)
  }

  useEffect(() => {
    if (currentUserId && !isTracking) startTracking()
  }, [currentUserId])

  const focusUser = (user: EngineerData) => {
    setSelectedUser(user.userId)
    if (mapRef.current) {
      mapRef.current.setView([user.latitude, user.longitude], 15)
      markersRef.current[user.userId]?.openPopup()
    }
  }

  const uniqueProjects = [...new Set(displayUsers.map((e) => ({ id: e.projectId, name: e.projectName })).filter((v) => v.id))].filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i
  )
  const uniqueStatuses = ['On Site', 'Travelling', 'Outside Geofence', 'Offline']

  const activeCount = displayUsers.filter((u) => u.fieldStatus !== 'Offline').length
  const onSiteCount = displayUsers.filter((u) => u.fieldStatus === 'On Site').length
  const outsideCount = displayUsers.filter((u) => u.fieldStatus === 'Outside Geofence').length
  const offlineCount = displayUsers.filter((u) => u.fieldStatus === 'Offline').length
  const totalSiteVisits = siteVisits.length
  const avgSiteTime = siteVisits.length > 0
    ? `${Math.round(siteVisits.reduce((s: number, v: any) => s + (v.durationMinutes || 0), 0) / siteVisits.length)}m`
    : '0m'
  const gpsViolations = displayUsers.filter((u) => u.accuracy && u.accuracy > 50).length

  const selectedEngineer = displayUsers.find((u) => u.userId === showProfile)

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPS Tracking"
        description="Real-time field team location tracking with geofencing"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'GPS Tracking' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />Filters
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isTracking && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <LocateFixed className="h-4 w-4 animate-pulse" />
          <span className="font-medium">Auto-tracking active</span>
          {lastSent && <span className="text-muted-foreground">— Last ping: {lastSent}</span>}
        </div>
      )}

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">All Projects</option>
                {uniqueProjects.map((p) => (
                  <option key={p.id} value={p.id!}>{p.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(filterProject !== 'all' || filterStatus !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterProject('all'); setFilterStatus('all') }}>
                  <X className="mr-1 h-3 w-3" />Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Users className="h-6 w-6" />} label="Engineers Active" value={activeCount} color="success" />
        <StatCard icon={<MapPin className="h-6 w-6" />} label="On Site" value={onSiteCount} color="info" />
        <StatCard icon={<AlertTriangle className="h-6 w-6" />} label="Outside Geofence" value={outsideCount} color="danger" />
        <StatCard icon={<ClipboardList className="h-6 w-6" />} label="Site Visits Today" value={totalSiteVisits} color="info" />
        <StatCard icon={<Timer className="h-6 w-6" />} label="Avg Site Time" value={avgSiteTime} color="default" />
        <StatCard icon={<Shield className="h-6 w-6" />} label="GPS Violations" value={gpsViolations} color="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />Live Map
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant={showRoutes ? 'default' : 'outline'} size="sm" onClick={() => setShowRoutes(!showRoutes)}>
                    <Route className="h-4 w-4 mr-1" />Routes
                  </Button>
                  <Button variant={showGeofences ? 'default' : 'outline'} size="sm" onClick={() => setShowGeofences(!showGeofences)}>
                    <Circle className="h-4 w-4 mr-1" />Geofences
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={mapContainerRef}
                className="h-[400px] sm:h-[520px] w-full rounded-lg border border-border z-0"
                style={{ background: '#e5e7eb' }}
              />
            </CardContent>
          </Card>

          {siteVisits.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />Today&apos;s Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Engineer</th>
                        <th className="pb-2 font-medium">Project</th>
                        <th className="pb-2 font-medium">Check-in</th>
                        <th className="pb-2 font-medium">Check-out</th>
                        <th className="pb-2 font-medium">Duration</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteVisits.slice(0, 10).map((visit: any) => (
                        <tr key={visit.id} className="border-b last:border-0">
                          <td className="py-2.5 font-medium">
                            {visit.user?.firstName} {visit.user?.lastName}
                          </td>
                          <td className="py-2.5">{visit.project?.name || '—'}</td>
                          <td className="py-2.5">
                            {new Date(visit.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5">
                            {visit.checkOutAt
                              ? new Date(visit.checkOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="py-2.5">
                            {visit.durationMinutes != null ? `${visit.durationMinutes}m` : '—'}
                          </td>
                          <td className="py-2.5">
                            <Badge variant={visit.status === 'CHECKED_OUT' ? 'secondary' : 'success'}>
                              {visit.status === 'CHECKED_OUT' ? 'Checked Out' : 'On Site'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {geofenceSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />Geofence Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {geofenceSummary.map((g, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{g.userName}</p>
                        <p className="text-xs text-muted-foreground">{g.surveyName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={g.currentInside ? 'success' : 'secondary'}>
                          {g.currentInside ? 'On-Site' : 'Left Site'}
                        </Badge>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{g.durationMinutes} min total</p>
                          <p>{g.entries} entries</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Field Team</span>
                <Badge variant="secondary" className="text-xs">
                  {displayUsers.length} engineers
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No engineers found</p>
                  <p className="text-xs text-muted-foreground mt-1">Add engineers to start tracking</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {displayUsers.map((user) => {
                    const fieldStatusColor =
                      user.fieldStatus === 'On Site' ? 'bg-emerald-500'
                        : user.fieldStatus === 'Travelling' ? 'bg-orange-500'
                          : user.fieldStatus === 'Outside Geofence' ? 'bg-red-500'
                            : 'bg-gray-400'
                    return (
                      <div
                        key={user.userId}
                        className={cn(
                          'rounded-lg border p-3 transition-colors cursor-pointer',
                          selectedUser === user.userId
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-border hover:bg-accent/50'
                        )}
                        onClick={() => focusUser(user)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                              {user.userName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background', fieldStatusColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{user.userName}</p>
                              <Badge
                                variant={
                                  user.fieldStatus === 'On Site' ? 'success'
                                    : user.fieldStatus === 'Travelling' ? 'warning'
                                      : user.fieldStatus === 'Outside Geofence' ? 'destructive'
                                        : 'secondary'
                                }
                                className="text-[9px] px-1.5 shrink-0"
                              >
                                {user.fieldStatus}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Briefcase className="h-3 w-3 shrink-0" />{user.projectName}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <LogIn className="h-3 w-3" />{user.lastCheckin}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Battery className="h-3 w-3" />
                                {user.batteryLevel != null ? `${user.batteryLevel}%` : '—'}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Signal className="h-3 w-3" />
                                {user.accuracy ? `${user.accuracy}m` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-xs h-7"
                          onClick={(e) => { e.stopPropagation(); setShowProfile(user.userId) }}
                        >
                          View Profile <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Circle className="h-4 w-4" />Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" /> On Site
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" /> Travelling
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" /> Outside Geofence
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" /> Offline
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-4" style={{ borderTop: '2px dashed #3b82f6' }} />
                Travel route
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-500/10" />
                Geofence (500m)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedEngineer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowProfile(null)}>
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {selectedEngineer.userName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedEngineer.userName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedEngineer.projectName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowProfile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedEngineer.fieldStatus === 'On Site' ? 'success' : 'secondary'} className="mt-1">
                    {selectedEngineer.fieldStatus}
                  </Badge>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="text-sm font-medium mt-1">{selectedEngineer.projectName}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Last Seen</p>
                  <p className="text-sm font-medium mt-1">{selectedEngineer.lastCheckin}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">GPS Accuracy</p>
                  <p className="text-sm font-medium mt-1">{selectedEngineer.accuracy ? `${selectedEngineer.accuracy}m` : 'N/A'}</p>
                </div>
                {selectedEngineer.phone && (
                  <div className="rounded-lg border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{selectedEngineer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
