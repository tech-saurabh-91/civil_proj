"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { showSuccess, showError } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClientDetail {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  city: string
  state: string
  country: string
  address: string
  zipCode: string
  gstNumber: string
  panNumber: string
  website: string
  notes: string
  createdAt: string
  projects: { id: string; name: string; code: string; status: string }[]
  leads: { id: string; name: string; status: string; createdAt: string }[]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get("edit") === "true"

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState("")

  const [editData, setEditData] = useState({
    companyName: "", contactPerson: "", email: "", phone: "",
    address: "", city: "", state: "", zipCode: "", country: "",
    gstNumber: "", panNumber: "", website: "", notes: "",
  })

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data.data)
      }
    } catch {} finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchClient() }, [fetchClient])

  useEffect(() => {
    if (client) {
      setEditData({
        companyName: client.companyName || "",
        contactPerson: client.contactPerson || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        country: client.country || "India",
        gstNumber: client.gstNumber || "",
        panNumber: client.panNumber || "",
        website: client.website || "",
        notes: client.notes || "",
      })
    }
  }, [client])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        await fetchClient()
        setEditMode(false)
        showSuccess("Client updated successfully.")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save")
        showError(data.error || "Failed to save client.")
      }
    } catch { setError("Network error"); showError("Network error.") } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (res.ok) {
        showSuccess("Client deleted successfully.")
        router.push("/clients")
      } else {
        showError("Failed to delete client.")
      }
    } catch { showError("Network error.") }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Clients", href: "/clients" }, { label: "Loading..." }]} />
        <Card><CardContent className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></CardContent></Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Not Found" description="" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Clients", href: "/clients" }, { label: "Not Found" }]} />
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><p className="text-muted-foreground">Client not found.</p><Button asChild className="mt-4"><Link href="/clients">Back to Clients</Link></Button></CardContent></Card>
      </div>
    )
  }

  const statusVariantMap: Record<string, "success" | "info" | "warning" | "destructive" | "secondary"> = {
    "In Progress": "success", Planning: "info", "On Hold": "warning", Completed: "secondary", Cancelled: "destructive", ACTIVE: "success", INACTIVE: "secondary",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editMode ? "Edit Client" : client.companyName}
        description={`Client ID: ${client.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: editMode ? "Edit" : client.companyName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
            {!editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(true)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                <Button onClick={() => window.location.href = `mailto:${client.email}`}><Mail className="mr-2 h-4 w-4" />Contact</Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}><AlertCircle className="mr-2 h-4 w-4" />Delete</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}><X className="mr-2 h-4 w-4" />Cancel</Button>
                <Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
              </>
            )}
          </div>
        }
      />

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {client.companyName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{client.companyName}</h2>
                  <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                </div>
              </div>
              <Badge variant="success" className="text-sm">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {editMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Company Name *</Label><Input value={editData.companyName} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Contact Person *</Label><Input value={editData.contactPerson} onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={editData.state} onChange={(e) => setEditData({ ...editData, state: e.target.value })} /></div>
                <div className="space-y-2"><Label>GST Number</Label><Input value={editData.gstNumber} onChange={(e) => setEditData({ ...editData, gstNumber: e.target.value })} /></div>
                <div className="space-y-2"><Label>PAN Number</Label><Input value={editData.panNumber} onChange={(e) => setEditData({ ...editData, panNumber: e.target.value })} /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} /></div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Email</p><a href={`mailto:${client.email}`} className="text-sm font-medium text-primary hover:underline">{client.email}</a></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Phone</p><a href={`tel:${client.phone}`} className="text-sm font-medium text-primary hover:underline">{client.phone}</a></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm font-medium">{client.city}{client.state ? `, ${client.state}` : ''}</p></div>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">Website</p><a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{client.website}</a></div>
                    </div>
                  )}
                </div>
                {client.address && <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground mb-1">Address</p><p className="text-sm">{client.address}</p></div>}
                <div className="grid gap-4 sm:grid-cols-2">
                  {client.gstNumber && <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">GST Number</p><p className="text-sm font-mono font-medium mt-1">{client.gstNumber}</p></div>}
                  {client.panNumber && <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">PAN Number</p><p className="text-sm font-mono font-medium mt-1">{client.panNumber}</p></div>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Client Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Projects</span><span className="text-lg font-bold">{client.projects.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Leads</span><span className="text-lg font-bold">{client.leads.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Client Since</span><span className="text-sm font-medium">{formatDate(client.createdAt)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => window.location.href = `mailto:${client.email}`}>
                <Mail className="mr-2 h-4 w-4" />Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => window.location.href = `tel:${client.phone}`}>
                <Phone className="mr-2 h-4 w-4" />Call
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                <Link href="/projects/new"><FolderOpen className="mr-2 h-4 w-4" />New Project</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {client.projects.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Projects ({client.projects.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="font-mono text-sm">{project.code}</TableCell>
                    <TableCell className="text-center"><Badge variant={statusVariantMap[project.status] || "secondary"}>{project.status}</Badge></TableCell>
                    <TableCell className="text-center"><Button variant="ghost" size="sm" asChild><Link href={`/projects/${project.id}`}>View</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Client</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{client.companyName}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
