import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { Appointment } from '../types'
import {
  ArrowLeft, Calendar, Clock, Video, Phone, AlertCircle,
  CheckCircle, XCircle, MessageSquare, FileText,
} from 'lucide-react'
import { cn } from '../lib/utils'

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', icon: <Clock className="h-4 w-4" />, color: 'bg-brand-100 text-brand-700' },
  confirmed: { label: 'Confirmed', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (id) fetchAppointment(id)
  }, [id])

  const fetchAppointment = async (apptId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          providers!inner(id, specialty, consultation_fee, user_id, users!inner(name, email)),
          users!patient_id(name, email)
        `)
        .eq('id', apptId)
        .single()

      if (error) throw error
      setAppointment(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment || !confirm('Are you sure you want to cancel this appointment?')) return
    setCancelling(true)
    try {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointment.id)
      setAppointment({ ...appointment, status: 'cancelled' })
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirm = async () => {
    if (!appointment) return
    setConfirming(true)
    try {
      await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appointment.id)
      setAppointment({ ...appointment, status: 'confirmed' })
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      </Layout>
    )
  }

  if (!appointment) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Appointment not found.</p>
          <button onClick={() => navigate('/appointments')} className="mt-4 text-brand-600 hover:underline text-sm">
            Back to appointments
          </button>
        </div>
      </Layout>
    )
  }

  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled
  const apptDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time || '00:00'}`)
  const providerName = (appointment.providers as any)?.users?.name
  const patientName = (appointment as any).users?.name
  const isProvider = user?.role === 'provider'
  const otherName = isProvider ? patientName : `Dr. ${providerName}`
  const providerId = (appointment.providers as any)?.user_id

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  Appointment with {otherName}
                </h1>
                <p className="text-brand-100 text-sm">
                  {(appointment.providers as any)?.specialty}
                </p>
              </div>
              <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', status.color)}>
                {status.icon}
                {status.label}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </div>
                <p className="font-semibold text-gray-900">
                  {apptDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </div>
                <p className="font-semibold text-gray-900">
                  {apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' '}({appointment.duration_minutes} min)
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs">
                  {appointment.appointment_type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                  Type
                </div>
                <p className="font-semibold text-gray-900 capitalize">{appointment.appointment_type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs">
                  Fee
                </div>
                <p className="font-semibold text-gray-900">${(appointment.providers as any)?.consultation_fee}</p>
              </div>
            </div>

            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Reason for Visit
                </h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{appointment.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => navigate(`/consultation/${appointment.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Video className="h-4 w-4" />
                  {isProvider ? 'Start Consultation' : 'Join Call'}
                </button>
              )}

              {isProvider && appointment.status === 'scheduled' && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {confirming ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              )}

              <button
                onClick={() => navigate(`/messages/${isProvider ? (appointment as any).users?.id || appointment.patient_id : providerId}`)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </button>

              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
