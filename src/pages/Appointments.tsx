import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { Appointment } from '../types'
import { Calendar, Clock, Video, Plus, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const TABS = ['Upcoming', 'Past', 'All'] as const
type Tab = typeof TABS[number]

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-brand-100 text-brand-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Upcoming')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchAppointments()
  }, [user])

  const fetchAppointments = async () => {
    try {
      let query = supabase.from('appointments').select(`
        *,
        providers!inner(id, specialty, consultation_fee, users!inner(name, email))
      `)

      if (user?.role === 'patient') {
        query = query.eq('patient_id', user.id)
      } else if (user?.role === 'provider') {
        // get provider record first
        const { data: prov } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (prov) query = query.eq('provider_id', prov.id)
      }

      const { data, error } = await query.order('appointment_date', { ascending: false })
      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  const filtered = appointments.filter((a) => {
    const apptDate = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`)
    if (tab === 'Upcoming') return apptDate >= now && a.status !== 'cancelled' && a.status !== 'completed'
    if (tab === 'Past') return apptDate < now || a.status === 'completed' || a.status === 'cancelled'
    return true
  })

  const formatDateTime = (date: string, time?: string) => {
    const d = new Date(`${date}T${time || '00:00'}`)
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }) + (time ? ` at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : '')
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500 mt-1">Manage your consultations</p>
          </div>
          {user?.role === 'patient' && (
            <button
              onClick={() => navigate('/appointments/book')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No {tab.toLowerCase()} appointments</h3>
            {user?.role === 'patient' && tab === 'Upcoming' && (
              <button
                onClick={() => navigate('/appointments/book')}
                className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
              >
                Book your first appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 tour-appointments-list">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                userRole={user?.role}
                formatDateTime={formatDateTime}
                onClick={() => navigate(`/appointments/${appt.id}`)}
                onJoinCall={() => navigate(`/consultation/${appt.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

interface CardProps {
  appointment: Appointment
  userRole?: string
  formatDateTime: (d: string, t?: string) => string
  onClick: () => void
  onJoinCall: () => void
}

function AppointmentCard({ appointment: a, userRole, formatDateTime, onClick, onJoinCall }: CardProps) {
  const providerName = (a.providers as any)?.users?.name
  const patientName = (a as any).users?.name
  const displayName = userRole === 'patient'
    ? (providerName ? `Dr. ${providerName}` : 'Doctor')
    : (patientName || 'Patient')
  const subtitle = userRole === 'patient'
    ? (a.providers as any)?.specialty
    : (a as any).users?.email

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700')}>
            {a.status}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(a.appointment_date, a.appointment_time)}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {a.duration_minutes} min
        </div>
        <div className="flex items-center gap-1 capitalize">
          <Video className="h-3.5 w-3.5" />
          {a.appointment_type}
        </div>
      </div>

      {a.status === 'confirmed' && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onJoinCall() }}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors tour-join-btn"
          >
            <Video className="h-4 w-4" />
            {userRole === 'provider' ? 'Start Consultation' : 'Join Call'}
          </button>
        </div>
      )}
    </div>
  )
}
