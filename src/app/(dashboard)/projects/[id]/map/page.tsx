"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import Link from "next/link"
import {
  AlertCircle, ArrowLeft, Loader2, MapPin, Navigation, Building2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"

interface ProjectData {
  id: string; name: string; code: string
  address?: string | null; city?: string | null; state?: string | null
  latitude?: number | null; longitude?: number | null
  surveys?: { id: string; title: string; gpsLatitude?: number | null; gpsLongitude?: number | null; scheduledDate?: string | null }[]
}

export default function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

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

  useEffect(() => {
    if (typeof window === "undefined" || !project) return
    const L = require("leaflet")

    if (mapContainerRef.current && !mapRef.current) {
      const projectLat = project.latitude
      const projectLng = project.longitude
      const hasProjectCoords = projectLat && projectLng

      const hasSurveyCoords = project.surveys?.some(s => s.gpsLatitude && s.gpsLongitude)
      const firstSurvey = project.surveys?.find(s => s.gpsLatitude && s.gpsLongitude)

      let center: [number, number] = [20.5937, 78.9629]
      let zoom = 5

      if (hasProjectCoords) {
        center = [projectLat!, projectLng!]
        zoom = 14
      } else if (hasSurveyCoords && firstSurvey) {
        center = [firstSurvey.gpsLatitude!, firstSurvey.gpsLongitude!]
        zoom = 14
      } else if (project.city) {
        zoom = 10
      }

      const map = L.map(mapContainerRef.current, { center, zoom, zoomControl: true })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map)
      mapRef.current = map

      if (hasProjectCoords) {
        const icon = L.divIcon({ html: '<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
        L.marker([projectLat!, projectLng!], { icon }).addTo(map).bindPopup(`<b>${project.name}</b><br/>Project Location`)
      }

      if (project.surveys) {
        project.surveys.forEach(s => {
          if (s.gpsLatitude && s.gpsLongitude) {
            L.marker([s.gpsLatitude, s.gpsLongitude]).addTo(map).bindPopup(`<b>${s.title}</b><br/>${s.scheduledDate || ""}`)
          }
        })
      }

      setTimeout(() => map.invalidateSize(), 100)
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [project])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
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

  const surveys = project.surveys || []
  const locatedSurveys = surveys.filter(s => s.gpsLatitude && s.gpsLongitude)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Location"
        description={`Map view for ${project.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${id}` },
          { label: "Map" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div ref={mapContainerRef} className="h-[500px] w-full" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Project Address</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{project.address}</p>
                </div>
              )}
              {project.city && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{project.city}{project.state ? `, ${project.state}` : ""}</p>
                </div>
              )}
              {project.latitude && project.longitude && (
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground font-mono">{project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}</p>
                </div>
              )}
              {!project.address && !project.city && (
                <p className="text-sm text-muted-foreground">No address information available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Survey Locations</CardTitle><CardDescription>{locatedSurveys.length} of {surveys.length} surveys with GPS</CardDescription></CardHeader>
            <CardContent>
              {locatedSurveys.length === 0 ? (
                <EmptyState icon={<MapPin className="h-6 w-6" />} title="No locations" description="No surveys with GPS coordinates found." />
              ) : (
                <div className="space-y-2">
                  {locatedSurveys.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 flex-shrink-0">
                        <Navigation className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {s.gpsLatitude?.toFixed(6)}, {s.gpsLongitude?.toFixed(6)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString("en-IN") : "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
