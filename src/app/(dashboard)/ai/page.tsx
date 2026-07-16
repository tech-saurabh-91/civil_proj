'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  FolderKanban,
  ClipboardList,
  Users,
  FileText,
  Calculator,
  MapPin,
  Settings,
  BarChart3,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_COMMANDS = [
  { label: 'How do I create a project?', icon: FolderKanban, prompt: 'How do I create a new project?' },
  { label: 'How do I start a survey?', icon: ClipboardList, prompt: 'How do I start and complete a survey?' },
  { label: 'How do I add BOQ items?', icon: Calculator, prompt: 'How do I add BOQ items and upload CSV?' },
  { label: 'How do I track engineers?', icon: MapPin, prompt: 'How does GPS tracking work?' },
  { label: 'How do I create invoices?', icon: FileText, prompt: 'How do I create and send invoices?' },
  { label: 'What are the user roles?', icon: Users, prompt: 'What user roles are available and what can they do?' },
  { label: 'How do I generate reports?', icon: BarChart3, prompt: 'How do I generate reports and export data?' },
  { label: 'How do I use measurements?', icon: Settings, prompt: 'How do I record and verify measurements?' },
]

const KNOWLEDGE_BASE: Record<string, string> = {
  project: `**Creating a Project:**
1. Go to Projects → Click "New Project"
2. Fill in: Project Name, Client, Type, Budget, Dates
3. Add address and GPS coordinates
4. Assign a Project Manager
5. Click "Create Project"

Your project will appear in the project list and can be tracked from the Dashboard.`,

  survey: `**Starting a Survey:**
1. Go to Surveys → Click "New Survey"
2. Select the Project and Survey Type
3. Assign an Engineer
4. Set scheduled date and GPS location
5. Add checklist items
6. Click "Create Survey"

**Completing a Survey:**
1. Open the survey from the list
2. Complete each checklist item
3. Upload site photos
4. Record voice notes
5. Add digital signature
6. Submit for approval`,

  boq: `**Adding BOQ Items:**
1. Go to BOQ → Select a Project
2. Click "New BOQ Item"
3. Fill: Description, Category, Unit, Quantity, Rate
4. Amount is auto-calculated (Qty × Rate)

**Uploading CSV:**
1. Click "Upload CSV" button
2. Select a CSV file with columns: Description, Category, Unit, Quantity, Rate
3. Preview the parsed items
4. Click "Import" to add all items`,

  gps: `**GPS Tracking:**
- Engineers open the GPS page on their phone
- Location is tracked automatically every 8 seconds
- Admin sees all engineers on the live map
- Geofences detect when engineers enter/leave sites
- Travel routes are shown as polylines
- Time at site is calculated automatically`,

  invoice: `**Creating Invoices:**
1. Go to Invoices → Click "New Invoice"
2. Step 1: Select Project
3. Step 2: Add line items (description, qty, rate)
4. Step 3: Set tax (GST) and discount
5. Step 4: Review and submit
6. Invoice number is auto-generated (INV-YYYY-XXX)`,

  roles: `**User Roles:**
- **Super Admin**: Full access to everything
- **Admin**: Manage users, settings, all modules
- **Manager**: Manage projects, surveys, team
- **Engineer**: Field work, surveys, measurements
- **Surveyor**: Site inspections, GPS tracking
- **Client**: View project progress (limited access)
- **Accountant**: BOQ, invoices, payments`,

  report: `**Generating Reports:**
1. Go to Reports → Click "Generate Report"
2. Select report type (Survey, Project, Financial)
3. Choose date range and filters
4. Preview the report
5. Download as PDF or print

**Exporting Data:**
- Most list pages have an "Export" button
- Exports as CSV files
- BOQ can be exported as Excel`,

  measurement: `**Recording Measurements:**
1. Go to Measurements → Click "Add Measurement"
2. Select Project and BOQ Item
3. Enter dimensions (length, width, height)
4. System auto-calculates area, volume, quantity
5. Attach site photos
6. Submit for verification

**Verification Flow:**
Engineer submits → QA verifies → Client approves → Included in RA Bill`,

  default: `I can help you with:
- **Projects**: Creating, managing, and tracking projects
- **Surveys**: Starting, completing, and approving surveys
- **BOQ**: Adding items, uploading CSV, exporting
- **GPS**: Tracking engineers, geofencing, attendance
- **Invoices**: Creating, sending, and tracking payments
- **Measurements**: Recording, verifying, and billing
- **Reports**: Generating and exporting reports
- **Users**: Managing roles and permissions

Ask me anything about how to use the platform!`,
}

function getAIResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes('project') && (lower.includes('creat') || lower.includes('new') || lower.includes('add'))) {
    return KNOWLEDGE_BASE.project
  }
  if (lower.includes('survey') && (lower.includes('start') || lower.includes('creat') || lower.includes('complet') || lower.includes('how'))) {
    return KNOWLEDGE_BASE.survey
  }
  if (lower.includes('boq') || lower.includes('bill of quantit')) {
    return KNOWLEDGE_BASE.boq
  }
  if (lower.includes('gps') || lower.includes('track') || lower.includes('location') || lower.includes('geofence')) {
    return KNOWLEDGE_BASE.gps
  }
  if (lower.includes('invoice') || lower.includes('bill') || lower.includes('payment')) {
    return KNOWLEDGE_BASE.invoice
  }
  if (lower.includes('role') || lower.includes('permission') || lower.includes('access') || lower.includes('user')) {
    return KNOWLEDGE_BASE.roles
  }
  if (lower.includes('report') || lower.includes('export') || lower.includes('download') || lower.includes('pdf')) {
    return KNOWLEDGE_BASE.report
  }
  if (lower.includes('measurement') || lower.includes('measure') || lower.includes('quantity') || lower.includes('mb')) {
    return KNOWLEDGE_BASE.measurement
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm your BuildSurvey Pro assistant. I can help you navigate the platform, explain features, and guide you through workflows. What would you like to know?"
  }
  if (lower.includes('help') || lower.includes('what can you')) {
    return KNOWLEDGE_BASE.default
  }

  return `I understand you're asking about "${input}". Here are some things I can help with:

- Type **"project"** to learn about creating projects
- Type **"survey"** to learn about surveys
- Type **"boq"** for bill of quantities
- Type **"gps"** for tracking features
- Type **"invoice"** for billing
- Type **"measurement"** for quantity tracking
- Type **"report"** for generating reports
- Type **"roles"** for user permissions

Or ask me anything specific about the platform!`
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to BuildSurvey Pro! I'm your AI assistant. I can help you:\n\n- Navigate the platform\n- Explain how features work\n- Guide you through workflows\n- Answer questions about any module\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text?: string) => {
    const question = text || input.trim()
    if (!question) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = getAIResponse(question)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Ask questions about the platform — get instant answers"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'AI Assistant' }]}
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Quick Commands Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleSend(cmd.prompt)}
                  className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm hover:bg-muted/50 transition-colors"
                >
                  <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{cmd.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {['Projects', 'Surveys', 'BOQ', 'GPS', 'Invoices', 'Measurements', 'Reports', 'Users'].map((m) => (
                  <Badge key={m} variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => handleSend(`Tell me about ${m}`)}>
                    {m}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm">BuildSurvey AI</CardTitle>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
                <Badge variant="success" className="ml-auto text-[10px]">Online</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-xl px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted'
                    )}
                  >
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.role === 'user' ? 'text-blue-200' : 'text-muted-foreground'
                    )}>
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-xl px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about the platform..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
