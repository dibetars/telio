import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { User, CheckCircle, Save, Stethoscope } from 'lucide-react'

export default function Profile() {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Common fields
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  // Provider-specific
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [education, setEducation] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [fee, setFee] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)

  // Patient-specific
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [conditions, setConditions] = useState('')

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    setName(user!.name || '')
    setPhone(user!.phone || '')

    if (user!.role === 'provider') {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (data) {
        setProviderProfileId(data.id)
        setSpecialty(data.specialty || '')
        setBio(data.bio || '')
        setEducation(data.education || '')
        setYearsExp(data.years_of_experience?.toString() || '')
        setFee(data.consultation_fee?.toString() || '')
        setLicenseNumber(data.license_number || '')
      }
    } else if (user!.role === 'patient') {
      const history = user!.medical_history as any || {}
      setAllergies(history.allergies || '')
      setMedications(history.medications || '')
      setConditions(history.conditions || '')
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      // Update base user
      const userUpdate: any = { name, phone }
      if (user.role === 'patient') {
        userUpdate.medical_history = { allergies, medications, conditions }
      }

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)

      if (userError) throw userError

      // Update provider profile
      if (user.role === 'provider' && providerProfileId) {
        const { error: provError } = await supabase
          .from('providers')
          .update({
            specialty,
            bio,
            education,
            years_of_experience: parseInt(yearsExp) || null,
            consultation_fee: parseFloat(fee) || 0,
            license_number: licenseNumber,
          })
          .eq('id', providerProfileId)

        if (provError) throw provError
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar & role */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 text-xl font-bold">{initials}</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {user?.role === 'provider' ? (
                    <Stethoscope className="h-4 w-4 text-brand-600" />
                  ) : (
                    <User className="h-4 w-4 text-brand-600" />
                  )}
                  <span className="text-sm text-gray-500 capitalize">{user?.role}</span>
                </div>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Provider fields */}
          {user?.role === 'provider' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Professional Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. General Practice"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. MD, Harvard Medical School (2010)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell patients about yourself, your approach to care, and your expertise..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Patient health info */}
          {user?.role === 'patient' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Medical History</h2>
              <p className="text-sm text-gray-500 mb-4">
                This information is shared with your doctors when they access your records.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    rows={2}
                    placeholder="e.g. Penicillin, peanuts..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                  <textarea
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    rows={2}
                    placeholder="List any medications you are currently taking..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                  <textarea
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    rows={2}
                    placeholder="e.g. Diabetes Type 2, Hypertension..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
