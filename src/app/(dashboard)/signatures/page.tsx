'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Pen, Type, Upload, Trash2, MoreHorizontal, Clock, Loader2, AlertCircle, Undo } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatDateTime } from '@/lib/utils'

interface Signature {
  id: string
  entityType: string
  entityId: string
  signatureData: string
  signedAt: string
  createdAt: string
  userId: string
  project?: { id: string; name: string }
  signedByUser?: { id: string; firstName: string; lastName: string }
}

export default function SignaturesPage() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createMethod, setCreateMethod] = useState<'draw' | 'type' | 'upload'>('draw')
  const [typedText, setTypedText] = useState('')
  const [selectedFont, setSelectedFont] = useState("'Great Vibes', cursive")
  const [activeTab, setActiveTab] = useState('signatures')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasEmpty, setCanvasEmpty] = useState(true)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fonts = [
    "'Great Vibes', cursive",
    "'Dancing Script', cursive",
    "'Pacifico', cursive",
    "'Satisfy', cursive",
    "'Alex Brush', cursive",
    "'Allura', cursive",
    'cursive',
  ]

  const fetchSignatures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/signatures')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load signatures')
      }
      setSignatures(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signatures')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSignatures()
  }, [fetchSignatures])

  useEffect(() => {
    if (!createDialogOpen || createMethod !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    let drawing = false, lastX = 0, lastY = 0
    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect()
      if ('touches' in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top }
    }
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing = true; const p = getPos(e); lastX = p.x; lastY = p.y }
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return; e.preventDefault(); const p = getPos(e)
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke()
      lastX = p.x; lastY = p.y; setCanvasEmpty(false)
    }
    const stop = () => { drawing = false }

    const startH = start as unknown as EventListener
    const drawH = draw as unknown as EventListener
    const stopH = stop as unknown as EventListener
    canvas.addEventListener('mousedown', startH); canvas.addEventListener('mousemove', drawH)
    canvas.addEventListener('mouseup', stopH); canvas.addEventListener('mouseleave', stopH)
    canvas.addEventListener('touchstart', startH, { passive: false })
    canvas.addEventListener('touchmove', drawH, { passive: false })
    canvas.addEventListener('touchend', stopH)
    return () => {
      canvas.removeEventListener('mousedown', startH); canvas.removeEventListener('mousemove', drawH)
      canvas.removeEventListener('mouseup', stopH); canvas.removeEventListener('mouseleave', stopH)
      canvas.removeEventListener('touchstart', startH); canvas.removeEventListener('touchmove', drawH)
      canvas.removeEventListener('touchend', stopH)
    }
  }, [createDialogOpen, createMethod])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setCanvasEmpty(true)
  }

  const getSignatureData = (): string | null => {
    if (createMethod === 'draw') {
      const canvas = canvasRef.current
      if (!canvas || canvasEmpty) return null
      return canvas.toDataURL('image/png')
    }
    if (createMethod === 'type' && typedText.trim()) {
      return `typed:${selectedFont}:${typedText.trim()}`
    }
    if (createMethod === 'upload' && fileDataUrl) {
      return fileDataUrl
    }
    return null
  }

  const handleSave = async () => {
    const data = getSignatureData()
    if (!data) return

    try {
      setSaving(true)
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: data,
          entityType: 'SIGNATURE',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save signature')
      }
      setSignatures((prev) => [json.data, ...prev])
      setCreateDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save signature')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/signatures/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete signature')
      }
      setSignatures((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete signature')
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setTypedText('')
    setSelectedFont("'Great Vibes', cursive")
    setFileDataUrl(null)
    setCanvasEmpty(true)
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFileDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const getSignaturePreview = (sig: Signature) => {
    const data = sig.signatureData
    if (data?.startsWith('data:image') || (data && !data.startsWith('typed:'))) {
      return <img src={data} alt="Signature" className="max-h-16 object-contain" />
    }
    if (data?.startsWith('typed:')) {
      const parts = data.split(':')
      return (
        <span className="text-2xl" style={{ fontFamily: parts[1] || 'cursive', color: '#1e293b' }}>
          {parts.slice(2).join(':') || 'Signature'}
        </span>
      )
    }
    const name = sig.signedByUser ? `${sig.signedByUser.firstName} ${sig.signedByUser.lastName}` : 'Signature'
    return <span className="text-2xl text-muted-foreground" style={{ fontFamily: 'cursive' }}>{name}</span>
  }

  const getDisplayName = (sig: Signature) => {
    if (sig.signedByUser) return `${sig.signedByUser.firstName} ${sig.signedByUser.lastName}`
    if (sig.signatureData?.startsWith('typed:')) return sig.signatureData.split(':').slice(2).join(':')
    return 'Signature'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Digital Signatures
          </h1>
          <p className="text-muted-foreground">
            Manage your digital signatures for document approvals and sign-offs.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Signature
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 px-2 text-red-700">
            Dismiss
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="signatures">My Signatures</TabsTrigger>
        </TabsList>

        <TabsContent value="signatures" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading signatures...</span>
            </div>
          ) : signatures.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Pen className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No signatures yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first signature to use in document approvals.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Create Signature
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signatures.map((sig) => (
                <Card key={sig.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Pen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(sig.id)}
                            disabled={deletingId === sig.id}
                          >
                            {deletingId === sig.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="rounded-lg border-2 border-dashed bg-white p-6 mb-4 flex items-center justify-center min-h-[80px]">
                      {getSignaturePreview(sig)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{getDisplayName(sig)}</span>
                        {sig.project && (
                          <Badge className="text-[10px] bg-slate-100 text-slate-700">
                            {sig.project.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Created {formatDateTime(sig.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Tabs
              value={createMethod}
              onValueChange={(v) => {
                setCreateMethod(v as typeof createMethod)
                resetForm()
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="draw" className="flex-1">
                  <Pen className="mr-1 h-4 w-4" />
                  Draw
                </TabsTrigger>
                <TabsTrigger value="type" className="flex-1">
                  <Type className="mr-1 h-4 w-4" />
                  Type
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  <Upload className="mr-1 h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="draw" className="mt-4">
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed bg-white p-4 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Draw your signature below
                    </p>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-[120px] border rounded-lg bg-gray-50 cursor-crosshair touch-none"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                    className="w-full"
                  >
                    <Undo className="mr-1 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="type" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type your name</Label>
                    <Input
                      value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Choose font style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {fonts.map((font) => (
                        <button
                          key={font}
                          onClick={() => setSelectedFont(font)}
                          className={cn(
                            'rounded-lg border p-3 text-center transition-all',
                            selectedFont === font
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'hover:bg-muted'
                          )}
                        >
                          <span
                            className="text-lg block"
                            style={{ fontFamily: font }}
                          >
                            {typedText || 'Signature'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-dashed bg-white p-6 flex items-center justify-center min-h-[80px]">
                    <span
                      className="text-3xl"
                      style={{ fontFamily: selectedFont, color: '#1e293b' }}
                    >
                      {typedText || 'Your Signature'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-4">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFileUpload} />
                  {fileDataUrl ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border-2 border-dashed bg-white p-6 flex items-center justify-center min-h-[120px]">
                        <img src={fileDataUrl} alt="Uploaded signature" className="max-h-20 object-contain" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { setFileDataUrl(null); fileInputRef.current?.click() }}>
                        Replace Image
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-8 flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop your signature image</p>
                      <p className="text-xs text-muted-foreground mb-4">PNG, JPG or SVG. Max 2MB.</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>Browse Files</Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setCreateDialogOpen(false); resetForm() }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || (createMethod === 'draw' && canvasEmpty) || (createMethod === 'type' && !typedText.trim()) || (createMethod === 'upload' && !fileDataUrl)}
              >
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Save Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
