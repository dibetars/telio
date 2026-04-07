import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useTourStore } from '../stores/tourStore'
import {
  Calendar, Clock, User, Video, FileText, Play, Settings,
  Users, MessageSquare, Pill, Upload, ChevronRight, Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Appointment {
  id: string
  appointment_date: string
  duration: number
  status: string
  reason: string
  patient_id: string
  fee: number
  users: { name: string; email: string }
}

interface Patient {
  id: string
  name: string
  email: string
  phone?: string
  lastSeen: string        // date of most recent appointment
  totalAppointments: number
  nextAppointment?: string
}

type Tab = 'appointments' | 'patients'

export default function ProviderDashboard() {
  const [tab, setTab] = useState<Tab>('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingAppts, setLoadingAppts] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const { user } = useAuthStore()
  const { startTour } = useTourStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (tab === 'patients' && patients.length === 0) fetchPatients()
  }, [tab])

  const fetchAppointments = async () => {
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!providerData) return

      const { data } = await supabase
        .from('appointments')
        .select('*, users!inner(name, email)')
        .eq('provider_id', providerData.id)
        .order('appointment_date', { ascending: true })

      setAppointments(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAppts(false)
    }
  }

  const fetchPatients = async () => {
    setLoadingPatients(true)
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!providerData) return

      // All appointments for this provider with patient details
      const { data } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date, status, users!inner(id, name, email, phone)')
        .eq('provider_id', providerData.id)
        .order('appointment_date', { ascending: false })

      if (!data) return

      // Deduplicate by patient_id, building a profile per patient
      const map = new Map<string, Patient>()
      for (const appt of data as any[]) {
        const p = appt.users
        if (!map.has(p.id)) {
          map.set(p.id, {
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            lastSeen: appt.appointment_date,
            totalAppointments: 1,
            nextAppointment: appt.status === 'scheduled' || appt.status === 'confirmed'
              ? appt.appointment_date : undefined,
          })
        } else {
          const existing = map.get(p.id)!
          existing.totalAppointments++
          // Track upcoming appointment
          if ((appt.status === 'scheduled' || appt.status === 'confirmed') &&
            new Date(appt.appointment_date) > new Date()) {
            if (!existing.nextAppointment ||
              new Date(appt.appointment_date) < new Date(existing.nextAppointment)) {
              existing.nextAppointment = appt.appointment_date
            }
          }
        }
      }

      setPatients(Array.from(map.values()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPatients(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    })

  const formatShortDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-brand-100 text-brand-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-full bg-gray-50 tour-provider-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/availability')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Settings className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600 text-sm">Availability</span>
                </button>
                <button
                  onClick={() => navigate('/appointments')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600 text-sm">Schedule</span>
                </button>
                <button
                  onClick={() => navigate('/prescriptions')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Pill className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600 text-sm">Prescriptions</span>
                </button>
                <button
                  onClick={startTour}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-brand-400 rounded-lg hover:border-brand-600 hover:bg-brand-50 transition-colors group"
                >
                  <Play className="h-6 w-6 text-brand-400 group-hover:text-brand-600 mr-2" />
                  <span className="text-brand-500 group-hover:text-brand-700 font-medium text-sm">Demo Tour</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow tour-appointments-list">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setTab('appointments')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    tab === 'appointments'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Appointments
                  <span className="ml-1 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5">
                    {appointments.length}
                  </span>
                </button>
                <button
                  onClick={() => setTab('patients')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    tab === 'patients'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Users className="h-4 w-4" />
                  My Patients
                  {patients.length > 0 && (
                    <span className="ml-1 bg-brand-100 text-brand-700 text-xs rounded-full px-1.5 py-0.5">
                      {patients.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="p-6">
                {/* ── Appointments tab ── */}
                {tab === 'appointments' && (
                  loadingAppts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No appointments yet</p>
                      <button
                        onClick={() => navigate('/availability')}
                        className="mt-4 text-brand-600 hover:text-brand-500 text-sm font-medium"
                      >
                        Set your availability
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appt) => (
                        <div key={appt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 rounded-full p-2">
                                <User className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{appt.users.name}</p>
                                <p className="text-sm text-gray-500">{appt.users.email}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                              {appt.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(appt.appointment_date)}
                            <Clock className="h-4 w-4 ml-3 mr-1" />
                            {appt.duration} min
                          </div>
                          {appt.reason && (
                            <p className="mt-2 text-sm text-gray-600">
                              <strong>Reason:</strong> {appt.reason}
                            </p>
                          )}
                          <div className="mt-3 flex gap-2">
                            {appt.status === 'confirmed' && (
                              <button
                                onClick={() => navigate(`/consultation/${appt.id}`)}
                                className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Start Consultation
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/appointments/${appt.id}`)}
                              className="px-3 py-1 text-sm text-brand-600 hover:text-brand-500"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* ── My Patients tab ── */}
                {tab === 'patients' && (
                  loadingPatients ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No patients yet</p>
                      <p className="text-sm text-gray-400 mt-1">Patients appear here once they book an appointment with you</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patients.map((patient) => (
                        <div key={patient.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-600 font-semibold text-sm">
                                  {patient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{patient.name}</p>
                                <p className="text-xs text-gray-500">{patient.email}</p>
                                {patient.phone && <p className="text-xs text-gray-400">{patient.phone}</p>}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-400 flex-shrink-0">
                              <p>{patient.totalAppointments} visit{patient.totalAppointments !== 1 ? 's' : ''}</p>
                              <p className="mt-0.5">Last: {formatShortDate(patient.lastSeen)}</p>
                              {patient.nextAppointment && (
                                <p className="mt-0.5 text-brand-600 font-medium">
                                  Next: {formatShortDate(patient.nextAppointment)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => navigate(`/messages/${patient.id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Message
                            </button>
                            <button
                              onClick={() => navigate(`/prescriptions?patient=${patient.id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                            >
                              <Pill className="h-3.5 w-3.5" />
                              Prescribe
                            </button>
                            <button
                              onClick={() => navigate(`/hospital-records?patient=${patient.id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Records
                            </button>
                            <button
                              onClick={() => {
                                // Navigate to appointments filtered to this patient
                                const appt = appointments.find(a => a.patient_id === patient.id)
                                if (appt) navigate(`/appointments/${appt.id}`)
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Appointments
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Profile</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <User className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. {user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unique Patients</span>
                  <span className="font-medium text-brand-600">{patients.length || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="font-medium">{appointments.filter(a => a.status === 'confirmed').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { label: 'Manage Availability', path: '/availability' },
                  { label: 'All Appointments', path: '/appointments' },
                  { label: 'Prescriptions', path: '/prescriptions' },
                  { label: 'Messages', path: '/messages' },
                  { label: 'Edit Profile', path: '/profile' },
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
