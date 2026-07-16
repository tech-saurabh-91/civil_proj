'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail, Inbox, Send, FileText, Plus, Search, Paperclip, Trash2,
  Reply, Forward, Star, Clock, CheckCircle, Eye, MoreVertical,
  Bold, Italic, Underline, List, Link2, Download, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface EmailLogEntry {
  id: string
  to: string
  from: string
  subject: string
  body: string
  status: string
  sentAt: string | null
  createdAt: string
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState('compose')
  const [emails, setEmails] = useState<EmailLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailLogEntry | null>(null)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email?limit=50')
      const data = await res.json()
      setEmails(data.data ?? [])
    } catch {
      toast.error('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error('Please fill in all fields')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
      })
      if (res.ok) {
        toast.success('Email sent successfully')
        setComposeTo('')
        setComposeSubject('')
        setComposeBody('')
        fetchEmails()
        setActiveTab('sent')
      } else {
        toast.error('Failed to send email')
      }
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const filteredEmails = emails.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return e.subject.toLowerCase().includes(q) || e.to.toLowerCase().includes(q) || e.from.toLowerCase().includes(q)
  })

  const sentEmails = emails.filter((e) => e.status === 'SENT')
  const unreadCount = emails.filter((e) => e.status !== 'READ').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Management"
        description="Compose, manage, and track emails"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Email' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Inbox className="mr-1 h-3 w-3" />
              {emails.length} total
            </Badge>
            <Button size="sm" onClick={() => setActiveTab('compose')}>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Create and send a new email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Input
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Enter email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Body</label>
                <Textarea
                  placeholder="Write your email here..."
                  className="min-h-[300px]"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => { setComposeTo(''); setComposeSubject(''); setComposeBody('') }}>
                  Clear
                </Button>
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emails..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmails.map((email) => (
                          <TableRow
                            key={email.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => setSelectedEmail(email)}
                          >
                            <TableCell className="text-sm font-medium">{email.from}</TableCell>
                            <TableCell className="text-sm">{email.to}</TableCell>
                            <TableCell className="text-sm">{email.subject}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {email.sentAt
                                ? new Date(email.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : new Date(email.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={email.status === 'SENT' ? 'default' : 'secondary'} className="text-xs">
                                {email.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEmail && (
            <Card className="mt-4">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{selectedEmail.subject}</CardTitle>
                  <CardDescription>
                    From: {selectedEmail.from} → To: {selectedEmail.to}
                    <br />
                    Date: {selectedEmail.sentAt
                      ? new Date(selectedEmail.sentAt).toLocaleString('en-IN')
                      : new Date(selectedEmail.createdAt).toLocaleString('en-IN')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {selectedEmail.body}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>To</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No sent emails
                          </TableCell>
                        </TableRow>
                      ) : (
                        sentEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="text-sm">{email.to}</TableCell>
                            <TableCell className="text-sm font-medium">{email.subject}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {email.sentAt
                                ? new Date(email.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Sent
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
