import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Organization, OrgProviderDetail, Appointment } from '../types'
import {
  Building2, Users, Calendar, BarChart3,
  Plus, Trash2, Search, CheckCircle2, Clock,
  Stethoscope, UserCheck, TrendingUp, Mail,
  ChevronRight, Loader2, X,
} from 'lucide-react'
import { cn } from '../lib/utils'

type Tab = 'overview' | 'doctors' | 'patients' | 'appointments'

interface Patient { id: string; name: string; email: string; appointmentCount: number }

export default function OrgDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialTab = (searchParams.get('tab') as Tab) || 'overview'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [org, setOrg] = useState<Organization | null>(null)
  const [doctors, setDoctors] = useState<OrgProviderDetail[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Doctor search / add state
  const [doctorSearch, setDoctorSearch] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Patient / appointment search
  const [patientSearch, setPatientSearch] = useState('')
  const [apptSearch, setApptSearch] = useState('')
  const [apptFilter, setApptFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  // Sync tab from query param
  useEffect(() => {
    const t = searchParams.get('tab') as Tab
    if (t) setTab(t)
  }, [searchParams])

  const fetchAll = async () => {
    setLoading(true)
    try {
      // 1. Org record
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (orgErr) throw orgErr
      setOrg(orgData)

      // 2. Doctors via view
      const { data: docData } = await supabase
        .from('org_provider_details')
        .select('*')
        .eq('org_id', orgData.id)
      const docs = (docData || []) as OrgProviderDetail[]
      setDoctors(docs)

      // 3. Appointments for all org providers (flat — no joins)
      const providerIds = docs.map((d) => d.provider_id)
      if (providerIds.length > 0) {
        const { data: apptData } = await supabase
          .from('appointments')
          .select('id, appointment_date, status, reason, patient_id, provider_id')
          .in('provider_id', providerIds)
          .order('appointment_date', { ascending: false })
        const appts = (apptData || []) as any[]

        // 4. Fetch patient profiles separately (requires org_can_see_patients policy)
        const patientIds = [...new Set(appts.map((a) => a.patient_id))]
        let patientMap: Record<string, { name: string; email: string }> = {}
        if (patientIds.length > 0) {
          const { data: patientUsers } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', patientIds)
          for (const u of patientUsers || []) {
            patientMap[u.id] = { name: u.name, email: u.email }
          }
        }

        // 5. Fetch doctor names separately
        const doctorUserIds = docs.map((d) => d.user_id).filter(Boolean)
        let doctorMap: Record<string, string> = {}
        if (doctorUserIds.length > 0) {
          const { data: doctorUsers } = await supabase
            .from('users')
            .select('id, name')
            .in('id', doctorUserIds)
          for (const u of doctorUsers || []) doctorMap[u.id] = u.name
        }

        // Enrich appointments with names
        const enriched = appts.map((a) => ({
          ...a,
          users: patientMap[a.patient_id] || { name: 'Unknown', email: '' },
          providers: {
            users: { name: doctorMap[docs.find((d) => d.provider_id === a.provider_id)?.user_id || ''] || '' }
          },
        }))
        setAppointments(enriched)

        // 6. Derive unique patients
        const patientsMap = new Map<string, Patient>()
        for (const a of appts) {
          const info = patientMap[a.patient_id]
          if (!patientsMap.has(a.patient_id)) {
            patientsMap.set(a.patient_id, {
              id: a.patient_id,
              name: info?.name || 'Unknown',
              email: info?.email || '',
              appointmentCount: 0,
            })
          }
          patientsMap.get(a.patient_id)!.appointmentCount++
        }
        setPatients(Array.from(patientsMap.values()))
      }
    } catch (err) {
      console.error('OrgDashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoctor = async () => {
    if (!addEmail.trim() || !org) return
    setAdding(true)
    setAddError('')
    try {
      // Find user by email with provider role
      const { data: targetUser, error: uErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', addEmail.trim().toLowerCase())
        .eq('role', 'provider')
        .single()
      if (uErr || !targetUser) { setAddError('No provider found with that email.'); return }

      // Get provider record
      const { data: provRecord, error: pErr } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', targetUser.id)
        .single()
      if (pErr || !provRecord) { setAddError('Provider profile not found.'); return }

      // Insert junction record
      const { error: jErr } = await supabase
        .from('org_providers')
        .insert({ org_id: org.id, provider_id: provRecord.id })
      if (jErr) {
        if (jErr.code === '23505') setAddError('This doctor is already in your organization.')
        else setAddError(jErr.message)
        return
      }

      setAddEmail('')
      setShowAddForm(false)
      await fetchAll()
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveDoctor = async (providerId: string) => {
    if (!org) return
    await supabase
      .from('org_providers')
      .delete()
      .eq('org_id', org.id)
      .eq('provider_id', providerId)
    await fetchAll()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const now = new Date()
  const upcomingAppts = appointments.filter((a) => new Date(a.appointment_date) >= now)
  const pastAppts = appointments.filter((a) => new Date(a.appointment_date) < now)

  const filteredAppts =
    apptFilter === 'upcoming' ? upcomingAppts
    : apptFilter === 'past' ? pastAppts
    : appointments

  const searchedAppts = filteredAppts.filter((a: any) =>
    !apptSearch ||
    a.users?.name?.toLowerCase().includes(apptSearch.toLowerCase()) ||
    a.providers?.users?.name?.toLowerCase().includes(apptSearch.toLowerCase())
  )

  const filteredDoctors = doctors.filter((d) =>
    !doctorSearch || d.provider_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  )

  const filteredPatients = patients.filter((p) =>
    !patientSearch ||
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',      label: 'Overview',      icon: BarChart3 },
    { id: 'doctors',       label: 'Doctors',        icon: Stethoscope },
    { id: 'patients',      label: 'Patients',       icon: Users },
    { id: 'appointments',  label: 'Appointments',   icon: Calendar },
  ]

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org?.name || 'Organization'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Healthcare Network Dashboard</p>
            </div>
          </div>
          {org && !org.is_verified && (
            <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-full font-medium">
              Verification pending
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Doctors',       value: doctors.length,          icon: Stethoscope, color: 'text-brand-600',  bg: 'bg-brand-50'   },
                { label: 'Total Patients',       value: patients.length,         icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Total Appointments',   value: appointments.length,     icon: Calendar,    color: 'text-violet-600',  bg: 'bg-violet-50'  },
                { label: 'Completed Consults',   value: completedCount,          icon: CheckCircle2,color: 'text-sky-600',     bg: 'bg-sky-50'     },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick-action tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Add a Doctor',       sub: 'Expand your network',     icon: UserCheck,   onClick: () => { setTab('doctors'); setShowAddForm(true) } },
                { label: 'View Appointments',   sub: `${upcomingAppts.length} upcoming`, icon: Clock, onClick: () => setTab('appointments') },
                { label: 'View All Patients',   sub: `${patients.length} patients`,      icon: Users, onClick: () => setTab('patients') },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
                      <a.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </button>
              ))}
            </div>

            {/* Recent appointments */}
            {appointments.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
                  <button onClick={() => setTab('appointments')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    View all →
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {appointments.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 text-xs font-semibold">
                            {a.users?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.users?.name}</p>
                          <p className="text-xs text-gray-500">Dr. {a.providers?.users?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-500">
                          {new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Doctors ──────────────────────────────────── */}
        {tab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Doctor
              </button>
            </div>

            {/* Add doctor form */}
            {showAddForm && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-brand-800 text-sm">Add Doctor by Email</p>
                  <button onClick={() => { setShowAddForm(false); setAddError('') }}>
                    <X className="h-4 w-4 text-brand-600" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="doctor@example.com"
                    value={addEmail}
                    onChange={(e) => { setAddEmail(e.target.value); setAddError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDoctor()}
                    className="flex-1 px-3 py-2 border border-brand-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                  <button
                    onClick={handleAddDoctor}
                    disabled={adding || !addEmail.trim()}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </button>
                </div>
                {addError && <p className="text-red-600 text-xs mt-2">{addError}</p>}
                <p className="text-xs text-brand-600 mt-2">
                  The doctor must already have a Telio Health provider account.
                </p>
              </div>
            )}

            {filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">No doctors yet</p>
                <p className="text-sm text-gray-500 mt-1">Add doctors by their registered email address.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredDoctors.map((doc) => (
                    <div key={doc.provider_id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 font-semibold text-sm">
                            {doc.provider_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Dr. {doc.provider_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.specialty} · ${doc.consultation_fee}/visit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{doc.provider_email}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          Joined {new Date(doc.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => handleRemoveDoctor(doc.provider_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from organization"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Patients ─────────────────────────────────── */}
        {tab === 'patients' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">No patients yet</p>
                <p className="text-sm text-gray-500 mt-1">Patients appear here once they book with your doctors.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-semibold text-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{patient.name}</p>
                          <p className="text-xs text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{patient.appointmentCount}</p>
                          <p className="text-xs text-gray-500">visit{patient.appointmentCount !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/messages/${patient.id}`)}
                          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <MessageIcon />
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Appointments ─────────────────────────────── */}
        {tab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient or doctor..."
                  value={apptSearch}
                  onChange={(e) => setApptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['all', 'upcoming', 'past'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setApptFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors',
                      apptFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {searchedAppts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">No appointments found</p>
                <p className="text-sm text-gray-500 mt-1">Appointments will appear here once your doctors receive bookings.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {searchedAppts.map((a: any) => (
                    <div key={a.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 text-xs font-semibold">
                            {a.users?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{a.users?.name}</p>
                          <p className="text-xs text-gray-500">Dr. {a.providers?.users?.name} · {a.appointment_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-700">
                            {new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">{a.appointment_time}</p>
                        </div>
                        <StatusBadge status={a.status} />
                        <button
                          onClick={() => navigate(`/appointments/${a.id}`)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled:  'bg-brand-100 text-brand-800',
    confirmed:  'bg-green-100 text-green-800',
    completed:  'bg-gray-100 text-gray-700',
    cancelled:  'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', styles[status] || styles.completed)}>
      {status}
    </span>
  )
}

function MessageIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
