'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  UserPlus, Calendar, ChevronRight, Users, BarChart3,
  LayoutGrid, List, RefreshCw, Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Survey {
  id: string
  title: string
  type: string
  status: string
  scheduledDate: string | null
  engineerId: string | null
  engineerName: string
  projectName: string
  projectId: string
}

interface Engineer {
  id: string
  firstName: string
  lastName: string
  role: string
  activeSurveys: number
}

export default function AssignmentsPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board')
  const [selectedSurvey, setSelectedSurvey] = useState('')
  const [selectedEngineer, setSelectedEngineer] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [surveysRes, engineersRes] = await Promise.all([
        fetch('/api/surveys?limit=100'),
        fetch('/api/users?role=ENGINEER&limit=50'),
      ])
      const surveysData = await surveysRes.json()
      const engineersData = await engineersRes.json()

      const surveyList = (surveysData.data ?? surveysData.surveys ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        status: s.status,
        scheduledDate: s.scheduledDate,
        engineerId: s.engineerId,
        engineerName: s.engineer
          ? `${s.engineer.firstName} ${s.engineer.lastName}`
          : 'Unassigned',
        projectName: s.project?.name || '—',
        projectId: s.projectId,
      }))
      setSurveys(surveyList)

      const engList = (engineersData.users ?? engineersData.data ?? []).map((e: any) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        role: e.role,
        activeSurveys: surveyList.filter((s: Survey) => s.engineerId === e.id && s.status !== 'COMPLETED' && s.status !== 'REJECTED').length,
      }))
      setEngineers(engList)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const unassigned = surveys.filter((s) => !s.engineerId && s.status !== 'COMPLETED')
  const assigned = surveys.filter((s) => s.engineerId && s.status !== 'COMPLETED' && s.status !== 'IN_PROGRESS')
  const inProgress = surveys.filter((s) => s.status === 'IN_PROGRESS')

  const handleAssign = async () => {
    if (!selectedSurvey || !selectedEngineer) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/surveys/${selectedSurvey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineerId: selectedEngineer }),
      })
      if (res.ok) {
        toast.success('Survey assigned successfully')
        setSelectedSurvey('')
        setSelectedEngineer('')
        fetchData()
      } else {
        toast.error('Failed to assign survey')
      }
    } catch {
      toast.error('Failed to assign survey')
    } finally {
      setAssigning(false)
    }
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-amber-400 text-amber-900',
    LOW: 'bg-green-500 text-white',
  }

  const typeColors: Record<string, string> = {
    INITIAL: 'bg-blue-100 text-blue-800',
    DETAILED: 'bg-purple-100 text-purple-800',
    FOLLOW_UP: 'bg-amber-100 text-amber-800',
    FINAL: 'bg-emerald-100 text-emerald-800',
    AS_BUILT: 'bg-cyan-100 text-cyan-800',
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-emerald-100 text-emerald-800',
    SUBMITTED: 'bg-violet-100 text-violet-800',
    UNDER_REVIEW: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Assignments"
        description="Assign surveys to engineers and manage workloads"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Surveys', href: '/surveys' },
          { label: 'Assignments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <Button variant={viewMode === 'board' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('board')} className="rounded-r-none">
                <LayoutGrid className="h-4 w-4 mr-1" /> Board
              </Button>
              <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="rounded-l-none">
                <Calendar className="h-4 w-4 mr-1" /> Calendar
              </Button>
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        }
      />

      {viewMode === 'board' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  Unassigned
                  <Badge variant="secondary" className="ml-auto">{unassigned.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {unassigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">All surveys assigned</p>
                ) : (
                  unassigned.map((survey) => (
                    <div key={survey.id} className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[survey.type] || 'bg-gray-100'}`}>
                          {survey.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[survey.status] || 'bg-gray-100'}`}>
                          {survey.status.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href={`/surveys/${survey.id}`} className="font-medium text-sm hover:underline block">
                        {survey.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{survey.projectName}</p>
                      {survey.scheduledDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(survey.scheduledDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  Assigned
                  <Badge variant="secondary" className="ml-auto">{assigned.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No assigned surveys</p>
                ) : (
                  assigned.map((survey) => (
                    <div key={survey.id} className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[survey.type] || 'bg-gray-100'}`}>
                          {survey.type.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href={`/surveys/${survey.id}`} className="font-medium text-sm hover:underline block">
                        {survey.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{survey.projectName}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {survey.scheduledDate
                            ? new Date(survey.scheduledDate).toLocaleDateString('en-IN')
                            : 'No date'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px]">
                              {survey.engineerName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{survey.engineerName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  In Progress
                  <Badge variant="secondary" className="ml-auto">{inProgress.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {inProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No surveys in progress</p>
                ) : (
                  inProgress.map((survey) => (
                    <div key={survey.id} className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[survey.type] || 'bg-gray-100'}`}>
                          {survey.type.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href={`/surveys/${survey.id}`} className="font-medium text-sm hover:underline block">
                        {survey.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{survey.projectName}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[7px]">
                                {survey.engineerName.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{survey.engineerName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Engineer Workload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {engineers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No engineers found</p>
                ) : (
                  engineers.map((eng) => (
                    <div key={eng.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {eng.firstName[0]}{eng.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{eng.firstName} {eng.lastName}</p>
                            <p className="text-xs text-muted-foreground">{eng.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{eng.activeSurveys}</span>
                          <p className="text-[10px] text-muted-foreground">active surveys</p>
                        </div>
                      </div>
                      <Progress value={Math.min(100, (eng.activeSurveys / 5) * 100)} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quick Assign
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Survey</label>
                  <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                    <SelectTrigger><SelectValue placeholder="Choose a survey" /></SelectTrigger>
                    <SelectContent>
                      {unassigned.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Engineer</label>
                  <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                    <SelectTrigger><SelectValue placeholder="Choose engineer" /></SelectTrigger>
                    <SelectContent>
                      {engineers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.activeSurveys} active)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={!selectedSurvey || !selectedEngineer || assigning} onClick={handleAssign}>
                  {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Assign Survey
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Survey Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {surveys.filter((s) => s.scheduledDate).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()).map((survey) => (
                <div key={survey.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50">
                  <div className="text-center min-w-[50px]">
                    <p className="text-lg font-bold">{new Date(survey.scheduledDate!).getDate()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(survey.scheduledDate!).toLocaleDateString('en-IN', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Link href={`/surveys/${survey.id}`} className="text-sm font-medium hover:underline">
                      {survey.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{survey.projectName} — {survey.engineerName}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[survey.type] || 'bg-gray-100'}`}>
                    {survey.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {surveys.filter((s) => s.scheduledDate).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No scheduled surveys</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
