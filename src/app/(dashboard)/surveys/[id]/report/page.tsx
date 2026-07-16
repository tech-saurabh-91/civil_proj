'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Download, Loader2, CheckCircle2, Camera, MapPin, Calendar, User, Cloud, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SurveyReport {
  id: string
  title: string
  description: string | null
  project: { name: string; code: string | null }
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
  engineer: { name: string; email: string } | null
  checklistItems: { id: string; category: string; item: string; isCompleted: boolean; notes: string | null }[]
  photos: { id: string; url: string; filename: string; caption: string | null }[]
  _count: { checklistItems: number; photos: number; voiceNotes: number }
  checklistCompleted: number
  progress: number
}

export default function SurveyReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [survey, setSurvey] = useState<SurveyReport | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${id}`)
      const json = await res.json()
      if (json.success) setSurvey(json.data)
      else toast.error('Survey not found')
    } catch {
      toast.error('Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSurvey()
  }, [fetchSurvey])

  const printReport = () => window.print()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Survey not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const groupedChecklist = survey.checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof survey.checklistItems>)

  const totalDone = survey.checklistItems.filter((i) => i.isCompleted).length
  const totalItems = survey.checklistItems.length

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only controls */}
      <div className="no-print sticky top-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={printReport}>
            <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">SITE SURVEY REPORT</h1>
          <p className="text-sm text-gray-500 mt-1">{survey.project?.name || 'N/A'}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span>Report ID: {survey.id.slice(0, 8).toUpperCase()}</span>
            <span>|</span>
            <span>Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* Survey Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Survey Information</h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Title:</span><span className="font-medium">{survey.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type:</span><span>{survey.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span><span>{survey.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Scheduled:</span><span>{survey.scheduledDate || 'N/A'}</span></div>
              {survey.completedDate && (
                <div className="flex justify-between"><span className="text-gray-500">Completed:</span><span>{survey.completedDate}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Engineer:</span><span>{survey.engineer?.name || 'Unassigned'}</span></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Site Conditions</h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Weather:</span><span>{survey.weatherCondition || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Site Condition:</span><span>{survey.siteCondition || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GPS Lat:</span><span>{survey.gpsLatitude?.toFixed(6) || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GPS Lng:</span><span>{survey.gpsLongitude?.toFixed(6) || 'N/A'}</span></div>
              {survey.accessDetails && (
                <div><span className="text-gray-500">Access:</span><p className="mt-0.5">{survey.accessDetails}</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {survey.description && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-2">Description</h3>
            <p className="text-sm text-gray-700">{survey.description}</p>
          </div>
        )}

        {/* Checklist Summary */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-3">
            Checklist Summary — {totalDone}/{totalItems} Completed ({totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0}%)
          </h3>
          {Object.entries(groupedChecklist).map(([category, items]) => {
            const catDone = items.filter((i) => i.isCompleted).length
            return (
              <div key={category} className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">{category} ({catDone}/{items.length})</p>
                <div className="grid grid-cols-1 gap-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[10px]',
                        item.isCompleted ? 'bg-emerald-500 text-white' : 'border border-gray-300'
                      )}>
                        {item.isCompleted && '✓'}
                      </span>
                      <span className={item.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}>{item.item}</span>
                      {item.notes && <span className="text-xs text-gray-400 ml-auto">({item.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Notes */}
        {survey.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-2">Engineer Notes</h3>
            <p className="text-sm text-gray-700">{survey.notes}</p>
          </div>
        )}

        {/* Photos */}
        {survey.photos.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-3">Site Photos ({survey.photos.length})</h3>
            <div className="grid grid-cols-3 gap-3">
              {survey.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded border overflow-hidden bg-gray-100">
                  {photo.url.startsWith('data:image') ? (
                    <img src={photo.url} alt={photo.caption || photo.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Preview</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Block */}
        <div className="mt-12 pt-6 border-t-2 border-gray-900">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-8">Engineer Signature</p>
              <div className="border-t border-gray-400 pt-1">
                <p className="text-sm">{survey.engineer?.name || '_______________'}</p>
                <p className="text-xs text-gray-400">Date: _______________</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">Manager Approval</p>
              <div className="border-t border-gray-400 pt-1">
                <p className="text-sm">_______________</p>
                <p className="text-xs text-gray-400">Date: _______________</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
