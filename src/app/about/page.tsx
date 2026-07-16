'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HardHat, Menu, X, ArrowRight, Target, Eye, Heart, Award, Building2,
  Phone, Mail, MapPin, Globe, ExternalLink, Globe2, GlobeCheck
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

const milestones = [
  { year: '2018', title: 'Founded', desc: 'Started with a vision to digitize construction site management in India.' },
  { year: '2019', title: 'First 50 Projects', desc: 'Reached 50 active projects across Maharashtra and Madhya Pradesh.' },
  { year: '2020', title: 'GPS Tracking Launch', desc: 'Introduced real-time GPS tracking with geofencing for field teams.' },
  { year: '2021', title: 'Enterprise Expansion', desc: 'Expanded to serve major developers like DLF, Tata, and L&T.' },
  { year: '2022', title: 'AI Integration', desc: 'Added AI-powered cost estimation and predictive analytics.' },
  { year: '2023', title: '200+ Projects', desc: 'Crossed 200 completed projects with ₹500Cr+ value managed.' },
  { year: '2024', title: 'Pan-India Presence', desc: 'Now serving clients across 15+ states with 50+ team members.' },
]

const values = [
  { icon: Target, title: 'Precision', desc: 'Every measurement, every data point — accuracy is non-negotiable.' },
  { icon: Eye, title: 'Transparency', desc: 'Real-time visibility into every aspect of your construction projects.' },
  { icon: Heart, title: 'Commitment', desc: 'We succeed when our clients succeed. Your deadlines are our deadlines.' },
  { icon: Award, title: 'Excellence', desc: 'We set the bar high and continuously push boundaries in construction tech.' },
]

const team = [
  { name: 'Ashish Kumar', role: 'Founder & CEO', initials: 'AK' },
  { name: 'Saurabh Singh', role: 'CTO', initials: 'SS' },
  { name: 'Priya Sharma', role: 'Head of Operations', initials: 'PS' },
  { name: 'Raj Mehta', role: 'Lead Engineer', initials: 'RM' },
]

export default function AboutPage() {
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
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>BuildSurvey Pro</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }].map(item => (
                <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors ${scrolled ? (item.href === '/about' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600') : (item.href === '/about' ? 'text-white' : 'text-white/80 hover:text-white')}`}>
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
          <div className="md:hidden bg-white border-t shadow-xl">
            <div className="px-4 py-4 space-y-2">
              {[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }].map(item => (
                <Link key={item.href} href={item.href} className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
              ))}
              <Link href="/login" className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white mt-2" onClick={() => setMobileMenuOpen(false)}>Login to Dashboard</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <FadeInSection>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">About Us</span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">Building the Future of<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Construction Management</span></h1>
            <p className="mt-6 text-xl text-blue-100/60 max-w-2xl">We&apos;re on a mission to digitize India&apos;s construction industry with smart, data-driven tools that save time, reduce costs, and improve quality.</p>
          </FadeInSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <FadeInSection>
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Our Story</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">From Field Observations to Digital Transformation</h2>
              <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                <p>Founded in 2018, BuildSurvey Pro was born from a simple observation: construction companies in India were still relying on paper-based surveys, manual reporting, and fragmented communication tools.</p>
                <p>Our founders, with decades of combined experience in construction and technology, saw an opportunity to bring enterprise-grade digital tools to an industry that desperately needed them.</p>
                <p>Today, we serve 200+ projects across India, helping companies like DLF, Tata Projects, and L&T manage their construction operations with unprecedented efficiency and visibility.</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  { value: '7+', label: 'Years of Excellence' },
                  { value: '200+', label: 'Projects Delivered' },
                  { value: '15+', label: 'States Covered' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-blue-600">{s.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeInSection>
            <FadeInSection delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-3xl blur-2xl opacity-50" />
                <div className="relative rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a3a5c] p-12 text-white">
                  <Building2 className="h-16 w-16 text-blue-400 mb-6" />
                  <h3 className="text-2xl font-bold">Our Vision</h3>
                  <p className="mt-4 text-blue-100/70 leading-relaxed">To become India&apos;s most trusted construction management platform, powering every project from foundation to handover with intelligent, data-driven tools.</p>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center"><Target className="h-6 w-6 text-blue-400" /></div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center"><Eye className="h-6 w-6 text-blue-400" /></div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center"><Heart className="h-6 w-6 text-blue-400" /></div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Our Journey</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Milestones That Define Us</h2>
            </div>
          </FadeInSection>
          <div className="mt-16 relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200" />
            {milestones.map((m, i) => (
              <FadeInSection key={m.year} delay={i * 100}>
                <div className="relative flex items-start gap-8 pb-12 last:pb-0">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30">
                    {m.year}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-gray-900">{m.title}</h3>
                    <p className="mt-2 text-gray-600">{m.desc}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Our Values</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">What Drives Us</h2>
            </div>
          </FadeInSection>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <FadeInSection key={v.title} delay={i * 100}>
                <div className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    <v.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{v.title}</h3>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Our Team</span>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Meet the People Behind the Platform</h2>
            </div>
          </FadeInSection>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <FadeInSection key={member.name} delay={i * 100}>
                <div className="text-center group">
                  <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-4xl font-bold text-white/90">{member.initials}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-gray-900">{member.name}</h3>
                  <p className="mt-1 text-sm text-blue-600 font-medium">{member.role}</p>
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
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Join Our Growing Team</h2>
                <p className="mt-4 text-lg text-blue-100/70 max-w-xl mx-auto">We&apos;re always looking for talented people who share our passion for construction technology.</p>
                <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-xl hover:bg-blue-50 transition-all">
                  Get in Touch <ArrowRight className="h-5 w-5" />
                </Link>
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
              <div className="mt-6 flex gap-3">
                {[Globe, ExternalLink, Globe2, GlobeCheck].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all"><Icon className="h-4 w-4" /></a>
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
