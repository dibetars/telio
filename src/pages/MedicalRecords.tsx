import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { MedicalRecord } from '../types'
import {
  FileText, Upload, Download, Trash2, Plus, AlertCircle,
  Loader2, File, Image, FileCheck,
} from 'lucide-react'
import { cn } from '../lib/utils'

const RECORD_TYPES = [
  'Lab Results', 'Imaging Report', 'Prescription', 'Doctor Notes',
  'Vaccination Record', 'Surgery Record', 'Insurance', 'Other',
]

const TABS = ['My Records', 'Consultation Notes'] as const
type Tab = typeof TABS[number]

function fileIcon(name?: string) {
  if (!name) return <File className="h-5 w-5 text-gray-400" />
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
    return <Image className="h-5 w-5 text-brand-500" />
  if (ext === 'pdf') return <FileCheck className="h-5 w-5 text-red-500" />
  return <FileText className="h-5 w-5 text-gray-400" />
}

export default function MedicalRecords() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('My Records')
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState(RECORD_TYPES[0])
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) { fetchRecords(); fetchConsultations() }
  }, [user])

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchConsultations = async () => {
    try {
      const { data } = await supabase
        .from('consultations')
        .select(`
          *,
          providers!inner(specialty, users!inner(name))
        `)
        .eq('patient_id', user!.id)
        .eq('status', 'completed')
        .order('consultation_date', { ascending: false })

      setConsultations(data || [])
    } catch {
      // ignore
    }
  }

  const handleUpload = async () => {
    if (!user || !uploadFile) return
    setUploading(true)
    try {
      // Upload file to Supabase storage
      const ext = uploadFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: storageError } = await supabase.storage
        .from('medical-records')
        .upload(path, uploadFile)

      if (storageError) {
        // Bucket may not exist yet — save without URL
        const { error: dbError } = await supabase.from('medical_records').insert({
          patient_id: user.id,
          record_type: uploadType,
          description: uploadDesc,
          file_name: uploadFile.name,
          file_url: null,
          uploaded_by: user.id,
        })
        if (dbError) throw dbError
      } else {
        const { data: urlData } = supabase.storage.from('medical-records').getPublicUrl(path)
        await supabase.from('medical_records').insert({
          patient_id: user.id,
          record_type: uploadType,
          description: uploadDesc,
          file_name: uploadFile.name,
          file_url: urlData?.publicUrl || null,
          uploaded_by: user.id,
        })
      }

      setShowUploadModal(false)
      setUploadFile(null)
      setUploadDesc('')
      fetchRecords()
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return
    await supabase.from('medical_records').delete().eq('id', id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-500 mt-1">Manage your health documents</p>
          </div>
          {tab === 'My Records' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Upload Record
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

        {/* My Records */}
        {tab === 'My Records' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No records yet</h3>
                <p className="text-gray-500 text-sm mb-5">Upload lab results, imaging reports, or other medical documents</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
                >
                  Upload Your First Record
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                      {fileIcon(record.file_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{record.file_name || 'Unnamed record'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{record.record_type}</span>
                        <span className="text-xs text-gray-400">{formatDate(record.created_at)}</span>
                      </div>
                      {record.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{record.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {record.file_url && (
                        <a
                          href={record.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Consultation Notes */}
        {tab === 'Consultation Notes' && (
          <>
            {consultations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No consultation notes yet</h3>
                <p className="text-gray-500 text-sm">Notes from completed consultations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Dr. {c.providers?.users?.name}
                        </p>
                        <p className="text-sm text-gray-500">{c.providers?.specialty}</p>
                      </div>
                      <span className="text-sm text-gray-400">{formatDate(c.consultation_date)}</span>
                    </div>
                    {c.consultation_notes ? (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.consultation_notes}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        No notes were added for this consultation.
                      </div>
                    )}
                    {c.follow_up_required && c.follow_up_date && (
                      <div className="mt-3 text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
                        Follow-up recommended: {formatDate(c.follow_up_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Upload Medical Record</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File <span className="text-gray-400">(PDF, JPG, PNG — max 10MB)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                    uploadFile ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      {fileIcon(uploadFile.name)}
                      <span className="text-sm font-medium text-gray-900">{uploadFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to select a file</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="e.g. Blood test from Jan 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadDesc('') }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="flex-1 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
