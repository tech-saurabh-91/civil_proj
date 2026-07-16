'use client'

import Link from 'next/link'
import {
  Phone, UserCheck, ArrowRightLeft, MapPin, FileText, Calculator,
  IndianRupee, Send, Handshake, PenTool, FolderOpen, ClipboardList,
  HardHat, Package, BarChart3, Shield, Navigation, Receipt, Wallet,
  TrendingUp, CheckCircle2, Archive, ArrowRight, Building2, Users,
  Target, Zap, Database, Lock, Settings, Globe, Calendar, Camera,
  Ruler, Brain, ScanLine, Bell, Mail, GitBranch, BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
  module: string
  href?: string
  color: string
  bgColor: string
  dependsOn?: string
  dataCreated?: string
}

interface Phase {
  id: string
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
  steps: Step[]
}

const phases: Phase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0: System Setup (Masters)',
    description: 'One-time setup — create master data before starting any project',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: Database,
    steps: [
      { id: 0, title: 'Create Users', description: 'Add admins, managers, engineers, surveyors with roles and passwords', icon: Users, module: 'Users', href: '/users/new', color: 'text-slate-600', bgColor: 'bg-slate-100', dataCreated: 'User accounts with roles (ADMIN, MANAGER, ENGINEER, SURVEYOR)' },
      { id: 1, title: 'Assign Roles & Permissions', description: 'Define who can access what — admin sees all, engineer sees field modules', icon: Lock, module: 'Roles', href: '/roles', color: 'text-slate-600', bgColor: 'bg-slate-100', dataCreated: 'Role-based access control for sidebar and API' },
      { id: 2, title: 'Master Categories', description: 'Create material categories, unit types, project types, survey types', icon: Database, module: 'Masters', href: '/masters', color: 'text-slate-600', bgColor: 'bg-slate-100', dataCreated: 'MasterCategory and MasterItem records' },
      { id: 3, title: 'System Settings', description: 'Configure company info, GST rates, tax slabs, currency, date formats', icon: Settings, module: 'Settings', href: '/settings', color: 'text-slate-600', bgColor: 'bg-slate-100', dataCreated: 'Setting key-value pairs (company, tax, currency)' },
      { id: 4, title: 'Measurement Units', description: 'Define units — sq.ft, sq.m, cum, running meter, kg, ton, nos', icon: Ruler, module: 'Masters', href: '/masters', color: 'text-slate-600', bgColor: 'bg-slate-100', dataCreated: 'MasterItem records with unit definitions' },
    ],
  },
  {
    id: 'phase-1',
    title: 'Phase 1: Business Development',
    description: 'From first client inquiry to converting them into a customer',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Target,
    steps: [
      { id: 5, title: 'Lead Capture', description: 'Client calls, website form, referral, exhibition — create Lead record with name, phone, company', icon: Phone, module: 'Leads', href: '/leads/new', color: 'text-blue-600', bgColor: 'bg-blue-100', dependsOn: 'Users', dataCreated: 'Lead (status: NEW)' },
      { id: 6, title: 'Assign Engineer', description: 'Admin assigns field engineer to the lead for follow-up and site visit', icon: UserCheck, module: 'Leads', href: '/leads', color: 'text-blue-600', bgColor: 'bg-blue-100', dependsOn: 'Lead Capture', dataCreated: 'Lead.assignedToId updated' },
      { id: 7, title: 'Follow-up & Qualify', description: 'Engineer contacts client, assesses requirements, checks budget & timeline fit', icon: Mail, module: 'Leads', href: '/leads', color: 'text-blue-600', bgColor: 'bg-blue-100', dependsOn: 'Assign Engineer', dataCreated: 'Lead status → CONTACTED → QUALIFIED' },
      { id: 8, title: 'Send Proposal', description: 'Prepare and send project proposal/quotation to client', icon: Send, module: 'Leads', href: '/leads', color: 'text-blue-600', bgColor: 'bg-blue-100', dependsOn: 'Follow-up', dataCreated: 'Lead status → PROPOSAL' },
      { id: 9, title: 'Convert to Client', description: 'Client agrees → mark lead WON → system auto-creates Client record', icon: ArrowRightLeft, module: 'Leads → Clients', href: '/clients', color: 'text-blue-600', bgColor: 'bg-blue-100', dependsOn: 'Send Proposal', dataCreated: 'Client record (auto-created from Lead data)' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Site Survey & Assessment',
    description: 'Physical site visit, GPS tracking, data collection, and documentation',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: MapPin,
    steps: [
      { id: 10, title: 'Create Survey', description: 'Create survey record linked to project — set type (Initial/Detailed/Final), schedule date', icon: ClipboardList, module: 'Surveys', href: '/surveys/new', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Project Creation', dataCreated: 'Survey (status: DRAFT)' },
      { id: 11, title: 'Assign Survey Engineer', description: 'Assign field engineer → tracking auto-starts on their login', icon: UserCheck, module: 'Assignments', href: '/surveys/assignments', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Create Survey', dataCreated: 'Survey.engineerId, GPS tracking begins' },
      { id: 12, title: 'Site Visit (GPS Tracked)', description: 'Engineer visits site — GPS auto-check-in at geofence, route recorded, check-out on leave', icon: Navigation, module: 'GPS Tracking', href: '/surveys/gps', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Assign Survey Engineer', dataCreated: 'GpsTracking points, SiteVisit (check-in/out, duration)' },
      { id: 13, title: 'Photo Documentation', description: 'Capture site photos with GPS tags — stored in DB as base64, linked to survey', icon: Camera, module: 'Photos', href: '/media/photos', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Site Visit', dataCreated: 'Photo records (url, filename, GPS coordinates, surveyId)' },
      { id: 14, title: 'Record Measurements', description: 'Enter site measurements — room sizes, area, volume, existing structures', icon: Ruler, module: 'Measurements', href: '/measurements', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Site Visit', dataCreated: 'Measurement records (length, width, area, volume, unit)' },
      { id: 15, title: 'Risk Assessment', description: 'Identify site risks — structural issues, environmental concerns, access problems', icon: Shield, module: 'Risks', href: 'risks', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Site Visit', dataCreated: 'RiskAssessment records (level, mitigation)' },
      { id: 16, title: 'Material Requirements', description: 'List materials needed — cement, steel, sand, bricks with quantities', icon: Package, module: 'Materials', href: '/materials', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Site Visit', dataCreated: 'MaterialRequirement records' },
      { id: 17, title: 'Complete Survey Checklist', description: 'Fill checklist items — structural, electrical, plumbing, safety checks', icon: CheckCircle2, module: 'Checklists', href: '/surveys/checklist', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'Site Visit', dataCreated: 'SurveyChecklistItem records (isCompleted, notes)' },
      { id: 18, title: 'Submit Survey Report', description: 'Engineer submits survey → status changes to SUBMITTED → manager reviews', icon: FileText, module: 'Surveys', href: '/surveys', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dependsOn: 'All survey data', dataCreated: 'Survey status → SUBMITTED → UNDER_REVIEW → APPROVED' },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Estimation & Quotation',
    description: 'Prepare BOQ, cost estimation, and send quotation to client',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Calculator,
    steps: [
      { id: 19, title: 'Prepare BOQ', description: 'Create Bill of Quantities — items, quantities, unit rates from survey data', icon: Package, module: 'BOQ', href: '/boq', color: 'text-amber-600', bgColor: 'bg-amber-100', dependsOn: 'Survey Approved', dataCreated: 'BOQItem records (description, quantity, unitRate, amount)' },
      { id: 20, title: 'Cost Estimation', description: 'Detailed cost breakdown — labor, material, equipment, overheads, profit', icon: IndianRupee, module: 'Estimation', href: '/estimation', color: 'text-amber-600', bgColor: 'bg-amber-100', dependsOn: 'BOQ Prepared', dataCreated: 'CostEstimation records (category, estimatedAmount)' },
      { id: 21, title: 'Create Quotation', description: 'Formal quotation with items, tax (GST), discount, payment terms', icon: Send, module: 'Quotations', href: '/quotations/new', color: 'text-amber-600', bgColor: 'bg-amber-100', dependsOn: 'Cost Estimation', dataCreated: 'Quotation + QuotationItem records' },
      { id: 22, title: 'Client Review & Negotiate', description: 'Share quotation with client, negotiate pricing, revise if needed', icon: Handshake, module: 'Leads', href: '/leads', color: 'text-amber-600', bgColor: 'bg-amber-100', dependsOn: 'Quotation Sent', dataCreated: 'Lead status → NEGOTIATION' },
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Contract & Project Setup',
    description: 'Sign contract, create project, assign team, set up workflows',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: PenTool,
    steps: [
      { id: 23, title: 'Digital Signature', description: 'Collect digital signatures from client and authorized signatories', icon: PenTool, module: 'Signatures', href: '/signatures', color: 'text-purple-600', bgColor: 'bg-purple-100', dependsOn: 'Client agrees', dataCreated: 'DigitalSignature record (canvas data, IP, timestamp)' },
      { id: 24, title: 'Create Project', description: 'Create project record — name, code, type, client, manager, budget, timelines', icon: FolderOpen, module: 'Projects', href: '/projects/new', color: 'text-purple-600', bgColor: 'bg-purple-100', dependsOn: 'Contract Signed', dataCreated: 'Project record (code, type, status: PLANNING)' },
      { id: 25, title: 'Upload Contract Documents', description: 'Upload signed contract, specs, drawings to project documents', icon: FileText, module: 'Documents', href: '/documents', color: 'text-purple-600', bgColor: 'bg-purple-100', dependsOn: 'Project Created', dataCreated: 'Document records (fileData in DB, projectId)' },
      { id: 26, title: 'Setup Approval Workflow', description: 'Define approval chain — who approves drawings, invoices, change orders', icon: GitBranch, module: 'Workflows', href: '/workflows', color: 'text-purple-600', bgColor: 'bg-purple-100', dependsOn: 'Project Created', dataCreated: 'Workflow + WorkflowStep records' },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: Execution & Monitoring',
    description: 'Construction execution, daily tracking, quality control',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: HardHat,
    steps: [
      { id: 27, title: 'Daily Progress Report', description: 'Engineer logs daily work — labor count, material used, weather, issues', icon: ClipboardList, module: 'DPR', href: '/reports/generate', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'Report records (content JSON)' },
      { id: 28, title: 'Drawing Uploads', description: 'Upload construction drawings, revisions, as-built drawings', icon: FileText, module: 'Drawings', href: '/media/drawings', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'Document records (type: DRAWING)' },
      { id: 29, title: 'Material Tracking', description: 'Track material procurement, delivery, usage against BOQ', icon: Package, module: 'Materials', href: '/materials', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'MaterialRequirement updates, status tracking' },
      { id: 30, title: 'Field Team Tracking', description: 'Admin monitors engineers on live map — site visits, attendance, routes', icon: Navigation, module: 'GPS Tracking', href: '/surveys/gps', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'GpsTracking, SiteVisit records' },
      { id: 31, title: 'Quality Inspections', description: 'Run checklists for quality — structural, electrical, plumbing, safety', icon: Shield, module: 'Checklists', href: '/surveys/checklist', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'SurveyChecklistItem completion records' },
      { id: 32, title: 'Risk Monitoring', description: 'Track and mitigate risks — update status, add new risks as project progresses', icon: Shield, module: 'Risks', href: '/risks', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'RiskAssessment updates' },
      { id: 33, title: 'Change Orders', description: 'Handle scope changes — request, approve, track impact on budget/timeline', icon: ArrowRightLeft, module: 'Workflows', href: '/workflows', color: 'text-red-600', bgColor: 'bg-red-100', dependsOn: 'Project Active', dataCreated: 'ChangeOrder records (amount, status)' },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6: Financial Management',
    description: 'Billing, invoicing, payment tracking, budget control',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Wallet,
    steps: [
      { id: 34, title: 'Progress Invoicing', description: 'Generate invoices based on milestones or percentage completed', icon: Receipt, module: 'Invoices', href: '/invoices/new', color: 'text-indigo-600', bgColor: 'bg-indigo-100', dependsOn: 'Project Active', dataCreated: 'Invoice + InvoiceItem records' },
      { id: 35, title: 'Payment Tracking', description: 'Record payments received, track pending/overdue amounts', icon: Wallet, module: 'Invoices', href: '/invoices', color: 'text-indigo-600', bgColor: 'bg-indigo-100', dependsOn: 'Invoice Created', dataCreated: 'Invoice status → PAID/PARTIAL/OVERDUE' },
      { id: 36, title: 'Budget vs Actual', description: 'Compare estimated costs with actual expenditure, track variance', icon: TrendingUp, module: 'Budget', href: '/projects', color: 'text-indigo-600', bgColor: 'bg-indigo-100', dependsOn: 'Invoices & Costs', dataCreated: 'Project.actualCost updates, variance analysis' },
    ],
  },
  {
    id: 'phase-7',
    title: 'Phase 7: Completion & Handover',
    description: 'Final inspection, documentation, client handover, project close',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: CheckCircle2,
    steps: [
      { id: 37, title: 'Final Inspection', description: 'Complete quality audit with checklists, snag list, compliance verification', icon: CheckCircle2, module: 'Checklists', href: '/surveys/checklist', color: 'text-gray-600', bgColor: 'bg-gray-100', dependsOn: 'Execution Complete', dataCreated: 'Final checklist completion, inspection report' },
      { id: 38, title: 'Compile Documentation', description: 'Assemble all documents — drawings, reports, warranties, manuals', icon: Archive, module: 'Documents', href: '/documents', color: 'text-gray-600', bgColor: 'bg-gray-100', dependsOn: 'Final Inspection', dataCreated: 'Complete document archive' },
      { id: 39, title: 'Final Invoice', description: 'Generate final invoice with retention, taxes, deductions', icon: Receipt, module: 'Invoices', href: '/invoices/new', color: 'text-gray-600', bgColor: 'bg-gray-100', dependsOn: 'Documentation', dataCreated: 'Final Invoice record' },
      { id: 40, title: 'Client Handover', description: 'Hand over keys, manuals, warranty cards — collect sign-off', icon: Handshake, module: 'Projects', href: '/projects', color: 'text-gray-600', bgColor: 'bg-gray-100', dependsOn: 'Final Invoice', dataCreated: 'Project status → COMPLETED' },
      { id: 41, title: 'Project Archive', description: 'Archive project, release team resources, generate final report', icon: Archive, module: 'Projects', href: '/projects', color: 'text-gray-600', bgColor: 'bg-gray-100', dependsOn: 'Client Handover', dataCreated: 'Project status → ARCHIVED, all data preserved' },
    ],
  },
]

const quickStats = [
  { label: 'Total Phases', value: '8', icon: Zap, color: 'text-blue-600' },
  { label: 'Total Steps', value: '42', icon: CheckCircle2, color: 'text-emerald-600' },
  { label: 'Master Setup', value: '5 steps', icon: Database, color: 'text-slate-600' },
  { label: 'Modules Used', value: '20+', icon: Building2, color: 'text-purple-600' },
]

export default function ProcessFlowPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Construction Process Flow"
        description="Complete end-to-end lifecycle — from system setup and master data to project handover."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Process Flow' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg bg-muted', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-slate-500" /><span>Masters</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-blue-500" /><span>Leads</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-emerald-500" /><span>Survey</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-amber-500" /><span>Estimation</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-purple-500" /><span>Contract</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-red-500" /><span>Execution</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-indigo-500" /><span>Finance</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-gray-500" /><span>Handover</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {phases.map((phase, phaseIndex) => {
          const PhaseIcon = phase.icon
          return (
            <div key={phase.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', phase.bgColor, phase.color)}>
                  <PhaseIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={cn('text-lg font-bold', phase.color)}>{phase.title}</h2>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
                <Badge variant="outline" className="ml-auto">{phase.steps.length} Steps</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {phase.steps.map((step) => {
                  const StepIcon = step.icon
                  return (
                    <Card key={step.id} className={cn('h-full transition-shadow hover:shadow-md', phase.borderColor, 'border')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', step.bgColor)}>
                            <StepIcon className={cn('h-5 w-5', step.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">#{step.id}</span>
                              <h3 className="text-sm font-semibold leading-tight">{step.title}</h3>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                            {step.dependsOn && (
                              <p className="mt-1 text-[10px] text-blue-600">Requires: {step.dependsOn}</p>
                            )}
                            {step.dataCreated && (
                              <p className="mt-0.5 text-[10px] text-emerald-600">Creates: {step.dataCreated}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{step.module}</Badge>
                              {step.href && (
                                <Link href={step.href}>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                                    Go →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {phaseIndex < phases.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-8 w-0.5 bg-border" />
                    <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Building2 className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-bold">Start Building</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Follow this workflow from master setup to project handover.
            Every step creates real data in the database — nothing is hardcoded.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/users/new">
                <Users className="mr-2 h-4 w-4" />
                Create User
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/masters">
                <Database className="mr-2 h-4 w-4" />
                Setup Masters
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leads/new">
                <Phone className="mr-2 h-4 w-4" />
                Create Lead
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/projects/new">
                <FolderOpen className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
