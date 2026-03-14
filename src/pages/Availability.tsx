import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { WeekAvailability, TimeSlot } from '../types'
import { Clock, Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const DAYS: { key: keyof WeekAvailability; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const DEFAULT_AVAILABILITY: WeekAvailability = {
  monday: [], tuesday: [], wednesday: [], thursday: [],
  friday: [], saturday: [], sunday: [],
}

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

export default function Availability() {
  const { user } = useAuthStore()
  const [providerId, setProviderId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<WeekAvailability>(DEFAULT_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) fetchProvider()
  }, [user])

  const fetchProvider = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, availability')
        .eq('user_id', user!.id)
        .single()

      if (error) throw error
      setProviderId(data.id)
      const avail = data.availability as WeekAvailability
      setAvailability({ ...DEFAULT_AVAILABILITY, ...avail })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addSlot = (day: keyof WeekAvailability) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '17:00' }],
    }))
  }

  const removeSlot = (day: keyof WeekAvailability, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }))
  }

  const updateSlot = (day: keyof WeekAvailability, index: number, field: keyof TimeSlot, value: string) => {
    setAvailability((prev) => {
      const slots = [...prev[day]]
      slots[index] = { ...slots[index], [field]: value }
      return { ...prev, [day]: slots }
    })
  }

  const handleSave = async () => {
    if (!providerId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('providers')
        .update({ availability })
        .eq('id', providerId)

      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
            <p className="text-gray-500 mt-1">Set your working hours for each day</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-colors text-sm',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50'
            )}
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-4 tour-availability-grid">
          {DAYS.map(({ key, label }) => {
            const slots = availability[key]
            const isOpen = slots.length > 0
            return (
              <div
                key={key}
                className={cn(
                  'bg-white rounded-xl border p-5 transition-all',
                  isOpen ? 'border-brand-200' : 'border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      isOpen ? 'bg-green-500' : 'bg-gray-300'
                    )} />
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    {!isOpen && <span className="text-xs text-gray-400">Unavailable</span>}
                  </div>
                  <button
                    onClick={() => addSlot(key)}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add hours
                  </button>
                </div>

                {slots.length > 0 && (
                  <div className="space-y-2">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <select
                          value={slot.start}
                          onChange={(e) => updateSlot(key, idx, 'start', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-gray-400 text-sm">to</span>
                        <select
                          value={slot.end}
                          onChange={(e) => updateSlot(key, idx, 'end', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSlot(key, idx)}
                          className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 bg-brand-50 rounded-xl p-4 text-sm text-brand-700">
          <strong>Tip:</strong> Patients can only book 30-minute slots within your available hours.
          Set your hours for each day you want to accept appointments.
        </div>
      </div>
    </Layout>
  )
}
