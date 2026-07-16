"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react"

import { cn, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  userInitials: string
  action: string
  entityType: string
  entityId: string
  description: string
  ipAddress: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

const actionColors: Record<string, string> = {
  CREATED: "bg-emerald-100 text-emerald-800",
  UPDATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-violet-100 text-violet-800",
  DELETED: "bg-red-100 text-red-800",
  ASSIGNED: "bg-teal-100 text-teal-800",
  REJECTED: "bg-red-100 text-red-800",
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATED: <span className="text-[10px]">+</span>,
  UPDATED: <span className="text-[10px]">~</span>,
  APPROVED: <span className="text-[10px]">✓</span>,
  DELETED: <span className="text-[10px]">x</span>,
  ASSIGNED: <span className="text-[10px]">→</span>,
  REJECTED: <span className="text-[10px]">✗</span>,
}

const entityTypeColors: Record<string, string> = {
  Project: "bg-blue-50 text-blue-700",
  Survey: "bg-emerald-50 text-emerald-700",
  Lead: "bg-amber-50 text-amber-700",
  Client: "bg-teal-50 text-teal-700",
  User: "bg-rose-50 text-rose-700",
  Document: "bg-violet-50 text-violet-700",
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("All Actions")
  const [entityFilter, setEntityFilter] = useState("All Entities")
  const [userFilter, setUserFilter] = useState("All Users")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const pageSize = 25

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch(`/api/audit?limit=200`)
        if (res.ok) {
          const data = await res.json()
          const mapped = (data.data || []).map((log: any) => ({
            id: log.id,
            timestamp: log.createdAt || log.timestamp,
            user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
            userInitials: log.user ? `${log.user.firstName?.[0] || ''}${log.user.lastName?.[0] || ''}` : 'SY',
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            description: log.description || '',
            ipAddress: log.ipAddress || '',
            oldValues: log.oldValues,
            newValues: log.newValues,
          }))
          setEntries(mapped)
        }
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    fetchAudit()
  }, [])

  const uniqueUsers = useMemo(() => [...new Set(entries.map(e => e.user))].sort(), [entries])
  const uniqueActions = useMemo(() => [...new Set(entries.map(e => e.action))].sort(), [entries])
  const uniqueEntityTypes = useMemo(() => [...new Set(entries.map(e => e.entityType))].sort(), [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery === "" ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAction =
        actionFilter === "All Actions" || entry.action === actionFilter
      const matchesEntity =
        entityFilter === "All Entities" || entry.entityType === entityFilter
      const matchesUser =
        userFilter === "All Users" || entry.user === userFilter
      return matchesSearch && matchesAction && matchesEntity && matchesUser
    })
  }, [entries, searchQuery, actionFilter, entityFilter, userFilter])

  const totalPages = Math.ceil(filteredEntries.length / pageSize)
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Complete log of all system activities and changes"
        breadcrumbs={[
          { label: "Dashboard", href: '/dashboard' },
          { label: "Audit Log" },
        ]}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Search audit log..."
              className="w-[250px]"
              onSearch={setSearchQuery}
            />
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Users">All Users</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Actions">All Actions</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Entities">All Entities</SelectItem>
                {uniqueEntityTypes.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredEntries.length} entries
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => {
                    const isExpanded = expandedRows.includes(entry.id)
                    const hasDetails = entry.oldValues || entry.newValues
                    return (
                      <>
                        <TableRow
                          key={entry.id}
                          className={cn(hasDetails && "cursor-pointer", isExpanded && "bg-muted/30")}
                          onClick={() => hasDetails && toggleRow(entry.id)}
                        >
                          <TableCell>
                            {hasDetails && (
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(entry.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                  {entry.userInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{entry.user}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] gap-1", actionColors[entry.action] || "bg-gray-100 text-gray-800")}>
                              {actionIcons[entry.action]}
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px]", entityTypeColors[entry.entityType] || "bg-gray-50 text-gray-700")}>
                              {entry.entityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{entry.entityId}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                            {entry.description}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {entry.ipAddress}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (entry.oldValues || entry.newValues) && (
                          <TableRow key={`${entry.id}-expanded`}>
                            <TableCell colSpan={8} className="bg-muted/20 p-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                {entry.oldValues && (
                                  <div>
                                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                      Old Values
                                    </h4>
                                    <pre className="rounded-lg bg-red-50 p-3 text-xs text-red-800 overflow-x-auto">
                                      {JSON.stringify(entry.oldValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {entry.newValues && (
                                  <div>
                                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                      New Values
                                    </h4>
                                    <pre className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 overflow-x-auto">
                                      {JSON.stringify(entry.newValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No audit entries found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entries.length === 0 ? "No audit logs yet. Updates to leads and other entities will appear here." : "Try adjusting your search or filters"}
                  </p>
                </div>
              )}

              <div className="p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredEntries.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
