'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, User, Users, Cloud, FileText, CheckCircle2, Clock,
  Camera, Mic, MapPin, PlayCircle, Send, Trash2, Loader2, AlertTriangle,
  ChevronRight, Navigation, Upload, X, Plus, Printer,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SurveyDetail {
  id: string
  title: string
  description: string | null
  project: { id: string; name: string; code: string | null }
  type: string
  status: string
  scheduledDate: string | null
  completedDate: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  weatherCondition: string | null
  siteCondition: string | null
  accessDetails: string | null
  notes: string | null
  createdAt: string
  currentApprovalLevel: number
  assignedApproverId: string | null
  engineer: { id: string; name: string; email: string; initials: string } | null
  assignedApprover: { id: string; firstName: string; lastName: string; role: string } | null
  checklistItems: { id: string; category: string; item: string; isCompleted: boolean; notes: string | null }[]
  photos: { id: string; url: string; filename: string; caption: string | null }[]
  voiceNotes: { id: string; filename: string; url: string; duration: number | null }[]
  siteVisits: any[]
  checklistCompleted: number
  progress: number
  _count: { checklistItems: number; photos: number; voiceNotes: number; videos: number }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700',
  MANAGER_APPROVED: 'bg-teal-100 text-teal-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', MANAGER_APPROVED: 'Manager Approved',
  APPROVED: 'Approved', REJECTED: 'Rejected', COMPLETED: 'Completed',
}

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as string | undefined
  const userId = (session?.user as any)?.id as string | undefined
  const canApprove = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN'

  const [survey, setSurvey] = useState<SurveyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('checklist')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [newItemCategory, setNewItemCategory] = useState('General')
  const [newItemText, setNewItemText] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [approvalLevels, setApprovalLevels] = useState<{ level: number; name: string; requiredRole: string; allowForward: boolean; allowEscalate: boolean; allowReverse: boolean }[]>([])
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false)
  const [forwardUsers, setForwardUsers] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([])
  const [forwardUserId, setForwardUserId] = useState('')
  const [forwardNotes, setForwardNotes] = useState('')

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true)
      const [surveyRes, levelsRes, usersRes] = await Promise.all([
        fetch(`/api/surveys/${id}`),
        fetch('/api/approval-levels?entityType=Survey'),
        fetch('/api/users?limit=100'),
      ])
      const surveyJson = await surveyRes.json()
      const levelsJson = await levelsRes.json()
      const usersJson = await usersRes.json()
      if (surveyJson.success) setSurvey(surveyJson.data)
      else toast.error('Survey not found')
      if (levelsJson.success) setApprovalLevels(levelsJson.data)
      if (usersJson.users) setForwardUsers(usersJson.users)
    } catch {
      toast.error('Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSurvey()
  }, [fetchSurvey])

  const handleStatusChange = async (newStatus: string) => {
    if (!survey) return
    try {
      setActionLoading(true)
      const res = await fetch('/api/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: survey.id, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setSurvey((prev) => prev ? { ...prev, status: newStatus } : prev)
        toast.success(`Survey ${STATUS_LABELS[newStatus]?.toLowerCase() || newStatus.toLowerCase()}`)
      } else {
        toast.error(json.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update survey')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprovalAction = async (action: string, toUserId?: string, notes?: string) => {
    if (!survey) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/surveys/${survey.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, toUserId, notes }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        setForwardDialogOpen(false)
        setForwardUserId('')
        setForwardNotes('')
        fetchSurvey()
      } else {
        toast.error(json.error || 'Action failed')
      }
    } catch {
      toast.error('Approval action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/surveys/${id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      })
      const json = await res.json()
      if (json.success) {
        setSurvey((prev) => {
          if (!prev) return prev
          const items = prev.checklistItems.map((item) =>
            item.id === itemId ? { ...item, isCompleted: completed } : item
          )
          const completedCount = items.filter((i) => i.isCompleted).length
          return {
            ...prev,
            checklistItems: items,
            checklistCompleted: completedCount,
            progress: items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0,
          }
        })
      }
    } catch {}
  }

  const handlePhotoUpload = async () => {
    if (!photoFile || !survey) return
    try {
      setPhotoUploading(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const res = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyId: survey.id,
            projectId: survey.project.id,
            filename: photoFile.name,
            fileData: base64,
            caption: photoFile.name,
          }),
        })
        const json = await res.json()
        if (json.success) {
          setSurvey((prev) => prev ? {
            ...prev,
            photos: [json.data, ...prev.photos],
            _count: { ...prev._count, photos: prev._count.photos + 1 },
          } : prev)
          setPhotoFile(null)
          toast.success('Photo uploaded')
        } else {
          toast.error(json.error || 'Upload failed')
        }
      }
      reader.readAsDataURL(photoFile)
    } catch {
      toast.error('Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  const addChecklistItem = async () => {
    if (!newItemText.trim() || !survey) return
    try {
      setAddingItem(true)
      const res = await fetch(`/api/surveys/${id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newItemCategory, item: newItemText.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSurvey((prev) => {
          if (!prev) return prev
          const items = [...prev.checklistItems, json.data]
          return {
            ...prev,
            checklistItems: items,
            _count: { ...prev._count, checklistItems: items.length },
          }
        })
        setNewItemText('')
        toast.success('Item added')
      }
    } catch {
      toast.error('Failed to add item')
    } finally {
      setAddingItem(false)
    }
  }

  const deleteChecklistItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/surveys/${id}/checklist/${itemId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setSurvey((prev) => {
          if (!prev) return prev
          const items = prev.checklistItems.filter((i) => i.id !== itemId)
          const completedCount = items.filter((i) => i.isCompleted).length
          return {
            ...prev,
            checklistItems: items,
            checklistCompleted: completedCount,
            progress: items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0,
            _count: { ...prev._count, checklistItems: items.length },
          }
        })
        toast.success('Item removed')
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Survey Details"
          description="Loading..."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Surveys', href: '/surveys' }, { label: 'Details' }]}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Survey Not Found"
          description="The survey you're looking for doesn't exist."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Surveys', href: '/surveys' }, { label: 'Not Found' }]}
        />
      </div>
    )
  }

  const isLocked = survey.status === 'APPROVED' || survey.status === 'REJECTED' || survey.status === 'COMPLETED'
  const isAssignedEngineer = userId && survey.engineer?.id === userId
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isPendingApproval = survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED'
  const currentLevelConfig = approvalLevels.find((l) => l.level === survey.currentApprovalLevel)
  const canApproveCurrentLevel = currentLevelConfig
    ? (currentLevelConfig.requiredRole === userRole || userRole === 'SUPER_ADMIN') && !isAssignedEngineer
    : false

  const groupedChecklist = survey.checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof survey.checklistItems>)

  return (
    <div className="space-y-6">
      <PageHeader
        title={survey.title}
        description={survey.project?.name || ''}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Surveys', href: '/surveys' },
          { label: survey.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/surveys')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>

            {isLocked && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Survey Finalized
              </Badge>
            )}

            {!isLocked && (survey.status === 'DRAFT' || survey.status === 'ASSIGNED') && (isAssignedEngineer || canApprove) && (
              <Button size="sm" disabled={actionLoading} onClick={() => handleStatusChange('IN_PROGRESS')}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1.5" />}
                Start Survey
              </Button>
            )}
            {!isLocked && survey.status === 'IN_PROGRESS' && (isAssignedEngineer || canApprove) && (
              <Button size="sm" disabled={actionLoading} onClick={() => handleStatusChange('SUBMITTED')}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                Submit for Review
              </Button>
            )}

            {isPendingApproval && survey.currentApprovalLevel > 0 && (
              <>
                {canApproveCurrentLevel && (
                  <Button size="sm" disabled={actionLoading} onClick={() => handleApprovalAction('APPROVE')} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                )}
                {canApproveCurrentLevel && (
                  <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleApprovalAction('REJECT')}>
                    <AlertTriangle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                )}
                {canApproveCurrentLevel && currentLevelConfig?.allowForward && (
                  <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => setForwardDialogOpen(true)}>
                    <Users className="h-4 w-4 mr-1.5" /> Forward
                  </Button>
                )}
                {canApproveCurrentLevel && currentLevelConfig?.allowEscalate && (
                  <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleApprovalAction('ESCALATE')}>
                    <Navigation className="h-4 w-4 mr-1.5" /> Escalate
                  </Button>
                )}
                {canApproveCurrentLevel && currentLevelConfig?.allowReverse && (
                  <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleApprovalAction('REVERSE')}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Reverse
                  </Button>
                )}
                {!canApproveCurrentLevel && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Level {survey.currentApprovalLevel} Pending
                  </Badge>
                )}
              </>
            )}
            {isLocked && (
              <>
                <Button size="sm" variant="outline" onClick={() => router.push(`/surveys/${id}/report`)}>
                  <FileText className="h-4 w-4 mr-1.5" /> View Report
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge className={cn('text-xs', STATUS_COLORS[survey.status])}>
              {STATUS_LABELS[survey.status] || survey.status}
            </Badge>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" /> {survey.type}
            </span>
            {survey.scheduledDate && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" /> {survey.scheduledDate}
              </span>
            )}
            {survey.engineer && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-4 w-4" /> {survey.engineer.name}
              </span>
            )}
            {survey.weatherCondition && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cloud className="h-4 w-4" /> {survey.weatherCondition}
              </span>
            )}
            {survey.gpsLatitude && survey.gpsLongitude && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Navigation className="h-4 w-4" /> GPS Logged
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{survey.checklistCompleted}/{survey._count.checklistItems} items ({survey.progress}%)</span>
            </div>
            <Progress value={survey.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Approval Workflow Progress */}
      {(survey.status === 'SUBMITTED' || survey.status === 'MANAGER_APPROVED' || survey.status === 'APPROVED') && survey.currentApprovalLevel > 0 && approvalLevels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Approval Workflow — Level {survey.currentApprovalLevel} of {approvalLevels.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-1">
              {approvalLevels.map((level, idx) => (
                <div key={level.level} className="flex items-center flex-1">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                    level.level < survey.currentApprovalLevel && 'bg-emerald-500 text-white',
                    level.level === survey.currentApprovalLevel && 'bg-amber-500 text-white animate-pulse',
                    level.level > survey.currentApprovalLevel && 'bg-gray-200 text-gray-500'
                  )}>
                    {level.level < survey.currentApprovalLevel ? '✓' : level.level}
                  </div>
                  {idx < approvalLevels.length - 1 && (
                    <div className={cn(
                      'flex-1 h-1 mx-1',
                      level.level < survey.currentApprovalLevel ? 'bg-emerald-500' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {approvalLevels.map((level) => (
                <span key={level.level}>{level.name}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checklist">
            Checklist ({survey.checklistCompleted}/{survey._count.checklistItems})
          </TabsTrigger>
          <TabsTrigger value="photos">
            Photos ({survey._count.photos})
          </TabsTrigger>
          <TabsTrigger value="voice">
            Voice Notes ({survey._count.voiceNotes})
          </TabsTrigger>
          <TabsTrigger value="details">
            Details
          </TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          {/* Add new item form */}
          {!isLocked && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option>General</option>
                  <option>Structural</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Safety</option>
                  <option>Environmental</option>
                </select>
                <input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                  placeholder="Add new checklist item..."
                  className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
                />
                <Button size="sm" onClick={addChecklistItem} disabled={!newItemText.trim() || addingItem}>
                  {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {Object.entries(groupedChecklist).map(([category, items]) => {
            const catDone = items.filter((i) => i.isCompleted).length
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    <span className="text-xs text-muted-foreground">{catDone}/{items.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0 group">
                        <button
                          onClick={() => !isLocked && toggleChecklistItem(item.id, !item.isCompleted)}
                          disabled={isLocked}
                          className={cn(
                            'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            item.isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'border-2 border-muted-foreground/30 hover:border-emerald-400',
                            isLocked && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          {item.isCompleted && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', item.isCompleted && 'line-through text-muted-foreground')}>
                            {item.item}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                          )}
                        </div>
                        {!isLocked && (
                        <button
                          onClick={() => deleteChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          {!isLocked && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="photo-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="h-4 w-4 mr-1.5" /> Select Photo</span>
                  </Button>
                </label>
                {photoFile && (
                  <>
                    <span className="text-sm text-muted-foreground">{photoFile.name}</span>
                    <Button size="sm" disabled={photoUploading} onClick={handlePhotoUpload}>
                      {photoUploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Camera className="h-4 w-4 mr-1.5" />}
                      Upload
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPhotoFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {survey.photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No photos uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {survey.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg border overflow-hidden bg-muted">
                  {photo.url.startsWith('data:image') ? (
                    <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Voice Notes Tab */}
        <TabsContent value="voice" className="space-y-4">
          {survey.voiceNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mic className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No voice notes recorded yet</p>
                <Link href="/media/voice-notes">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Mic className="h-4 w-4 mr-1.5" /> Record Voice Note
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {survey.voiceNotes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0">
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{note.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.duration ? `${Math.floor(note.duration / 60)}:${String(Math.round(note.duration % 60)).padStart(2, '0')}` : 'Unknown duration'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {survey.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{survey.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Project:</span>{' '}
                  <span>{survey.project?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span>{survey.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge className={cn('text-[10px]', STATUS_COLORS[survey.status])}>
                    {STATUS_LABELS[survey.status]}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Engineer:</span>{' '}
                  <span>{survey.engineer?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Scheduled:</span>{' '}
                  <span>{survey.scheduledDate || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weather:</span>{' '}
                  <span>{survey.weatherCondition || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Site Condition:</span>{' '}
                  <span>{survey.siteCondition || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GPS:</span>{' '}
                  <span>
                    {survey.gpsLatitude && survey.gpsLongitude
                      ? `${survey.gpsLatitude.toFixed(4)}, ${survey.gpsLongitude.toFixed(4)}`
                      : 'Not logged'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  <span>{new Date(survey.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              {survey.accessDetails && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Access Details</h4>
                  <p className="text-sm text-muted-foreground">{survey.accessDetails}</p>
                </div>
              )}
              {survey.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{survey.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forward Dialog */}
      {forwardDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Forward to Another Approver</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Forward this survey to another user at Level {survey.currentApprovalLevel} ({currentLevelConfig?.name}).
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Select User</label>
                <select
                  value={forwardUserId}
                  onChange={(e) => setForwardUserId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Choose a user...</option>
                  {forwardUsers
                    .filter((u) => u.id !== userId && (currentLevelConfig?.requiredRole === u.role || u.role === 'SUPER_ADMIN'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="Reason for forwarding..."
                  className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => { setForwardDialogOpen(false); setForwardUserId(''); setForwardNotes('') }}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!forwardUserId || actionLoading}
                onClick={() => handleApprovalAction('FORWARD', forwardUserId, forwardNotes || undefined)}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Users className="h-4 w-4 mr-1.5" />}
                Forward
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
