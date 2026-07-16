"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Upload,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Search,
  Filter,
  Calendar,
  Layers,
} from "lucide-react"

import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/ui/page-header"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DatePicker } from "@/components/ui/date-picker"

const folders = [
  {
    id: "root",
    name: "All Documents",
    icon: <HardDrive className="h-4 w-4" />,
    children: [
      { id: "drawings", name: "Drawings", icon: <Layers className="h-4 w-4" />, count: 0, children: [] },
      { id: "specifications", name: "Specifications", icon: <FileText className="h-4 w-4" />, count: 0, children: [] },
      { id: "contracts", name: "Contracts", icon: <FileText className="h-4 w-4" />, count: 0, children: [] },
      { id: "reports", name: "Reports", icon: <FileText className="h-4 w-4" />, count: 0, children: [] },
      { id: "invoices", name: "Invoices", icon: <FileSpreadsheet className="h-4 w-4" />, count: 0, children: [] },
      { id: "correspondence", name: "Correspondence", icon: <FileText className="h-4 w-4" />, count: 0, children: [] },
    ],
  },
]

interface Document {
  id: string
  name: string
  type: string
  category: string
  folder: string
  size: string
  uploadedBy: string
  date: string
  version: string
  project: string
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-5 w-5 text-red-500" />,
  Excel: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />,
  DWG: <File className="h-5 w-5 text-blue-500" />,
  Image: <Image className="h-5 w-5 text-violet-500" />,
}

const fileTypeColors: Record<string, string> = {
  PDF: "bg-red-50",
  Excel: "bg-emerald-50",
  DWG: "bg-blue-50",
  Image: "bg-violet-50",
}

const categoryFilters = ["All Categories", "Drawings", "Specifications", "Contracts", "Reports", "Invoices", "Correspondence"]

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [projectFilter, setProjectFilter] = useState("All Projects")
  const [selectedFolder, setSelectedFolder] = useState("root")
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["root"])
  const [currentPage, setCurrentPage] = useState(1)
  const [isDragOver, setIsDragOver] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch("/api/documents")
        if (res.ok) {
          const data = await res.json()
          setDocuments(data.data ?? data.documents ?? (Array.isArray(data) ? data : []))
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  const projectFilters = useMemo(() => ["All Projects", ...new Set(documents.map((d) => d.project))], [documents])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.project.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "All Categories" || doc.category === categoryFilter
      const matchesProject = projectFilter === "All Projects" || doc.project === projectFilter
      const matchesFolder = selectedFolder === "root" || doc.folder === selectedFolder
      return matchesSearch && matchesCategory && matchesProject && matchesFolder
    })
  }, [documents, searchQuery, categoryFilter, projectFilter, selectedFolder])

  const totalPages = Math.ceil(filteredDocuments.length / pageSize)
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId])
    setSelectedFolder(folderId)
  }

  const storageUsed = 847
  const storageTotal = 2000
  const storagePercent = (storageUsed / storageTotal) * 100

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Document Management" description="Organize, manage, and access all project documents" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Documents" }]} />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management"
        description="Organize, manage, and access all project documents"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Documents" }]}
        actions={
          <Button onClick={() => document.getElementById("doc-upload-input")?.click()}>
            <Upload className="mr-2 h-4 w-4" />Upload Document
          </Button>
        }
      />

      <input
        id="doc-upload-input"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={(e) => {
          if (!e.target.files) return
          const files = Array.from(e.target.files)
          const formatSize = (bytes: number) => {
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
            return (bytes / (1024 * 1024)).toFixed(1) + " MB"
          }
          const newDocs = files.map((file, i) => {
            const ext = file.name.split(".").pop()?.toUpperCase() || "PDF"
            return {
              id: `DOC-NEW-${Date.now() + i}`,
              name: file.name,
              type: ["PDF"].includes(ext) ? "PDF" : ["XLS", "XLSX"].includes(ext) ? "Excel" : ["DWG"].includes(ext) ? "DWG" : "PDF",
              category: "Drawings",
              folder: "drawings",
              size: formatSize(file.size),
              uploadedBy: "Current User",
              date: new Date().toISOString().split("T")[0],
              version: "1.0",
              project: "All Projects",
            }
          })
          setDocuments(prev => [...newDocs, ...prev])
          e.target.value = ""
        }}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Storage Used</span>
                <span className="text-muted-foreground">{storageUsed} GB of {storageTotal} GB ({Math.round(storagePercent)}%)</span>
              </div>
              <Progress value={storagePercent} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Folders</CardTitle></CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              {folders.map((folder) => (
                <FolderItem key={folder.id} folder={folder} selectedFolder={selectedFolder} expandedFolders={expandedFolders} onToggle={toggleFolder} level={0} />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div
            className={cn("rounded-lg border-2 border-dashed p-8 text-center transition-colors", isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50")}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false) }}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">Drag and drop files here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">Supports PDF, Excel, DWG, Images up to 50MB each</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput placeholder="Search documents..." className="w-[250px]" onSearch={setSearchQuery} />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>{categoryFilters.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="All Projects" /></SelectTrigger>
                  <SelectContent>{projectFilters.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", fileTypeColors[doc.type])}>
                            {fileTypeIcons[doc.type] || <File className="h-5 w-5 text-gray-500" />}
                          </div>
                          <div>
                            <Link href={`/documents/${doc.id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">{doc.name}</Link>
                            <p className="text-xs text-muted-foreground">{doc.project}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{doc.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.size}</TableCell>
                      <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.date)}</TableCell>
                      <TableCell className="text-sm font-mono">v{doc.version}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/documents/${doc.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                            <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDocuments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{documents.length === 0 ? "No documents yet. Upload your first document." : "Try adjusting your search or filters"}</p>
                </div>
              )}

              <div className="p-4">
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredDocuments.length} pageSize={pageSize} onPageChange={setCurrentPage} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FolderItem({
  folder, selectedFolder, expandedFolders, onToggle, level,
}: {
  folder: (typeof folders)[0] & { count?: number }
  selectedFolder: string
  expandedFolders: string[]
  onToggle: (id: string) => void
  level: number
}) {
  const isExpanded = expandedFolders.includes(folder.id)
  const isSelected = selectedFolder === folder.id
  const hasChildren = folder.children && folder.children.length > 0

  return (
    <div>
      <button
        onClick={() => onToggle(folder.id)}
        className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted", isSelected && "bg-muted font-medium", level > 0 && "ml-4")}
      >
        {hasChildren ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />) : <span className="w-3.5" />}
        {folder.icon}
        <span className="flex-1 text-left">{folder.name}</span>
        {folder.count !== undefined && (<span className="text-xs text-muted-foreground">{folder.count}</span>)}
      </button>
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderItem key={child.id} folder={child} selectedFolder={selectedFolder} expandedFolders={expandedFolders} onToggle={onToggle} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
