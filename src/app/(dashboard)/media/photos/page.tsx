"use client"

import { useState, useEffect } from "react"
import {
  Camera, Upload, Search, Filter, Download, Trash2,
  Eye, MoreHorizontal, MapPin, Calendar, X, ChevronLeft,
  ChevronRight, Grid, List, CheckSquare, Square, Edit
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"

interface Photo {
  id: number
  name: string
  caption: string
  project: string
  survey: string
  date: string
  time: string
  size: string
  location: { lat: number; lng: number }
  hasLocation: boolean
}

export default function PhotosPage() {
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)
  const [projectFilter, setProjectFilter] = useState("All Projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: number; name: string; url: string; caption: string; project: string; survey: string; date: string; time: string; size: string; hasLocation: boolean; location: { lat: number; lng: number } }[]>([])

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await fetch("/api/media/photos")
        if (res.ok) {
          const data = await res.json()
          setPhotos(data.data ?? data.photos ?? (Array.isArray(data) ? data : []))
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchPhotos()
  }, [])

  const projects = ["All Projects", ...new Set(photos.map((p) => p.project))]

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const newPhotos = files.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      url: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      project: "All Projects",
      survey: "New Upload",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      hasLocation: false,
      location: { lat: 0, lng: 0 },
    }))
    setUploadedPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ""
  }

  const filteredPhotos = photos.filter((photo) => {
    const matchesProject = projectFilter === "All Projects" || photo.project === projectFilter
    const matchesSearch = photo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.caption.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesProject && matchesSearch
  })

  const toggleSelect = (id: number) => {
    setSelectedPhotos((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([])
    } else {
      setSelectedPhotos(filteredPhotos.map((p) => p.id))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Photo Management" description="Upload, organize, and manage site survey photos" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Media", href: "/media" }, { label: "Photos" }]} />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading photos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photo Management"
        description="Upload, organize, and manage site survey photos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Media", href: "/media" }, { label: "Photos" }]}
        actions={
          <Button onClick={() => document.getElementById("photo-upload-input")?.click()}>
            <Upload className="h-4 w-4 mr-2" />Upload Photos
          </Button>
        }
      />

      <input id="photo-upload-input" type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />

      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("photo-upload-input")?.click()}
          >
            <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium mt-4">Drag & drop photos here</p>
            <p className="text-sm text-muted-foreground mt-2">or click to browse. Supports JPG, PNG, HEIC up to 50MB</p>
            <Button className="mt-4" onClick={(e) => { e.stopPropagation(); document.getElementById("photo-upload-input")?.click() }}>
              <Upload className="h-4 w-4 mr-2" />Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search photos..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>{projects.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            {selectedPhotos.length === filteredPhotos.length ? "Deselect All" : "Select All"}
          </Button>
          {selectedPhotos.length > 0 && (
            <>
              <Badge>{selectedPhotos.length} selected</Badge>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Download</Button>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
            </>
          )}
        </div>
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Newly Uploaded</h3>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid group relative rounded-lg border overflow-hidden bg-muted cursor-pointer">
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={false} onCheckedChange={() => {}} />
                </div>
                <div className="aspect-square bg-slate-200 flex items-center justify-center">
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation() }}><Eye className="h-4 w-4" /></Button>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate">{photo.caption}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{photo.date}</span><span>{photo.size}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredPhotos.map((photo) => (
          <div key={photo.id} className="break-inside-avoid group relative rounded-lg border overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(photo)}>
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selectedPhotos.includes(photo.id)} onCheckedChange={() => toggleSelect(photo.id)} />
            </div>
            <div className="aspect-square bg-slate-200 flex items-center justify-center">
              <Camera className="h-12 w-12 text-slate-400" />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewPhoto(photo); }}><Eye className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><Download className="h-4 w-4" /></Button>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium truncate">{photo.caption}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {photo.hasLocation && <MapPin className="h-3 w-3" />}
                <span>{photo.date}</span><span>{photo.time}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{photo.project}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && photos.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No photos found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      <Modal open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)} title="Photo Preview" maxWidth="2xl">
        {previewPhoto && (
          <div className="space-y-4">
            <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
              <Camera className="h-24 w-24 text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea defaultValue={previewPhoto.caption} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Project</p><p className="font-medium">{previewPhoto.project}</p></div>
              <div><p className="text-muted-foreground">Survey</p><p className="font-medium">{previewPhoto.survey}</p></div>
              <div><p className="text-muted-foreground">Date & Time</p><p className="font-medium">{previewPhoto.date} at {previewPhoto.time}</p></div>
              <div><p className="text-muted-foreground">File Size</p><p className="font-medium">{previewPhoto.size}</p></div>
              {previewPhoto.hasLocation && (
                <div className="col-span-2"><p className="text-muted-foreground">GPS Location</p><p className="font-medium flex items-center gap-1"><MapPin className="h-4 w-4" />{previewPhoto.location.lat}, {previewPhoto.location.lng}</p></div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPreviewPhoto(null)}>Close</Button>
              <Button variant="outline"><Edit className="h-4 w-4 mr-2" />Save Caption</Button>
              <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
