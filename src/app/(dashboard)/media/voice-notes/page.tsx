'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic, Upload, Play, Pause, Square, Clock, Calendar,
  FileText, Trash2, Search, MoreHorizontal,
  CheckCircle2, AlertCircle, Link2, Loader2
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VoiceNote {
  id: string
  filename: string
  url: string
  duration: number | null
  transcription: string | null
  createdAt: string
  survey?: { id: string; title: string; project?: { name: string } }
}

export default function VoiceNotesPage() {
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/voice-notes')
      const json = await res.json()
      if (json.success) setNotes(json.data ?? [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch('/api/surveys?limit=100')
      const json = await res.json()
      if (json.success) setSurveys(json.data ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotes()
    fetchSurveys()
  }, [fetchNotes, fetchSurveys])

  const startRecording = async () => {
    if (!selectedSurveyId) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordingBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setRecordingBlob(null)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }

  const saveRecording = async () => {
    if (!recordingBlob || !selectedSurveyId) return
    try {
      setSaving(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const res = await fetch('/api/voice-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `recording-${Date.now()}.webm`,
            url: base64,
            duration: recordingTime,
            surveyId: selectedSurveyId,
          }),
        })
        const json = await res.json()
        if (json.success) {
          setNotes((prev) => [json.data, ...prev])
          setRecordingBlob(null)
          setRecordingTime(0)
        }
      }
      reader.readAsDataURL(recordingBlob)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedSurveyId) return
    try {
      setSaving(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const res = await fetch('/api/voice-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            url: base64,
            duration: null,
            surveyId: selectedSurveyId,
          }),
        })
        const json = await res.json()
        if (json.success) setNotes((prev) => [json.data, ...prev])
      }
      reader.readAsDataURL(file)
    } catch {
    } finally {
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/voice-notes/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  const togglePlay = (note: VoiceNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(note.url)
      audio.onended = () => setPlayingId(null)
      audio.play()
      audioRef.current = audio
      setPlayingId(note.id)
    }
  }

  const formatDuration = (secs: number | null) => {
    if (!secs) return '0:00'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase()
    return (
      n.filename.toLowerCase().includes(q) ||
      n.survey?.title?.toLowerCase().includes(q) ||
      n.survey?.project?.name?.toLowerCase().includes(q) ||
      n.transcription?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Notes"
        description="Record and manage audio observations from site surveys"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Media', href: '/media' },
          { label: 'Voice Notes' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedSurveyId || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Recording
            </Button>
          </div>
        }
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md">
              <label className="text-sm font-medium mb-1 block">Select Survey</label>
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a survey to attach recording" />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} — {s.project || 'No project'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center">
              <h3 className="font-medium">Voice Recorder</h3>
              <p className="text-sm text-muted-foreground">
                {isRecording ? 'Recording in progress...' : recordingBlob ? 'Recording ready to save' : 'Click to start recording'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!recordingBlob ? (
                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  size="icon"
                  className="h-16 w-16 rounded-full"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!selectedSurveyId}
                >
                  {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => { setRecordingBlob(null); setRecordingTime(0) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full"
                    onClick={saveRecording}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                  </Button>
                </>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>{formatDuration(recordingTime)}</span>
              </div>
            )}

            <div className="w-full max-w-md h-12 flex items-center justify-center gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full ${isRecording ? 'bg-primary' : 'bg-primary/30'}`}
                  style={{
                    height: isRecording
                      ? `${Math.random() * 40 + 8}px`
                      : `${Math.random() * 16 + 4}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voice notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredNotes.length} voice note{filteredNotes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mic className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No voice notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a survey and start recording to create your first voice note.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Button
                        variant={playingId === note.id ? 'default' : 'outline'}
                        size="icon"
                        className="h-10 w-10 rounded-full shrink-0"
                        onClick={() => togglePlay(note)}
                      >
                        {playingId === note.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <h3 className="font-medium">{note.filename}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {note.survey?.project?.name && <span>{note.survey.project.name}</span>}
                          {note.survey?.title && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                {note.survey.title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(note.id)}
                          disabled={deletingId === note.id}
                        >
                          {deletingId === note.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(note.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTime(note.createdAt)}
                    </span>
                  </div>

                  {note.transcription && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                        <FileText className="h-3 w-3" />
                        Transcription
                      </div>
                      <p className="text-sm">{note.transcription}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
