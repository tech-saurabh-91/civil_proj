'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HardHat, Menu, X, ArrowRight, CheckCircle2, Phone, Mail, MapPin,
  ClipboardCheck, BarChart3, FileText, Shield, Ruler, Users, Map, Camera,
  QrCode, PenTool, Calculator, HardDrive, Wifi,
  Globe, ExternalLink, Globe2, GlobeCheck
} from 'lucide-react'

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

const coreServices = [
  {
    icon: ClipboardCheck,
    title: 'Digital Site Surveys',
    desc: 'GPS-enabled surveys with real-time tracking, geofencing, and automated report generation. Conduct thorough site assessments from your mobile device.',
    features: ['GPS & Geofencing', 'Photo Documentation', 'Digital Checklists', 'Auto-Reports'],
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: BarChart3,
    title: 'Project Management',
    desc: 'End-to-end project lifecycle management with live dashboards, milestone tracking, and team coordination across all your construction sites.',
    features: ['Live Dashboards', 'Milestone Tracking', 'Team Coordination', 'Progress Reports'],
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    icon: FileText,
    title: 'BOQ & Cost Estimation',
    desc: 'Automated bill of quantities, cost estimation, and budget optimization with real-time variance analysis and procurement tracking.',
    features: ['Auto BOQ Generation', 'Cost Tracking', 'Budget Alerts', 'Variance Analysis'],
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: 'Quality Assurance',
    desc: 'Systematic quality checks with digital checklists, photo documentation, and multi-level approval workflows for zero-defect construction.',
    features: ['Digital Checklists', 'Photo Evidence', 'Multi-Level Approvals', 'Audit Trails'],
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: Ruler,
    title: 'Measurement Tracking',
    desc: 'Track executed vs planned quantities with GPS verification, progress photos, and detailed measurement logs for accurate billing.',
    features: ['Planned vs Actual', 'GPS Verification', 'Progress Photos', 'Quantity Logs'],
    color: 'from-rose-500 to-rose-700',
  },
  {
    icon: Users,
    title: 'Team & Workforce',
    desc: 'Real-time field workforce management with GPS tracking, task assignments, role-based access, and attendance monitoring.',
    features: ['GPS Tracking', 'Task Management', 'Role-Based Access', 'Attendance'],
    color: 'from-teal-500 to-teal-700',
  },
]

const additionalFeatures = [
  { icon: Camera, title: 'Photo Management', desc: 'Upload, organize, and manage site photos with metadata tagging' },
  { icon: Map, title: 'GPS Tracking', desc: 'Real-time location tracking with geofencing and history' },
  { icon: QrCode, title: 'QR Code Scanning', desc: 'Instant asset and material identification via QR codes' },
  { icon: PenTool, title: 'Digital Signatures', desc: 'Legally valid digital signatures for approvals and sign-offs' },
  { icon: Calculator, title: 'Quotation Engine', desc: 'Generate professional quotations with item-level pricing' },
  { icon: HardDrive, title: 'Document Vault', desc: 'Centralized document management with version control' },
  { icon: Wifi, title: 'Offline Mode', desc: 'Work without internet — data syncs automatically when back online' },
  { icon: FileText, title: 'Report Generation', desc: 'Auto-generate PDF reports with charts, photos, and data' },
]

export default function ServicesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${scrolled ? 'bg-blue-600' : 'bg-white/20 backdrop-blur-sm'}`}><HardHat className="h-6 w-6 text-white" /></div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>BuildSurvey Pro</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }].map(item => (
                <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors ${scrolled ? (item.href === '/services' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600') : (item.href === '/services' ? 'text-white' : 'text-white/80 hover:text-white')}`}>
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all">Login</Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} /> : <Menu className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-xl"><div className="px-4 py-4 space-y-2">
            {[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }].map(item => (
              <Link key={item.href} href={item.href} className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/login" className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white mt-2" onClick={() => setMobileMenuOpen(false)}>Login to Dashboard</Link>
          </div></div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <FadeInSection>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">Our Services</span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">Everything You Need to<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Manage Construction</span></h1>
            <p className="mt-6 text-xl text-blue-100/60 max-w-2xl">From site surveys to project completion — one platform to manage it all with GPS tracking, digital workflows, and real-time insights.</p>
          </FadeInSection>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Core Services</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Powerful Tools for Every Phase</h2>
              <p className="mt-4 text-lg text-gray-600">Six integrated modules covering every aspect of construction management.</p>
            </div>
          </FadeInSection>
          <div className="mt-16 space-y-8">
            {coreServices.map((service, i) => (
              <FadeInSection key={service.title} delay={i * 100}>
                <div className={`rounded-2xl border border-gray-100 p-8 sm:p-10 hover:shadow-xl transition-all duration-300 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                  <div className={`grid gap-8 lg:grid-cols-2 items-center ${i % 2 !== 0 ? 'lg:direction-rtl' : ''}`}>
                    <div className={i % 2 !== 0 ? 'lg:order-2' : ''}>
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} shadow-lg`}>
                        <service.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-gray-900">{service.title}</h3>
                      <p className="mt-4 text-gray-600 leading-relaxed">{service.desc}</p>
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        {service.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${service.color} p-10 flex items-center justify-center min-h-[240px] ${i % 2 !== 0 ? 'lg:order-1' : ''}`}>
                      <service.icon className="h-24 w-24 text-white/20" />
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">And More</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Additional Capabilities</h2>
              <p className="mt-4 text-lg text-gray-600">Powerful features that complement our core modules.</p>
            </div>
          </FadeInSection>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {additionalFeatures.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 80}>
                <div className="rounded-2xl bg-white p-6 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <f.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 p-12 sm:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to See It in Action?</h2>
                <p className="mt-4 text-lg text-blue-100/70 max-w-xl mx-auto">Get a personalized demo and see how BuildSurvey Pro can transform your construction operations.</p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-xl hover:bg-blue-50 transition-all">
                    Start Free Trial <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                    Request Demo
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><HardHat className="h-6 w-6 text-white" /></div>
                <span className="text-lg font-bold text-white">BuildSurvey Pro</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">Enterprise construction site survey and project management platform.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Platform</h3>
              <ul className="mt-4 space-y-3">
                {['Site Surveys', 'Project Management', 'BOQ & Estimation', 'Quality Assurance', 'GPS Tracking'].map(item => (
                  <li key={item}><Link href="/services" className="text-sm hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
              <ul className="mt-4 space-y-3">
                {[{ label: 'About Us', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }, { label: 'Login', href: '/login' }].map(item => (
                  <li key={item.label}><Link href={item.href} className="text-sm hover:text-white transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Nagpur, Maharashtra, India</li>
                <li className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 shrink-0" /> +91 98765 43210</li>
                <li className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 shrink-0" /> info@buildsurvey.in</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} BuildSurvey Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
