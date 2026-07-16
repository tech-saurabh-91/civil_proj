"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import Link from "next/link"
import {
  AlertCircle, ArrowLeft, Camera, Loader2, Upload, X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface Photo {
  id: string; caption?: string; url: string; filename: string; createdAt?: string; surveyId?: string
}

export default function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [surveys, setSurveys] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterSurvey, setFilterSurvey] = useState("ALL")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/photos?projectId=${id}`)
      const json = await res.json()
      setPhotos(json.data || [])
    } catch {} finally { setLoading(false) }
  }, [id])

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const json = await res.json()
      setSurveys(json.data?.surveys || [])
    } catch {}
  }, [id])

  useEffect(() => { fetchPhotos(); fetchSurveys() }, [fetchPhotos, fetchSurveys])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (surveys.length === 0) {
      alert("No surveys found. Please create a survey first before uploading photos.")
      if (e.target) e.target.value = ""
      return
    }

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId: surveys[0].id,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            filename: file.name,
            fileData,
          }),
        })
      } catch {}
    }
    setUploading(false)
    fetchPhotos()
    if (e.target) e.target.value = ""
  }

  const filtered = filterSurvey === "ALL" ? photos : photos.filter(p => p.surveyId === filterSurvey)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading photos...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Photos"
        description={`${photos.length} photo(s) uploaded`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: "Photos" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
            </Button>
            {surveys.length > 0 && (
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Photos
              </Button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
          </div>
        }
      />

      {surveys.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter by survey:</span>
          <Select value={filterSurvey} onValueChange={setFilterSurvey}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Surveys</SelectItem>
              {surveys.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-6 w-6" />}
          title="No photos"
          description="Upload site photos to get started."
          action={{ label: "Upload Photos", onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <Card key={photo.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {photo.url?.startsWith("data:") ? (
                  <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{photo.caption || photo.filename}</p>
                {photo.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(photo.createdAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
