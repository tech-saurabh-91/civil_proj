"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  Download,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import { showSuccess, showError } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  city: string
  state: string
  projectsCount: number
  totalRevenue: number
  status: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const pageSize = 10

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      if (res.ok) {
        const data = await res.json()
        setClients(data.data ?? data.clients ?? (Array.isArray(data) ? data : []))
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchClients() }, [])

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id))
        setDeleteDialogOpen(false)
        setClientToDelete(null)
        showSuccess("Client deleted successfully.")
      } else {
        showError("Failed to delete client.")
      }
    } catch { showError("Network error.") }
  }

  const cities = useMemo(() => [...new Set(clients.map((c) => c.city).filter(Boolean))].sort(), [clients])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        searchQuery === "" ||
        client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCity = cityFilter === "all" || client.city === cityFilter
      const matchesStatus = statusFilter === "all" || client.status === statusFilter
      return matchesSearch && matchesCity && matchesStatus
    })
  }, [clients, searchQuery, cityFilter, statusFilter])

  const totalPages = Math.ceil(filteredClients.length / pageSize)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0)
  const activeProjects = clients.reduce((sum, c) => sum + c.projectsCount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Client Management"
          description="Manage your construction clients, contractors, and government bodies"
          breadcrumbs={[{ label: "Dashboard", href: '/dashboard' }, { label: "Clients" }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading clients...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Management"
        description="Manage your construction clients, contractors, and government bodies"
        breadcrumbs={[
          { label: "Dashboard", href: '/dashboard' },
          { label: "Clients" },
        ]}
        actions={
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-6 w-6" />}
          label="Total Clients"
          value={clients.length}
          color="info"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Active Projects"
          value={activeProjects}
          color="success"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="default"
        />
        <StatCard
          icon={<Building2 className="h-6 w-6" />}
          label="All Active"
          value={clients.length}
          color="success"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Clients</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                placeholder="Search clients..."
                className="w-[250px]"
                onSearch={setSearchQuery}
              />
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-3 font-medium hover:text-primary transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {client.companyName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{client.companyName}</p>
                    </Link>
                  </TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{client.email}</TableCell>
                  <TableCell className="text-sm">{client.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{client.city || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="info">{client.projectsCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(client.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}?edit=true`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${client.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `tel:${client.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setClientToDelete(client); setDeleteDialogOpen(true) }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {clients.length === 0 ? "No clients yet. Add your first client." : "Try adjusting your search or filters"}
              </p>
            </div>
          )}

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClients.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Client
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{clientToDelete?.companyName}</strong>? This action cannot be undone.
            </DialogDescription>
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
