"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, FileText, Grid3X3, LayoutList, Loader2, Upload,
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

const DOC_TYPES = [
  { value: "DRAWING", label: "Drawing" },
  { value: "SPECIFICATION", label: "Specification" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REPORT", label: "Report" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "OTHER", label: "Other" },
]

interface Drawing {
  id: string; title: string; type: string; filename: string; fileUrl: string; fileSize?: number; createdAt?: string
}

export default function DrawingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filterType, setFilterType] = useState("ALL")
  const [selectedType, setSelectedType] = useState("DRAWING")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDrawings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/documents?projectId=${id}`)
      const json = await res.json()
      setDrawings(json.data || [])
    } catch {} finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchDrawings() }, [fetchDrawings])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            type: selectedType,
            filename: file.name,
            fileData,
            fileSize: file.size,
          }),
        })
      } catch {}
    }
    setUploading(false)
    fetchDrawings()
    if (e.target) e.target.value = ""
  }

  const filtered = filterType === "ALL" ? drawings : drawings.filter(d => d.type === filterType)

  const typeColor: Record<string, string> = {
    DRAWING: "bg-blue-100 text-blue-800",
    SPECIFICATION: "bg-purple-100 text-purple-800",
    CONTRACT: "bg-green-100 text-green-800",
    REPORT: "bg-amber-100 text-amber-800",
    CORRESPONDENCE: "bg-gray-100 text-gray-800",
    OTHER: "bg-slate-100 text-slate-800",
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drawings & Documents"
        description={`${drawings.length} document(s)`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: "Drawings" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
            </Button>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button variant={view === "grid" ? "default" : "ghost"} size="sm" onClick={() => setView("grid")}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}><LayoutList className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No documents"
          description="Upload drawings and documents to get started."
          action={{ label: "Upload File", onClick: () => fileInputRef.current?.click() }}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-[10px]", typeColor[doc.type])}>{doc.type}</Badge>
                  {doc.createdAt && <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Size</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr></thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{doc.title}</td>
                  <td className="p-3"><Badge variant="outline" className={cn("text-[10px]", typeColor[doc.type])}>{doc.type}</Badge></td>
                  <td className="p-3 text-muted-foreground">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}</td>
                  <td className="p-3 text-muted-foreground">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
