'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HardHat, Menu, X, ArrowRight, Phone, Mail, MapPin, Clock, Send,
  MessageSquare, Globe, ExternalLink, Globe2, GlobeCheck
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

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
    setFormData({ name: '', email: '', phone: '', company: '', subject: '', message: '' })
  }

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
                <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors ${scrolled ? (item.href === '/contact' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600') : (item.href === '/contact' ? 'text-white' : 'text-white/80 hover:text-white')}`}>
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
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <FadeInSection>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">Contact Us</span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">Let&apos;s Build<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Something Great Together</span></h1>
            <p className="mt-6 text-xl text-blue-100/60 max-w-2xl">Have a question or ready to get started? We&apos;d love to hear from you.</p>
          </FadeInSection>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 -mt-24 relative z-10">
            {[
              { icon: MapPin, title: 'Office Address', lines: ['Nagpur, Maharashtra', 'India 440001'], color: 'from-blue-500 to-blue-700' },
              { icon: Phone, title: 'Phone', lines: ['+91 98765 43210', '+91 72000 12345'], color: 'from-emerald-500 to-emerald-700' },
              { icon: Mail, title: 'Email', lines: ['info@buildsurvey.in', 'support@buildsurvey.in'], color: 'from-amber-500 to-orange-600' },
              { icon: Clock, title: 'Business Hours', lines: ['Mon - Sat: 9AM - 6PM', 'Sunday: Closed'], color: 'from-purple-500 to-purple-700' },
            ].map((info, i) => (
              <FadeInSection key={info.title} delay={i * 100}>
                <div className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-shadow">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${info.color} shadow-lg`}>
                    <info.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900">{info.title}</h3>
                  {info.lines.map(line => (
                    <p key={line} className="mt-1 text-sm text-gray-600">{line}</p>
                  ))}
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Form */}
            <FadeInSection>
              <div className="rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Send Us a Message</h2>
                    <p className="text-sm text-gray-500">We&apos;ll respond within 24 hours</p>
                  </div>
                </div>

                {submitted && (
                  <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700 text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" /> Thank you! Your message has been sent. We&apos;ll get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                      <div className="flex gap-2">
                        <select className="rounded-xl border border-gray-200 px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>+91</option>
                          <option>+1</option>
                          <option>+44</option>
                          <option>+971</option>
                        </select>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your company"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                    <select
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option>Demo Request</option>
                      <option>Pricing Inquiry</option>
                      <option>Technical Support</option>
                      <option>Partnership</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="Tell us about your project or question..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </form>
              </div>
            </FadeInSection>

            {/* Map & Info */}
            <FadeInSection delay={200}>
              <div className="space-y-8">
                {/* Map placeholder */}
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 h-[320px] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                    <p className="text-blue-400 font-medium">Nagpur, Maharashtra, India</p>
                    <p className="text-sm text-blue-300 mt-1">440001</p>
                  </div>
                </div>

                {/* Quick Contact */}
                <div className="rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a3a5c] p-8 text-white">
                  <h3 className="text-xl font-bold">Prefer to Talk Directly?</h3>
                  <p className="mt-2 text-blue-100/60 text-sm">Our team is available Monday through Saturday.</p>
                  <div className="mt-6 space-y-4">
                    <a href="tel:+919876543210" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><Phone className="h-5 w-5" /></div>
                      <div>
                        <div className="text-sm font-medium">Call Us</div>
                        <div className="text-xs text-white/50">+91 98765 43210</div>
                      </div>
                    </a>
                    <a href="mailto:info@buildsurvey.in" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><Mail className="h-5 w-5" /></div>
                      <div>
                        <div className="text-sm font-medium">Email Us</div>
                        <div className="text-xs text-white/50">info@buildsurvey.in</div>
                      </div>
                    </a>
                    <a href="#" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <div className="text-sm font-medium">Visit Us</div>
                        <div className="text-xs text-white/50">Nagpur, Maharashtra, India</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Social */}
                <div className="rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900">Follow Us</h3>
                  <div className="mt-4 flex gap-3">
                    {[Globe, ExternalLink, Globe2, GlobeCheck].map((Icon, i) => (
                      <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all">
                        <Icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
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
