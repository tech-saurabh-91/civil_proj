'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  GitBranch,
  Users,
  Calendar,
  Clock,
  Settings,
  CheckCheck,
  Eye,
  Trash2,
  Mail,
  AlertOctagon,
  Zap,
  Shield,
  DollarSign,
  Building2,
  HardHat,
  Camera,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type NotificationType = 'info' | 'success' | 'warning' | 'error'
type NotificationCategory = 'all' | 'unread' | 'mentions' | 'system'

interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory | 'general'
  title: string
  message: string
  timestamp: string
  read: boolean
  icon: React.ReactNode
  color: string
  bgColor: string
}

const typeConfig: Record<NotificationType, { color: string; bgColor: string }> = {
  info: { color: 'text-blue-600', bgColor: 'bg-blue-50' },
  success: { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  warning: { color: 'text-amber-600', bgColor: 'bg-amber-50' },
  error: { color: 'text-red-600', bgColor: 'bg-red-50' },
}

function timeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.data ?? data.notifications ?? (Array.isArray(data) ? data : []))
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'mentions') return n.category === 'mentions'
    if (activeTab === 'system') return n.category === 'system'
    return true
  })

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1><p className="text-muted-foreground">Stay updated with workflow activities and team updates.</p></div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with workflow activities and team updates.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 h-4 w-4" />Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications/preferences">
              <Settings className="mr-1 h-4 w-4" />Preferences
            </Link>
          </Button>
        </div>
      </div>

      {unreadCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="mentions">Mentions ({notifications.filter((n) => n.category === 'mentions').length})</TabsTrigger>
          <TabsTrigger value="system">System ({notifications.filter((n) => n.category === 'system').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                  <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const typeConf = typeConfig[notification.type]
                    return (
                      <div
                        key={notification.id}
                        className={cn('flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer', !notification.read && 'bg-blue-50/50')}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', notification.bgColor)}>
                          <span className={notification.color}>{notification.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium')}>{notification.title}</h4>
                            {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />{timeAgo(notification.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.read && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
