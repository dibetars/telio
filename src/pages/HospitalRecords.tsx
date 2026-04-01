import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { HospitalRecord, HospitalRecordType, HospitalRecordSource, ERPConnection, Organization, ImportJob } from '../types'
import {
  Upload, Database, Filter, Search, Eye, Archive,
  ChevronDown, X, Loader2, FileText, CheckCircle,
  AlertCircle, Clock, Download, RefreshCw, Building2
} from 'lucide-react'

const RECORD_TYPE_LABELS: Record<HospitalRecordType, string> = {
  admission: 'Admission',
  discharge: 'Discharge',
  lab_result: 'Lab Result',
  imaging: 'Imaging',
  surgical: 'Surgical',
  medication: 'Medication',
  vitals: 'Vitals',
  diagnosis: 'Diagnosis',
  referral: 'Referral',
  other: 'Other',
}

const SOURCE_LABELS: Record<HospitalRecordSource, string> = {
  manual: 'Manual Entry',
  csv_import: 'CSV Import',
  erp_sync: 'ERP Sync',
  hl7_fhir: 'HL7/FHIR',
}

const SOURCE_COLORS: Record<HospitalRecordSource, string> = {
  manual: 'bg-gray-100 text-gray-700',
  csv_import: 'bg-blue-100 text-blue-700',
  erp_sync: 'bg-purple-100 text-purple-700',
  hl7_fhir: 'bg-teal-100 text-teal-700',
}

// Required CSV columns for import
const CSV_REQUIRED_COLUMNS = ['patient_email', 'record_type', 'record_date', 'title']
const CSV_OPTIONAL_COLUMNS = ['diagnosis', 'notes', 'provider_name', 'department', 'facility']

type ImportStep = 'upload' | 'map' | 'preview' | 'importing' | 'done'

interface CSVRow {
  [key: string]: string
}

function parseCsv(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: CSVRow = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  })
  return { headers, rows }
}

export default function HospitalRecords() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState<HospitalRecord[]>([])
  const [connectors, setConnectors] = useState<ERPConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<HospitalRecordType | ''>('')
  const [filterSource, setFilterSource] = useState<HospitalRecordSource | ''>('')
  const [filterConnector, setFilterConnector] = useState('')
  const [viewRecord, setViewRecord] = useState<HospitalRecord | null>(null)

  // Import state
  const [showImport, setShowImport] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [selectedConnector, setSelectedConnector] = useState('')
  const [importJob, setImportJob] = useState<Partial<ImportJob> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isAdmin = user?.role === 'admin'
  const isOrg = user?.role === 'organization'

  const urlParams = new URLSearchParams(window.location.search)
  const connectorFromUrl = urlParams.get('connector')

  useEffect(() => {
    if (connectorFromUrl) setFilterConnector(connectorFromUrl)
    if (urlParams.get('import') === '1') setShowImport(true)
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [recRes, connRes] = await Promise.all([
      buildRecordQuery(),
      supabase
        .from('erp_connections')
        .select('id, name, erp_type, organization_id')
        .eq('is_active', true)
        .order('name'),
    ])
    if (recRes.data) setRecords(recRes.data as HospitalRecord[])
    if (connRes.data) setConnectors(connRes.data as ERPConnection[])
    setLoading(false)
  }

  function buildRecordQuery() {
    let q = supabase
      .from('hospital_records')
      .select('*, patient:users!patient_id(id,name,email), organization:organizations(id,name), erp_connection:erp_connections(id,name,erp_type)')
      .order('record_date', { ascending: false })
      .limit(200)

    // Patients only see their own records
    if (!isAdmin && !isOrg) {
      q = q.eq('patient_id', user?.id ?? '')
    }
    return q
  }

  function resetImport() {
    setImportStep('upload')
    setCsvHeaders([])
    setCsvRows([])
    setCsvFileName('')
    setColumnMap({})
    setSelectedConnector('')
    setImportJob(null)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { headers, rows } = parseCsv(text)
      setCsvHeaders(headers)
      setCsvRows(rows)
      setCsvFileName(file.name)
      // Auto-map columns that match required names
      const autoMap: Record<string, string> = {}
      CSV_REQUIRED_COLUMNS.concat(CSV_OPTIONAL_COLUMNS).forEach((req) => {
        const match = headers.find((h) => h.toLowerCase().replace(/\s/g, '_') === req)
        if (match) autoMap[req] = match
      })
      setColumnMap(autoMap)
      setImportStep('map')
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!csvRows.length) return
    setImportStep('importing')

    // Create import job record
    const { data: job } = await supabase
      .from('import_jobs')
      .insert({
        erp_connection_id: selectedConnector || null,
        file_name: csvFileName,
        total_rows: csvRows.length,
        processed_rows: 0,
        success_rows: 0,
        error_rows: 0,
        status: 'processing',
        errors: [],
        created_by: user?.id,
      })
      .select()
      .single()

    let success = 0
    let errorCount = 0
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i]
      const email = row[columnMap.patient_email ?? 'patient_email']
      if (!email) { errors.push({ row: i + 2, message: 'Missing patient_email' }); errorCount++; continue }

      // Look up patient by email
      const { data: patientData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (!patientData) {
        errors.push({ row: i + 2, message: `Patient not found: ${email}` })
        errorCount++
        continue
      }

      const recType = (row[columnMap.record_type ?? 'record_type'] ?? 'other').toLowerCase() as HospitalRecordType
      const data: Record<string, unknown> = {}
      CSV_OPTIONAL_COLUMNS.forEach((col) => {
        if (columnMap[col] && row[columnMap[col]]) data[col] = row[columnMap[col]]
      })
      // Include any unmapped columns in data blob
      Object.keys(row).forEach((k) => {
        if (!Object.values(columnMap).includes(k) && row[k]) data[k] = row[k]
      })

      const { error } = await supabase.from('hospital_records').insert({
        patient_id: patientData.id,
        erp_connection_id: selectedConnector || null,
        import_batch_id: job?.id,
        record_type: Object.keys(RECORD_TYPE_LABELS).includes(recType) ? recType : 'other',
        record_date: row[columnMap.record_date ?? 'record_date'] || null,
        title: row[columnMap.title ?? 'title'] || null,
        data,
        source: 'csv_import',
        status: 'active',
      })

      if (error) { errors.push({ row: i + 2, message: error.message }); errorCount++ }
      else success++
    }

    // Update job
    if (job) {
      await supabase
        .from('import_jobs')
        .update({
          processed_rows: csvRows.length,
          success_rows: success,
          error_rows: errorCount,
          status: errorCount === csvRows.length ? 'failed' : 'completed',
          errors,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
    }

    setImportJob({
      total_rows: csvRows.length,
      success_rows: success,
      error_rows: errorCount,
      errors,
      status: errorCount === csvRows.length ? 'failed' : 'completed',
    })
    setImportStep('done')
    fetchAll()
  }

  // Filter records
  const filtered = records.filter((r) => {
    if (filterType && r.record_type !== filterType) return false
    if (filterSource && r.source !== filterSource) return false
    if (filterConnector && r.erp_connection_id !== filterConnector) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        r.title?.toLowerCase().includes(s) ||
        r.patient?.name?.toLowerCase().includes(s) ||
        r.record_type.includes(s)
      )
    }
    return true
  })

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Records</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isAdmin || isOrg
                ? 'All patient records synced from ERP systems or imported via CSV'
                : 'Your hospital and clinical records'}
            </p>
          </div>
          {(isAdmin || isOrg) && (
            <div className="flex gap-2">
              <button
                onClick={() => { resetImport(); setShowImport(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
              <a
                href="/erp-connectors"
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                <Database className="h-4 w-4" />
                Connectors
              </a>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as HospitalRecordType | '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="">All Types</option>
            {Object.entries(RECORD_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as HospitalRecordSource | '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="">All Sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {connectors.length > 0 && (
            <select
              value={filterConnector}
              onChange={(e) => setFilterConnector(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="">All Connectors</option>
              {connectors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button onClick={fetchAll} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Records table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No records found</p>
            {(isAdmin || isOrg) && (
              <p className="text-sm text-gray-400 mt-1">Import a CSV file or sync from an ERP connector</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Record</th>
                  {(isAdmin || isOrg) && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{rec.title ?? '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{RECORD_TYPE_LABELS[rec.record_type]}</div>
                    </td>
                    {(isAdmin || isOrg) && (
                      <td className="px-4 py-3 text-gray-700">{rec.patient?.name ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600">
                      {rec.record_date ? new Date(rec.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[rec.source]}`}>
                        {SOURCE_LABELS[rec.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {rec.erp_connection?.name ?? rec.organization?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewRecord(rec)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* View record modal */}
        {viewRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">{viewRecord.title ?? 'Record Detail'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{RECORD_TYPE_LABELS[viewRecord.record_type]}</p>
                </div>
                <button onClick={() => setViewRecord(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Patient</p>
                    <p className="font-medium">{viewRecord.patient?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Record Date</p>
                    <p className="font-medium">
                      {viewRecord.record_date ? new Date(viewRecord.record_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Source</p>
                    <p className="font-medium">{SOURCE_LABELS[viewRecord.source]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="font-medium capitalize">{viewRecord.status}</p>
                  </div>
                  {viewRecord.erp_connection && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">ERP Connector</p>
                      <p className="font-medium">{viewRecord.erp_connection.name}</p>
                    </div>
                  )}
                </div>
                {/* Data fields */}
                {Object.keys(viewRecord.data).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Clinical Data</p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      {Object.entries(viewRecord.data).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-500 capitalize min-w-28">{k.replace(/_/g, ' ')}:</span>
                          <span className="text-gray-800 font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Import modal */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">Import Hospital Records via CSV</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {(['upload', 'map', 'preview', 'importing', 'done'] as ImportStep[]).map((s, i) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${importStep === s ? 'bg-brand-600' : ['done', 'importing'].includes(s) && i < ['upload','map','preview','importing','done'].indexOf(importStep) ? 'bg-brand-300' : 'bg-gray-200'}`} />
                        <span className={`text-xs capitalize ${importStep === s ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                        {i < 4 && <span className="text-gray-300 text-xs">›</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setShowImport(false); resetImport() }} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Step 1: Upload */}
                {importStep === 'upload' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ERP Connector (optional)</label>
                      <select
                        value={selectedConnector}
                        onChange={(e) => setSelectedConnector(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      >
                        <option value="">— No connector (standalone import) —</option>
                        {connectors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
                    >
                      <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-gray-700">Click to select a CSV file</p>
                      <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-700 mb-2">Required columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {CSV_REQUIRED_COLUMNS.map((c) => (
                          <span key={c} className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">{c}</span>
                        ))}
                      </div>
                      <p className="font-semibold text-gray-700 mt-3 mb-1">Optional columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {CSV_OPTIONAL_COLUMNS.map((c) => (
                          <span key={c} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Column mapping */}
                {importStep === 'map' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Map your CSV columns (<span className="font-mono text-brand-700">{csvFileName}</span>, {csvRows.length} rows) to TelioHealth fields.
                    </p>
                    <div className="space-y-3">
                      {CSV_REQUIRED_COLUMNS.concat(CSV_OPTIONAL_COLUMNS).map((field) => (
                        <div key={field} className="flex items-center gap-3">
                          <div className="w-36 text-sm">
                            <span className="font-mono text-xs text-gray-700">{field}</span>
                            {CSV_REQUIRED_COLUMNS.includes(field) && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
                          <select
                            value={columnMap[field] ?? ''}
                            onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value }))}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                          >
                            <option value="">— skip —</option>
                            {csvHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Preview */}
                {importStep === 'preview' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Preview of first 5 rows:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            {CSV_REQUIRED_COLUMNS.filter((f) => columnMap[f]).map((f) => (
                              <th key={f} className="px-2 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              {CSV_REQUIRED_COLUMNS.filter((f) => columnMap[f]).map((f) => (
                                <td key={f} className="px-2 py-2 text-gray-700">{row[columnMap[f]] || '—'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400">{csvRows.length} total rows will be imported</p>
                  </div>
                )}

                {/* Step 4: Importing */}
                {importStep === 'importing' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-12 w-12 text-brand-600 animate-spin" />
                    <p className="font-medium text-gray-700">Importing records…</p>
                    <p className="text-sm text-gray-400">This may take a moment for large files</p>
                  </div>
                )}

                {/* Step 5: Done */}
                {importStep === 'done' && importJob && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {importJob.status === 'completed' ? (
                        <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">
                          {importJob.status === 'completed' ? 'Import Complete' : 'Import Failed'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {importJob.success_rows} of {importJob.total_rows} rows imported successfully
                          {(importJob.error_rows ?? 0) > 0 && `, ${importJob.error_rows} errors`}
                        </p>
                      </div>
                    </div>
                    {(importJob.errors ?? []).length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs font-semibold text-red-700 mb-2">Errors:</p>
                        {importJob.errors!.map((e, i) => (
                          <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex justify-between gap-3 px-6 pb-5 border-t border-gray-100 pt-4">
                {importStep !== 'done' && importStep !== 'importing' && (
                  <button
                    onClick={() => {
                      if (importStep === 'map') setImportStep('upload')
                      else if (importStep === 'preview') setImportStep('map')
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-0"
                    disabled={importStep === 'upload'}
                  >
                    Back
                  </button>
                )}
                <div className="ml-auto flex gap-2">
                  {importStep === 'done' && (
                    <>
                      <button
                        onClick={() => { setShowImport(false); resetImport() }}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={resetImport}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                      >
                        Import Another
                      </button>
                    </>
                  )}
                  {importStep === 'map' && (
                    <button
                      onClick={() => setImportStep('preview')}
                      disabled={CSV_REQUIRED_COLUMNS.some((f) => !columnMap[f])}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      Preview →
                    </button>
                  )}
                  {importStep === 'preview' && (
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                    >
                      Import {csvRows.length} Records
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
