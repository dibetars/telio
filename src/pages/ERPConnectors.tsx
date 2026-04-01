import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { ERPConnection, ERPType, Organization } from '../types'
import {
  Plus, Zap, RefreshCw, Trash2, Edit2, CheckCircle,
  AlertCircle, Clock, Database, Wifi, WifiOff, Upload,
  ChevronDown, X, Loader2
} from 'lucide-react'

const ERP_LABELS: Record<ERPType, string> = {
  sap_healthcare: 'SAP Healthcare',
  oracle_cerner: 'Oracle Cerner',
  epic: 'Epic Systems',
  meditech: 'Meditech',
  allscripts: 'Allscripts',
  hl7_fhir: 'HL7 / FHIR API',
  custom_csv: 'CSV Import Only',
}

const ERP_COLORS: Record<ERPType, string> = {
  sap_healthcare: 'bg-blue-100 text-blue-700',
  oracle_cerner: 'bg-red-100 text-red-700',
  epic: 'bg-purple-100 text-purple-700',
  meditech: 'bg-green-100 text-green-700',
  allscripts: 'bg-orange-100 text-orange-700',
  hl7_fhir: 'bg-teal-100 text-teal-700',
  custom_csv: 'bg-gray-100 text-gray-700',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  idle: <Clock className="h-4 w-4 text-gray-400" />,
  syncing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
}

const BLANK_FORM = {
  name: '',
  erp_type: 'sap_healthcare' as ERPType,
  endpoint_url: '',
  auth_method: 'api_key' as 'api_key' | 'oauth' | 'basic' | 'none',
  sync_schedule: 'manual' as 'manual' | 'daily' | 'weekly',
  organization_id: '',
}

export default function ERPConnectors() {
  const { user } = useAuthStore()
  const [connections, setConnections] = useState<ERPConnection[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ERPConnection | null>(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [connRes, orgRes] = await Promise.all([
      supabase
        .from('erp_connections')
        .select('*, organization:organizations(id,name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('is_verified', true)
        .order('name'),
    ])
    if (connRes.data) setConnections(connRes.data as ERPConnection[])
    if (orgRes.data) setOrgs(orgRes.data as Organization[])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm({ ...BLANK_FORM })
    setShowModal(true)
  }

  function openEdit(conn: ERPConnection) {
    setEditing(conn)
    setForm({
      name: conn.name,
      erp_type: conn.erp_type,
      endpoint_url: conn.endpoint_url ?? '',
      auth_method: conn.auth_method ?? 'api_key',
      sync_schedule: conn.sync_schedule ?? 'manual',
      organization_id: conn.organization_id ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      erp_type: form.erp_type,
      endpoint_url: form.endpoint_url || null,
      auth_method: form.auth_method,
      sync_schedule: form.sync_schedule,
      organization_id: form.organization_id || null,
      sync_status: 'idle',
    }
    if (editing) {
      await supabase.from('erp_connections').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('erp_connections').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ERP connection? All sync history will be lost.')) return
    await supabase.from('erp_connections').delete().eq('id', id)
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleSync(conn: ERPConnection) {
    if (conn.erp_type === 'custom_csv') return
    setSyncing(conn.id)
    // Update status to syncing
    await supabase.from('erp_connections').update({ sync_status: 'syncing' }).eq('id', conn.id)
    setConnections((prev) =>
      prev.map((c) => (c.id === conn.id ? { ...c, sync_status: 'syncing' } : c))
    )
    // Simulate sync — in production this would call an Edge Function
    await new Promise((r) => setTimeout(r, 2000))
    await supabase
      .from('erp_connections')
      .update({ sync_status: 'success', last_sync_at: new Date().toISOString() })
      .eq('id', conn.id)
    setSyncing(null)
    fetchAll()
  }

  async function handleToggle(conn: ERPConnection) {
    const is_active = !conn.is_active
    await supabase.from('erp_connections').update({ is_active }).eq('id', conn.id)
    setConnections((prev) => prev.map((c) => (c.id === conn.id ? { ...c, is_active } : c)))
  }

  const formatDate = (ts?: string) => {
    if (!ts) return 'Never'
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ERP Connectors</h1>
            <p className="text-sm text-gray-500 mt-1">
              Connect to hospital ERP systems or import records via CSV
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Connector
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Database className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Data Sovereignty:</strong> TelioHealth acts as both an interface to your ERP systems
            and a sovereign data store. Records synced from ERP systems or imported via CSV are stored
            in TelioHealth's database and accessible to patients, providers, and administrators independently
            of the source system.
          </div>
        </div>

        {/* Connector list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No ERP connectors configured</p>
            <p className="text-sm text-gray-400 mt-1">Add a connector to start syncing hospital records</p>
            <button
              onClick={openAdd}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              Add First Connector
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className={`bg-white rounded-xl border transition-shadow ${
                  conn.is_active ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Status icon */}
                  <div className="flex-shrink-0">{STATUS_ICONS[conn.sync_status]}</div>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{conn.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ERP_COLORS[conn.erp_type]}`}>
                        {ERP_LABELS[conn.erp_type]}
                      </span>
                      {!conn.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Disabled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {conn.organization && <span>{conn.organization.name}</span>}
                      {conn.endpoint_url && (
                        <span className="truncate max-w-xs">{conn.endpoint_url}</span>
                      )}
                      <span>Last sync: {formatDate(conn.last_sync_at)}</span>
                      {conn.sync_schedule !== 'manual' && (
                        <span className="capitalize">{conn.sync_schedule} sync</span>
                      )}
                    </div>
                    {conn.sync_status === 'error' && conn.sync_error && (
                      <p className="text-xs text-red-500 mt-1">{conn.sync_error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conn.erp_type !== 'custom_csv' && (
                      <button
                        onClick={() => handleSync(conn)}
                        disabled={syncing === conn.id || !conn.is_active}
                        title="Sync now"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-40"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncing === conn.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                      title="Toggle details"
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === conn.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleToggle(conn)}
                      title={conn.is_active ? 'Disable' : 'Enable'}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      {conn.is_active ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(conn)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(conn.id)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === conn.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Auth Method</p>
                        <p className="font-medium text-gray-700 capitalize">{conn.auth_method?.replace('_', ' ') ?? 'None'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Sync Schedule</p>
                        <p className="font-medium text-gray-700 capitalize">{conn.sync_schedule ?? 'Manual'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Status</p>
                        <p className="font-medium text-gray-700 capitalize">{conn.sync_status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Created</p>
                        <p className="font-medium text-gray-700">{formatDate(conn.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={`/hospital-records?connector=${conn.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-300"
                      >
                        <Database className="h-3.5 w-3.5" />
                        View Records
                      </a>
                      <a
                        href={`/hospital-records/import?connector=${conn.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-300"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Import CSV
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit Connector' : 'New ERP Connector'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connection Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. City General Hospital - Cerner"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>

                {/* ERP Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ERP System</label>
                  <select
                    value={form.erp_type}
                    onChange={(e) => setForm((f) => ({ ...f, erp_type: e.target.value as ERPType }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    {Object.entries(ERP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <select
                    value={form.organization_id}
                    onChange={(e) => setForm((f) => ({ ...f, organization_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    <option value="">— None (global) —</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {form.erp_type !== 'custom_csv' && (
                  <>
                    {/* Endpoint */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                      <input
                        value={form.endpoint_url}
                        onChange={(e) => setForm((f) => ({ ...f, endpoint_url: e.target.value }))}
                        placeholder="https://api.hospital.com/fhir/R4"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>

                    {/* Auth method */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Auth Method</label>
                        <select
                          value={form.auth_method}
                          onChange={(e) => setForm((f) => ({ ...f, auth_method: e.target.value as typeof form.auth_method }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                        >
                          <option value="api_key">API Key</option>
                          <option value="oauth">OAuth 2.0</option>
                          <option value="basic">Basic Auth</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sync Schedule</label>
                        <select
                          value={form.sync_schedule}
                          onChange={(e) => setForm((f) => ({ ...f, sync_schedule: e.target.value as typeof form.sync_schedule }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                        >
                          <option value="manual">Manual Only</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      API credentials are stored separately as environment secrets and never exposed in the UI.
                    </p>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Connector'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
