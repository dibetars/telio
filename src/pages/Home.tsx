import { useNavigate } from 'react-router-dom'
import {
  Heart, Users, Clock, Shield, Video, MessageCircle,
  Activity, Star, CheckCircle, Building2, ChevronRight,
} from 'lucide-react'
import { TelioLogoFull } from '../components/TelioLogo'

const services = [
  { icon: Video,          title: 'Video Consultations',  desc: 'HD video calls with verified doctors — no downloads, no waiting rooms.' },
  { icon: Activity,       title: 'Primary Care',          desc: 'Routine checkups, referrals, and preventative care on your schedule.' },
  { icon: Heart,          title: 'Mental Health',         desc: 'Connect with therapists and psychiatrists in a safe, private space.' },
  { icon: Shield,         title: 'Chronic Conditions',    desc: 'Ongoing support for diabetes, hypertension, and long-term health needs.' },
  { icon: Users,          title: 'Specialist Access',     desc: 'Cardiology, dermatology, women\'s health, and more in one platform.' },
  { icon: MessageCircle,  title: 'Secure Messaging',      desc: 'Follow up with your doctor anytime — no appointment required.' },
]

const stats = [
  { value: '50+',  label: 'Verified Specialists' },
  { value: '24/7', label: 'Care Availability' },
  { value: '100%', label: 'HIPAA Compliant' },
  { value: '<30m', label: 'Avg. Wait Time' },
]

const navLinks = [
  { label: 'For Patients',      href: '#patients' },
  { label: 'For Providers',     href: '#providers' },
  { label: 'For Organizations', href: '#organizations' },
]

const providerBenefits = [
  'Set your own availability and consultation fees',
  'Integrated scheduling and automated reminders',
  'Secure HD video + real-time messaging with patients',
  'Digital medical records and appointment history',
]

const orgBenefits = [
  'Unified dashboard for all your doctors',
  'Full patient visibility across the network',
  'Appointment and consultation analytics',
  'Invite and onboard providers in seconds',
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Navigation ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <TelioLogoFull size="md" variant="dark" />

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Doctors available now
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Better health
                <span className="block text-brand-600">starts here.</span>
              </h1>

              <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
                Connect with board-certified doctors, therapists, and specialists through
                secure video — any device, any time, no commute required.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-brand-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                >
                  Get care now <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/doctors')}
                  className="border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:border-brand-400 hover:text-brand-700 transition-colors"
                >
                  Browse doctors
                </button>
              </div>

              <p className="mt-4 text-sm text-gray-400">No insurance required · Cancel anytime</p>
            </div>

            {/* Right — floating card cluster */}
            <div className="relative hidden lg:flex items-center justify-center h-[420px]">
              {/* Background circle */}
              <div className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-br from-brand-100 to-brand-200 opacity-50" />

              {/* Appointment card */}
              <div className="relative z-10 bg-white rounded-2xl shadow-xl p-5 w-64 -mt-20 ml-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Video Consultation</p>
                    <p className="text-xs text-gray-400">Today, 3:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 font-medium">Doctor is ready</span>
                </div>
              </div>

              {/* Review card */}
              <div className="absolute z-10 bg-white rounded-2xl shadow-xl p-4 w-52 bottom-8 left-2">
                <div className="flex items-center gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">"Quick, convenient, and the doctor was amazing."</p>
                <p className="text-xs text-gray-400 mt-1">— Verified patient</p>
              </div>

              {/* Availability badge */}
              <div className="absolute z-10 bg-brand-600 text-white rounded-2xl shadow-xl p-4 w-36 top-6 right-6">
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-xs text-brand-200 mt-0.5">Care available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-brand-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map(s => (
              <div key={s.value}>
                <p className="text-4xl font-extrabold">{s.value}</p>
                <p className="text-brand-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services / Care Types ── */}
      <section id="patients" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Comprehensive virtual care
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to manage your health — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all group cursor-pointer"
                onClick={() => navigate('/register')}
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <s.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                <span className="text-sm text-brand-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Providers ── */}
      <section id="providers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">For Providers</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                Practice on your terms
              </h2>
              <p className="text-lg text-gray-500 mb-6 leading-relaxed">
                Set your own hours, manage your schedule, and deliver care from anywhere.
                Telio Health gives you the tools to run a modern, efficient practice.
              </p>
              <ul className="space-y-3 mb-8">
                {providerBenefits.map(item => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              >
                Join as a provider
              </button>
            </div>

            {/* Mock provider stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Appointments', value: '248',   bg: 'bg-brand-50',   text: 'text-brand-700' },
                { label: 'Avg. Rating',         value: '4.9 ★', bg: 'bg-green-50',   text: 'text-green-700' },
                { label: 'Monthly Revenue',     value: '$3,840', bg: 'bg-amber-50',  text: 'text-amber-700' },
                { label: 'New Patients',         value: '14',   bg: 'bg-purple-50',  text: 'text-purple-700' },
              ].map(card => (
                <div key={card.label} className={`${card.bg} ${card.text} rounded-2xl p-6`}>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm mt-1 opacity-70">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For Organizations ── */}
      <section id="organizations" className="py-20 bg-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <span className="text-sm font-semibold text-brand-300 uppercase tracking-wider">For Healthcare Organizations</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
                Scale care across your entire network
              </h2>
              <p className="text-lg text-brand-200 mb-6 leading-relaxed">
                Whether you're a hospital network, clinic group, or health plan —
                Telio Health gives you a single platform to manage doctors, patients,
                and outcomes at scale.
              </p>
              <ul className="space-y-3 mb-8">
                {orgBenefits.map(item => (
                  <li key={item} className="flex items-start gap-3 text-brand-100">
                    <CheckCircle className="h-5 w-5 text-brand-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
              >
                Partner with us
              </button>
            </div>

            {/* Mock org dashboard preview */}
            <div className="bg-brand-700/40 backdrop-blur rounded-2xl p-6 border border-brand-600/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-brand-500/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-brand-300" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Organization Dashboard</p>
                  <p className="text-brand-300 text-xs">Live overview</p>
                </div>
              </div>
              {[
                { label: 'Active Doctors',      value: '12' },
                { label: 'Patients Served',     value: '847' },
                { label: 'Appointments Today',  value: '34' },
                { label: 'Avg. Patient Rating', value: '4.8 / 5' },
                { label: 'Consultations (MTD)', value: '312' },
              ].map(row => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-3 border-b border-brand-600/40 last:border-0"
                >
                  <span className="text-brand-300 text-sm">{row.label}</span>
                  <span className="text-white font-semibold text-sm">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Join patients, providers, and healthcare organizations already
            transforming care with Telio Health.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Create free account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <TelioLogoFull size="sm" variant="light" />
              <p className="text-sm mt-3 leading-relaxed">
                Making healthcare accessible, convenient, and secure for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Find a Doctor</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Book Appointment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Medical Records</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">For Providers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Join Our Network</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Provider Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">For Organizations</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Partner With Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            <p>&copy; 2026 Telio Health. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
