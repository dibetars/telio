import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { Prescription, Medication, Organization } from '../types'
import {
  Pill, Plus, X, Send, CheckCircle2, Clock, Building2,
  ChevronDown, Loader2, AlertCircle, Printer, Search,
} from 'lucide-react'
import { cn } from '../lib/utils'

const EMPTY_MED: Medication = { name: '', dosage: '', frequency: '', duration: '', notes: '' }

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  sent_to_pharmacy: 'bg-amber-100 text-amber-700',
  dispensed: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  sent_to_pharmacy: 'Sent to Pharmacy',
  dispensed: 'Dispensed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

interface PatientOption { id: string; name: string; email: string }

export default function Prescriptions() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const prefilledPatientId = searchParams.get('patient')
  const prefilledApptId = searchParams.get('appointment')

  const isProvider = user?.role === 'provider'
  const isPharmacy = user?.role === 'organization'

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [pharmacyOrg, setPharmacyOrg] = useState<Organization | null>(null)
  const [pharmacies, setPharmacies] = useState<Organization[]>([])

  // New prescription modal
  const [showModal, setShowModal] = useState(!!prefilledPatientId)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }])
  const [instructions, setInstructions] = useState('')
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('')
  const [saving, setSaving] = useState(false)
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false)
  const patientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node))
        setPatientDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    init()
  }, [user])

  const init = async () => {
    if (isProvider) {
      // Get provider record
      const { data: prov } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user!.id)
        .single()
      if (prov) {
        setProviderId(prov.id)
        await fetchProviderPrescriptions(prov.id)
        await fetchRecentPatients(prov.id)
      }
    } else if (isPharmacy) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (org) {
        setPharmacyOrg(org)
        await fetchPharmacyPrescriptions(org.id)
      }
    } else {
      // Patient
      await fetchPatientPrescriptions()
    }

    // Fetch pharmacies for dropdown (used by providers)
    const { data: pharmData } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('organization_type', 'pharmacy')
      .eq('is_verified', true)
    setPharmacies((pharmData as Organization[]) ?? [])

    setLoading(false)
  }

  const fetchPatientPrescriptions = async () => {
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        provider:providers!provider_id(
          specialty,
          users:users!user_id(name)
        ),
        pharmacy:organizations!pharmacy_id(name)
      `)
      .eq('patient_id', user!.id)
      .order('created_at', { ascending: false })
    setPrescriptions((data as unknown as Prescription[]) ?? [])
  }

  const fetchProviderPrescriptions = async (pId: string) => {
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:users!patient_id(name, email),
        pharmacy:organizations!pharmacy_id(name)
      `)
      .eq('provider_id', pId)
      .order('created_at', { ascending: false })
    setPrescriptions((data as unknown as Prescription[]) ?? [])
  }

  const fetchPharmacyPrescriptions = async (orgId: string) => {
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:users!patient_id(name, email),
        provider:providers!provider_id(
          specialty,
          users:users!user_id(name)
        )
      `)
      .eq('pharmacy_id', orgId)
      .order('created_at', { ascending: false })
    setPrescriptions((data as unknown as Prescription[]) ?? [])
  }

  const fetchRecentPatients = async (pId: string) => {
    // Get unique patients from recent appointments
    const { data } = await supabase
      .from('appointments')
      .select('patient_id, users:users!patient_id(id, name, email)')
      .eq('provider_id', pId)
      .order('appointment_date', { ascending: false })
      .limit(50)
    const seen = new Set<string>()
    const unique: PatientOption[] = []
    for (const a of (data as any[]) ?? []) {
      const p = a.users
      if (p && !seen.has(p.id)) {
        seen.add(p.id)
        unique.push(p)
      }
    }
    setPatients(unique)
    // Pre-fill if coming from AppointmentDetail
    if (prefilledPatientId) {
      const match = unique.find((p) => p.id === prefilledPatientId)
      if (match) setSelectedPatient(match)
    }
  }

  const savePrescription = async () => {
    if (!selectedPatient || !providerId) return
    const validMeds = medications.filter((m) => m.name.trim())
    if (validMeds.length === 0) return
    setSaving(true)
    try {
      const { error } = await supabase.from('prescriptions').insert({
        patient_id: selectedPatient.id,
        provider_id: providerId,
        appointment_id: prefilledApptId || null,
        medications: validMeds,
        instructions: instructions || null,
        status: selectedPharmacyId ? 'sent_to_pharmacy' : 'active',
        pharmacy_id: selectedPharmacyId || null,
        issued_at: new Date().toISOString(),
      })
      if (error) throw error
      setShowModal(false)
      resetModal()
      await fetchProviderPrescriptions(providerId)
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const markDispensed = async (id: string) => {
    await supabase
      .from('prescriptions')
      .update({ status: 'dispensed', dispensed_at: new Date().toISOString() })
      .eq('id', id)
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'dispensed' } : p))
    )
  }

  const sendToPharmacy = async (rx: Prescription, pharmId: string) => {
    await supabase
      .from('prescriptions')
      .update({ status: 'sent_to_pharmacy', pharmacy_id: pharmId })
      .eq('id', rx.id)
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === rx.id ? { ...p, status: 'sent_to_pharmacy', pharmacy_id: pharmId } : p
      )
    )
  }

  const resetModal = () => {
    setSelectedPatient(null)
    setMedications([{ ...EMPTY_MED }])
    setInstructions('')
    setSelectedPharmacyId('')
    setPatientSearch('')
  }

  const updateMed = (i: number, field: keyof Medication, value: string) => {
    setMedications((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)))
  }

  const filteredPatients = patients.filter(
    (p) =>
      !patientSearch ||
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const pageTitle = isPharmacy
    ? 'Prescription Inbox'
    : isProvider
    ? 'Prescriptions'
    : 'My Prescriptions'

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Pill className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              {isPharmacy && pharmacyOrg && (
                <p className="text-sm text-gray-500">{pharmacyOrg.name}</p>
              )}
            </div>
          </div>
          {isProvider && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              New Prescription
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No prescriptions yet</h3>
            <p className="text-gray-500 text-sm">
              {isProvider
                ? 'Write a prescription after a consultation.'
                : isPharmacy
                ? 'Prescriptions sent to your pharmacy will appear here.'
                : 'Prescriptions from your doctors will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => {
              const providerName = (rx.provider as any)?.users?.name
              const patientName = (rx.patient as any)?.name
              const pharmacyName = (rx.pharmacy as any)?.name

              return (
                <div key={rx.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      {isProvider && patientName && (
                        <p className="font-semibold text-gray-900">{patientName}</p>
                      )}
                      {!isProvider && providerName && (
                        <p className="font-semibold text-gray-900">Dr. {providerName}</p>
                      )}
                      {isPharmacy && patientName && (
                        <p className="text-sm text-gray-500 mt-0.5">Patient: {patientName}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Issued {formatDate(rx.issued_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_STYLES[rx.status] ?? STATUS_STYLES.active)}>
                        {STATUS_LABELS[rx.status] ?? rx.status}
                      </span>
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="space-y-2 mb-4">
                    {rx.medications.map((med, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-semibold text-gray-900 text-sm">{med.name}</span>
                        <span className="text-xs text-gray-600">{med.dosage}</span>
                        <span className="text-xs text-gray-500">{med.frequency}</span>
                        <span className="text-xs text-gray-400">for {med.duration}</span>
                        {med.notes && <span className="text-xs text-gray-400 italic">· {med.notes}</span>}
                      </div>
                    ))}
                  </div>

                  {rx.instructions && (
                    <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-4">
                      <span className="font-medium text-blue-700">Instructions: </span>
                      {rx.instructions}
                    </p>
                  )}

                  {pharmacyName && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Building2 className="h-3.5 w-3.5" />
                      Pharmacy: {pharmacyName}
                      {rx.dispensed_at && (
                        <span className="text-green-600 ml-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Dispensed {formatDate(rx.dispensed_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    {/* Provider: send to pharmacy */}
                    {isProvider && rx.status === 'active' && pharmacies.length > 0 && (
                      <div className="relative group">
                        <select
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) sendToPharmacy(rx, e.target.value) }}
                          className="pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-brand-500 outline-none text-gray-600"
                        >
                          <option value="" disabled>Send to Pharmacy…</option>
                          {pharmacies.map((ph) => (
                            <option key={ph.id} value={ph.id}>{ph.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    )}

                    {/* Pharmacy: mark dispensed */}
                    {isPharmacy && rx.status === 'sent_to_pharmacy' && (
                      <button
                        onClick={() => markDispensed(rx.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as Dispensed
                      </button>
                    )}

                    {rx.status === 'sent_to_pharmacy' && !isPharmacy && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        Awaiting dispensing
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Prescription Modal */}
      {showModal && isProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Prescription</h2>
              <button onClick={() => { setShowModal(false); resetModal() }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Patient select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2.5">
                    <div className="h-7 w-7 rounded-full bg-brand-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-800 text-xs font-semibold">{selectedPatient.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
                      <p className="text-xs text-gray-500">{selectedPatient.email}</p>
                    </div>
                    {!prefilledPatientId && (
                      <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative" ref={patientRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search your patients..."
                        value={patientSearch}
                        onFocus={() => setPatientDropdownOpen(true)}
                        onChange={(e) => { setPatientSearch(e.target.value); setPatientDropdownOpen(true) }}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    {patientDropdownOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredPatients.length === 0 ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                            <AlertCircle className="h-4 w-4" />
                            No patients found
                          </div>
                        ) : (
                          filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => { setSelectedPatient(p); setPatientDropdownOpen(false); setPatientSearch('') }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                            >
                              <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-700 text-xs font-semibold">{p.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Medications</label>
                  <button
                    onClick={() => setMedications((prev) => [...prev, { ...EMPTY_MED }])}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another
                  </button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-3 relative">
                      {medications.length > 1 && (
                        <button
                          onClick={() => setMedications((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Drug name *"
                            value={med.name}
                            onChange={(e) => updateMed(i, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          value={med.dosage}
                          onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. twice daily)"
                          value={med.frequency}
                          onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 7 days)"
                          value={med.duration}
                          onChange={(e) => updateMed(i, 'duration', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={med.notes ?? ''}
                          onChange={(e) => updateMed(i, 'notes', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Instructions <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Take with food. Avoid alcohol..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>

              {/* Send to pharmacy */}
              {pharmacies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Send to Pharmacy <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={selectedPharmacyId}
                      onChange={(e) => setSelectedPharmacyId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                    >
                      <option value="">No pharmacy (print/manual)</option>
                      {pharmacies.map((ph) => (
                        <option key={ph.id} value={ph.id}>{ph.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowModal(false); resetModal() }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={savePrescription}
                disabled={saving || !selectedPatient || !medications.some((m) => m.name.trim())}
                className="flex-1 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? 'Saving…' : selectedPharmacyId ? 'Save & Send' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
