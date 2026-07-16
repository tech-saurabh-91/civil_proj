'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HardHat, MapPin, BarChart3, FileText, Shield, Users, Phone, Mail, Menu, X, ChevronRight, Building2, ClipboardCheck, Ruler } from 'lucide-react'

const features = [
  { icon: MapPin, title: 'GPS-Enabled Surveys', desc: 'Real-time field tracking with geofencing and site visit verification' },
  { icon: BarChart3, title: 'Live Dashboards', desc: 'Project progress, budgets, and KPIs at a glance' },
  { icon: FileText, title: 'BOQ & Estimations', desc: 'Automated bill of quantities and cost estimation' },
  { icon: ClipboardCheck, title: 'Digital Checklists', desc: 'Field checklists with photo documentation and signatures' },
  { icon: Shield, title: 'Approval Workflows', desc: 'Configurable multi-level approval chains with audit trails' },
  { icon: Ruler, title: 'Measurements', desc: 'Track executed vs planned quantities with variance analysis' },
]

const stats = [
  { value: '200+', label: 'Projects Managed' },
  { value: '50+', label: 'Team Members' },
  { value: '₹500Cr+', label: 'Project Value' },
  { value: '98%', label: 'On-Time Delivery' },
]

const services = [
  { title: 'Project Management', desc: 'End-to-end project lifecycle management from planning to handover' },
  { title: 'Cost Consultancy', desc: 'BOQ preparation, cost estimation, and budget optimization' },
  { title: 'Site Surveys', desc: 'Digital survey management with GPS tracking and real-time reporting' },
  { title: 'Quality Assurance', desc: 'Systematic quality checks with digital checklists and documentation' },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HardHat className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">BuildSurvey Pro</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Home</a>
              <a href="#about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">About</a>
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Services</a>
              <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Contact</a>
              <Link href="/login" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition">
                Login
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 pb-4 pt-2">
            <a href="#home" className="block py-2 text-sm font-medium text-gray-600">Home</a>
            <a href="#about" className="block py-2 text-sm font-medium text-gray-600">About</a>
            <a href="#services" className="block py-2 text-sm font-medium text-gray-600">Services</a>
            <a href="#contact" className="block py-2 text-sm font-medium text-gray-600">Contact</a>
            <Link href="/login" className="mt-2 block w-full text-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Login</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNnY2aDJ2Mmg0di0yem0wLTR2MmgtMnYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Enterprise Construction Survey & Project Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Manage projects, surveys, teams, and field operations in one powerful platform. 
              GPS-enabled surveys, real-time tracking, digital checklists, and automated workflows.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link href="/login" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition">
                Get Started
              </Link>
              <a href="#about" className="text-sm font-semibold leading-6 text-white border border-white/30 rounded-lg px-6 py-3 hover:bg-white/10 transition">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                About BuildSurvey Pro
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                BuildSurvey Pro is an enterprise-grade construction site survey and project management platform 
                designed for the Indian construction industry. We help construction companies manage their 
                entire project lifecycle — from lead generation to project completion.
              </p>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Our platform combines GPS-enabled field surveys, digital checklists, real-time tracking, 
                automated BOQ generation, multi-level approval workflows, and comprehensive reporting — 
                all in one unified system.
              </p>
              <div className="mt-8">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
                  Start Free Trial <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                  <f.icon className="h-8 w-8 text-blue-600" />
                  <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Services</h2>
            <p className="mt-3 text-lg text-gray-600">Comprehensive construction management solutions</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <Building2 className="h-10 w-10 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Contact Us</h2>
            <p className="mt-3 text-lg text-gray-600">Get in touch with our team</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-xl border border-gray-200">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto" />
              <h3 className="mt-3 font-semibold text-gray-900">Address</h3>
              <p className="mt-1 text-sm text-gray-600">Nagpur, Maharashtra, India</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200">
              <Phone className="h-8 w-8 text-blue-600 mx-auto" />
              <h3 className="mt-3 font-semibold text-gray-900">Phone</h3>
              <p className="mt-1 text-sm text-gray-600">+91 98765 43210</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200">
              <Mail className="h-8 w-8 text-blue-600 mx-auto" />
              <h3 className="mt-3 font-semibold text-gray-900">Email</h3>
              <p className="mt-1 text-sm text-gray-600">info@buildsurvey.in</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <HardHat className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold text-white">BuildSurvey Pro</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} BuildSurvey Pro. All rights reserved.</p>
            <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 transition">
              Admin Login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
