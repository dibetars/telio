import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  MessageSquare,
  FileText,
  ShieldCheck,
  Activity,
  Clock,
  Building2,
  Pencil,
  X,
  Save,
  BadgeCheck,
  Globe,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Organization } from '../types'

interface HealthCheck {
  name: string
  status: 'ok' | 'error' | 'loading'
  latencyMs?: number
  error?: string
}

interface Stats {
  usersByRole: Record<string, number>
  totalOrganizations: number
  totalMessages: number
  totalRecords: number
}

interface OrgWithUser extends Organization {
  user?: { email: string; name: string }
}

interface EditState {
  name: string
  description: string
  address: string
  phone: string
  website: string
  is_verified: boolean
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Auth Session', status: 'loading' },
    { name: 'Users Table', status: 'loading' },
    { name: 'Providers Table', status: 'loading' },
    { name: 'Organizations Table', status: 'loading' },
    { name: 'Messages Table', status: 'loading' },
    { name: 'Medical Records Table', status: 'loading' },
  ])
  const [stats, setStats] = useState<Stats | null>(null)
  const [orgs, setOrgs] = useState<OrgWithUser[]>([])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editingOrg, setEditingOrg] = useState<OrgWithUser | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  const runChecks = useCallback(async () => {
    setRefreshing(true)
    const checkStart = Date.now()

    const [session, usersRes, providersRes, orgsRes, msgRes, recordsRes] =
      await Promise.all([
        supabase.auth.getSession(),
        supabase.from('users').select('id').limit(1),
        supabase.from('providers').select('id').limit(1),
        supabase.from('organizations').select('id').limit(1),
        supabase.from('messages').select('id').limit(1),
        supabase.from('medical_records').select('id').limit(1),
      ])

    const elapsed = Date.now() - checkStart

    setChecks([
      {
        name: 'Auth Session',
        status: session.data.session ? 'ok' : 'error',
        latencyMs: elapsed,
        error: session.error?.message,
      },
      {
        name: 'Users Table',
        status: usersRes.error ? 'error' : 'ok',
        latencyMs: elapsed,
        error: usersRes.error?.message,
      },
      {
        name: 'Providers Table',
        status: providersRes.error ? 'error' : 'ok',
        latencyMs: elapsed,
        error: providersRes.error?.message,
      },
      {
        name: 'Organizations Table',
        status: orgsRes.error ? 'error' : 'ok',
        latencyMs: elapsed,
        error: orgsRes.error?.message,
      },
      {
        name: 'Messages Table',
        status: msgRes.error ? 'error' : 'ok',
        latencyMs: elapsed,
        error: msgRes.error?.message,
      },
      {
        name: 'Medical Records Table',
        status: recordsRes.error ? 'error' : 'ok',
        latencyMs: elapsed,
        error: recordsRes.error?.message,
      },
    ])

    // Stats
    const [usersData, msgCount, recordCount, orgsData] = await Promise.all([
      supabase.from('users').select('role'),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('medical_records').select('id', { count: 'exact', head: true }),
      supabase
        .from('organizations')
        .select(`
          id, user_id, name, description, address, phone, website,
          logo_url, is_verified, created_at, updated_at,
          user:users!user_id(name, email)
        `)
        .order('created_at', { ascending: false }),
    ])

    const usersByRole: Record<string, number> = {}
    for (const u of usersData.data ?? []) {
      usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1
    }

    const orgList = (orgsData.data as unknown as OrgWithUser[]) ?? []
    setOrgs(orgList)

    setStats({
      usersByRole,
      totalOrganizations: orgList.length,
      totalMessages: msgCount.count ?? 0,
      totalRecords: recordCount.count ?? 0,
    })

    setLastChecked(new Date())
    setRefreshing(false)
  }, [])

  useEffect(() => {
    runChecks()
    const interval = setInterval(runChecks, 30_000)
    return () => clearInterval(interval)
  }, [runChecks])

  const openEdit = (org: OrgWithUser) => {
    setEditingOrg(org)
    setEditState({
      name: org.name,
      description: org.description ?? '',
      address: org.address ?? '',
      phone: org.phone ?? '',
      website: org.website ?? '',
      is_verified: org.is_verified,
    })
  }

  const saveEdit = async () => {
    if (!editingOrg || !editState) return
    setSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({
        name: editState.name,
        description: editState.description || null,
        address: editState.address || null,
        phone: editState.phone || null,
        website: editState.website || null,
        is_verified: editState.is_verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingOrg.id)

    if (!error) {
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === editingOrg.id ? { ...o, ...editState } : o
        )
      )
      setEditingOrg(null)
      setEditState(null)
    } else {
      alert('Save failed: ' + error.message)
    }
    setSaving(false)
  }

  const allOk = checks.every((c) => c.status === 'ok')
  const errorCount = checks.filter((c) => c.status === 'error').length

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">System health · auto-refreshes every 30s</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={runChecks}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status banner */}
        <div className={cn(
          'rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium',
          allOk ? 'bg-green-50 text-green-700 border border-green-200' :
          errorCount > 0 ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-yellow-50 text-yellow-700 border border-yellow-200'
        )}>
          <Activity className="h-4 w-4 flex-shrink-0" />
          {allOk
            ? 'All systems operational'
            : `${errorCount} service${errorCount !== 1 ? 's' : ''} degraded — check details below`}
        </div>

        {/* Top grid: Health Checks + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Health Checks */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Health Checks</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {checks.map((check) => (
                <div key={check.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {check.status === 'loading' ? (
                      <RefreshCw className="h-4 w-4 text-gray-300 animate-spin" />
                    ) : check.status === 'ok' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{check.name}</p>
                      {check.status === 'error' && check.error && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate">{check.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      check.status === 'ok' ? 'bg-green-100 text-green-700' :
                      check.status === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-400'
                    )}>
                      {check.status === 'loading' ? 'checking…' : check.status === 'ok' ? 'OK' : 'ERROR'}
                    </span>
                    {check.latencyMs !== undefined && check.status === 'ok' && (
                      <p className="text-xs text-gray-400 mt-0.5">{check.latencyMs}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {/* Users by role */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">Users</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
                {['patient', 'provider', 'organization', 'admin'].map((role) => (
                  <div key={role} className="px-4 py-3">
                    <p className="text-2xl font-bold text-gray-900">{stats?.usersByRole[role] ?? '—'}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{role}s</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizations + Messages + Records */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-4 flex flex-col items-center justify-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrganizations ?? '—'}</p>
                <p className="text-xs text-gray-500">Organizations</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-4 flex flex-col items-center justify-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages ?? '—'}</p>
                <p className="text-xs text-gray-500">Messages</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-4 flex flex-col items-center justify-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalRecords ?? '—'}</p>
                <p className="text-xs text-gray-500">Med. Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Management */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">Organizations</h2>
              {stats && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {stats.totalOrganizations}
                </span>
              )}
            </div>
          </div>

          {orgs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No organizations registered yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {orgs.map((org) => (
                <div key={org.id} className="px-4 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                        {org.is_verified ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        )}
                      </div>
                      {org.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{org.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {org.user?.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="h-3 w-3" />
                            {org.user.email}
                          </span>
                        )}
                        {org.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="h-3 w-3" />
                            {org.phone}
                          </span>
                        )}
                        {org.website && (
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/messages/${org.user_id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </button>
                    <button
                      onClick={() => openEdit(org)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Organization Modal */}
      {editingOrg && editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Organization</h2>
              <button
                onClick={() => { setEditingOrg(null); setEditState(null) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editState.name}
                  onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editState.description}
                  onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editState.phone}
                    onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={editState.website}
                    onChange={(e) => setEditState({ ...editState, website: e.target.value })}
                    placeholder="https://"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editState.address}
                  onChange={(e) => setEditState({ ...editState, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditState({ ...editState, is_verified: !editState.is_verified })}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    editState.is_verified ? 'bg-emerald-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    editState.is_verified ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
                <span className="text-sm text-gray-700">Verified organization</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditingOrg(null); setEditState(null) }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editState.name.trim()}
                className="flex-1 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
