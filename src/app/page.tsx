'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HardHat, MapPin, BarChart3, FileText, Shield, Users, Phone, Mail,
  Menu, X, ChevronRight, Building2, ClipboardCheck, Ruler, ArrowRight,
  Star, Award, TrendingUp, Clock, Target, Zap,
  Globe, ExternalLink, Globe2, GlobeCheck, ChevronDown
} from 'lucide-react'

function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <div ref={ref}>{count}{suffix}</div>
}

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const services = [
  { icon: ClipboardCheck, title: 'Site Surveys', desc: 'GPS-enabled digital surveys with real-time tracking, geofencing, and automated reporting for accurate site assessments.', color: 'from-blue-500 to-blue-700' },
  { icon: BarChart3, title: 'Project Management', desc: 'End-to-end project lifecycle management with live dashboards, milestone tracking, and team coordination.', color: 'from-emerald-500 to-emerald-700' },
  { icon: FileText, title: 'BOQ & Estimation', desc: 'Automated bill of quantities, cost estimation, and budget optimization with real-time variance analysis.', color: 'from-amber-500 to-orange-600' },
  { icon: Shield, title: 'Quality Assurance', desc: 'Systematic quality checks with digital checklists, photo documentation, and multi-level approval workflows.', color: 'from-purple-500 to-purple-700' },
  { icon: Ruler, title: 'Measurements', desc: 'Track executed vs planned quantities with GPS verification, progress photos, and detailed measurement logs.', color: 'from-rose-500 to-rose-700' },
  { icon: Users, title: 'Team Collaboration', desc: 'Real-time messaging, task assignments, role-based access, and field workforce management with GPS tracking.', color: 'from-teal-500 to-teal-700' },
]

const projects = [
  { title: 'DLF Cyber City Tower', category: 'Commercial', value: '₹85 Cr', area: '2.5 Lakh sq.ft', color: 'from-slate-800 to-slate-900' },
  { title: 'Tata Primanti Residences', category: 'Residential', value: '₹120 Cr', area: '4.2 Lakh sq.ft', color: 'from-blue-900 to-blue-950' },
  { title: 'L&T Metro Rail Station', category: 'Infrastructure', value: '₹200 Cr', area: '1.8 Lakh sq.ft', color: 'from-emerald-900 to-emerald-950' },
]

const testimonials = [
  { name: 'Rajesh Kumar', role: 'Project Director, DLF Ltd', quote: 'BuildSurvey Pro transformed how we manage our construction projects. The GPS tracking and digital surveys saved us 40% in field reporting time.', rating: 5 },
  { name: 'Priya Sharma', role: 'VP Operations, Tata Projects', quote: 'The real-time dashboards and automated BOQ generation have been game-changers for our estimation accuracy. Highly recommended.', rating: 5 },
  { name: 'Amit Patel', role: 'Head of Quality, L&T Construction', quote: 'The multi-level approval workflows and digital checklists ensured zero quality issues across our last 5 projects.', rating: 5 },
]

export default function HomePage() {
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
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${scrolled ? 'bg-blue-600' : 'bg-white/20 backdrop-blur-sm'}`}>
                <HardHat className={`h-6 w-6 ${scrolled ? 'text-white' : 'text-white'}`} />
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>BuildSurvey Pro</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Services', href: '/services' },
                { label: 'Contact', href: '/contact' },
              ].map(item => (
                <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}>
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all">
                Login
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} /> : <Menu className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-xl">
            <div className="px-4 py-4 space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Services', href: '/services' },
                { label: 'Contact', href: '/contact' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white mt-2" onClick={() => setMobileMenuOpen(false)}>
                Login to Dashboard
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 40%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-4 py-2 mb-8">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-300">Enterprise Construction Platform</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Build Smarter.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mt-2">Build Better.</span>
            </h1>
            <p className="mt-8 text-xl text-blue-100/70 max-w-2xl leading-relaxed">
              The all-in-one enterprise platform for construction site surveys, project management, team coordination, and field operations. Trusted by 200+ projects across India.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/40" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-20 z-10 mx-auto max-w-6xl px-4">
        <FadeInSection>
          <div className="rounded-2xl bg-white shadow-2xl shadow-gray-200/50 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 200, suffix: '+', label: 'Projects Completed', icon: Building2 },
              { value: 50, suffix: '+', label: 'Expert Team Members', icon: Users },
              { value: 500, suffix: 'Cr+', label: 'Project Value Managed', icon: TrendingUp, prefix: '₹' },
              { value: 98, suffix: '%', label: 'On-Time Delivery', icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stat.prefix || ''}<CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">What We Offer</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">Powerful Features for Modern Construction</h2>
              <p className="mt-4 text-lg text-gray-600">Everything you need to manage surveys, projects, teams, and finances in one unified platform.</p>
            </div>
          </FadeInSection>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <FadeInSection key={service.title} delay={i * 100}>
                <div className="group relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} shadow-lg`}>
                    <service.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{service.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm">Learn more</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Our Work</span>
                <h2 className="mt-3 text-4xl font-bold text-gray-900">Featured Projects</h2>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                View All Projects <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeInSection>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {projects.map((project, i) => (
              <FadeInSection key={project.title} delay={i * 150}>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white min-h-[320px] flex flex-col justify-end">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                      {project.category}
                    </span>
                  </div>
                  <div className="relative">
                    <h3 className="text-2xl font-bold">{project.title}</h3>
                    <div className="mt-4 flex items-center gap-6 text-sm text-white/70">
                      <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {project.value}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {project.area}</span>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">Why BuildSurvey Pro</span>
              <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Trusted by Industry Leaders</h2>
              <p className="mt-4 text-lg text-blue-100/60">We combine cutting-edge technology with deep construction expertise to deliver unmatched results.</p>
            </div>
          </FadeInSection>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: 'Precision Surveys', desc: 'GPS-enabled with geofencing for accurate site assessments' },
              { icon: Zap, title: 'Real-Time Data', desc: 'Live dashboards and instant field reporting' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Role-based access with complete audit trails' },
              { icon: Award, title: 'Proven Track Record', desc: '200+ successful projects worth ₹500Cr+' },
            ].map((item, i) => (
              <FadeInSection key={item.title} delay={i * 100}>
                <div className="text-center p-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <item.icon className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-blue-100/50">{item.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Client Stories</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">What Our Clients Say</h2>
            </div>
          </FadeInSection>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeInSection key={t.name} delay={i * 150}>
                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden p-12 sm:p-16 text-center">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Transform Your Construction Projects?</h2>
                <p className="mt-4 text-lg text-blue-100/70 max-w-2xl mx-auto">Join 200+ projects already using BuildSurvey Pro to manage surveys, track progress, and deliver on time.</p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-xl hover:bg-blue-50 transition-all">
                    Start Free Trial <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                    Talk to Sales
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <HardHat className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-white">BuildSurvey Pro</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">Enterprise construction site survey and project management platform. Trusted by industry leaders across India.</p>
              <div className="mt-6 flex gap-3">
                {[Globe, ExternalLink, Globe2, GlobeCheck].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
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
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Services', href: '/services' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'Careers', href: '/about' },
                  { label: 'Login', href: '/login' },
                ].map(item => (
                  <li key={item.label}><Link href={item.href} className="text-sm hover:text-white transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Nagpur, Maharashtra, India
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 shrink-0" /> +91 98765 43210
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 shrink-0" /> info@buildsurvey.in
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} BuildSurvey Pro. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
