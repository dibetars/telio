import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { Provider, WeekAvailability } from '../types'
import { ArrowLeft, ArrowRight, Calendar, Clock, Check, User } from 'lucide-react'
import { cn } from '../lib/utils'

const DAYS: (keyof WeekAvailability)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

function getNextDays(n: number): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push(d)
  }
  return days
}

function dayName(d: Date): keyof WeekAvailability {
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em
  while (cur + 30 <= endMin) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    cur += 30
  }
  return slots
}

export default function BookAppointment() {
  const [searchParams] = useSearchParams()
  const preselectedProviderId = searchParams.get('provider')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [appointmentType, setAppointmentType] = useState<'video' | 'phone'>('video')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const upcomingDays = getNextDays(14)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*, users!inner(id, name, email)')
        .eq('is_verified', true)

      if (error) throw error
      const list = data || []
      setProviders(list)

      if (preselectedProviderId) {
        const found = list.find((p: Provider) => p.id === preselectedProviderId)
        if (found) { setSelectedProvider(found); setStep(2) }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const availableSlots = (): string[] => {
    if (!selectedProvider || !selectedDate) return []
    const avail = (selectedProvider.availability || {}) as unknown as WeekAvailability
    const daySlots = avail[dayName(selectedDate)] || []
    return daySlots.flatMap((slot) => generateSlots(slot.start, slot.end))
  }

  const handleBook = async () => {
    if (!user || !selectedProvider || !selectedDate || !selectedTime) return
    setSubmitting(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        provider_id: selectedProvider.id,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        duration_minutes: 30,
        status: 'scheduled',
        appointment_type: appointmentType,
        notes: reason,
      })
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      alert('Booking failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 mb-8">
            Your appointment with Dr. {selectedProvider?.users?.name} on{' '}
            {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime} has been scheduled.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/appointments')}
              className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700"
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate('/doctors')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Find Another Doctor
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? 'Back' : 'Cancel'}
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Select Doctor', 'Pick Date & Time', 'Confirm'].map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span className={cn('text-sm hidden sm:block', step === s ? 'font-semibold text-gray-900' : 'text-gray-500')}>{label}</span>
                {s < 3 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Select doctor */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Doctor</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No verified doctors available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProvider(p); setStep(2) }}
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-brand-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-600 font-semibold text-sm">
                          {p.users?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Dr. {p.users?.name}</p>
                        <p className="text-sm text-gray-500">{p.specialty} · ${p.consultation_fee}/visit</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pick date & time */}
        {step === 2 && selectedProvider && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Pick a Date & Time</h2>
            <p className="text-gray-500 text-sm mb-5">
              With Dr. {selectedProvider.users?.name} · {selectedProvider.specialty}
            </p>

            {/* Date picker */}
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {upcomingDays.map((d) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString()
                const avail2 = (selectedProvider.availability || {}) as unknown as WeekAvailability
                const hasSlots = (avail2?.[dayName(d)] || []).length > 0
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
                    disabled={!hasSlots}
                    className={cn(
                      'flex-shrink-0 w-16 rounded-xl border py-2.5 text-center transition-all',
                      isSelected ? 'border-brand-600 bg-brand-600 text-white' :
                        hasSlots ? 'border-gray-200 bg-white hover:border-brand-300' :
                          'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    )}
                  >
                    <div className={cn('text-xs', isSelected ? 'text-brand-100' : 'text-gray-500')}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={cn('text-lg font-bold', isSelected ? 'text-white' : 'text-gray-900')}>
                      {d.getDate()}
                    </div>
                    <div className={cn('text-xs', isSelected ? 'text-brand-100' : 'text-gray-400')}>
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Available Times</h3>
                {availableSlots().length === 0 ? (
                  <p className="text-gray-400 text-sm">No available slots for this day.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                    {availableSlots().map((t) => {
                      const [h, m] = t.split(':').map(Number)
                      const ampm = h >= 12 ? 'PM' : 'AM'
                      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={cn(
                            'py-2 px-1 rounded-lg border text-sm font-medium transition-all',
                            selectedTime === t
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-gray-200 bg-white hover:border-brand-300 text-gray-700'
                          )}
                        >
                          {displayH}:{String(m).padStart(2, '0')} {ampm}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Consultation type */}
            <h3 className="text-sm font-medium text-gray-700 mb-3">Appointment Type</h3>
            <div className="flex gap-3 mb-6">
              {(['video', 'phone'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAppointmentType(t)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all',
                    appointmentType === t
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedProvider && selectedDate && selectedTime && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Confirm Appointment</h2>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-600 font-semibold">{selectedProvider.users?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Dr. {selectedProvider.users?.name}</p>
                  <p className="text-sm text-gray-500">{selectedProvider.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                  <p className="font-medium text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </div>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const [h, m] = selectedTime.split(':').map(Number)
                      const ampm = h >= 12 ? 'PM' : 'AM'
                      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
                      return `${dh}:${String(m).padStart(2, '0')} ${ampm}`
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-gray-900 capitalize">{appointmentType}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Duration</p>
                  <p className="font-medium text-gray-900">30 minutes</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Briefly describe your symptoms or the reason for this appointment..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              />
            </div>

            <div className="bg-brand-50 rounded-lg p-4 mb-5 flex items-center justify-between">
              <span className="text-sm text-gray-700">Consultation fee</span>
              <span className="text-lg font-bold text-brand-700">${selectedProvider.consultation_fee}</span>
            </div>

            <button
              onClick={handleBook}
              disabled={submitting}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
