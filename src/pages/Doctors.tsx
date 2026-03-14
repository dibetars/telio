import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Provider } from '../types'
import { Search, Star, DollarSign, Clock, Filter, ChevronRight } from 'lucide-react'

const SPECIALTIES = [
  'All', 'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Gynecology', 'Ophthalmology',
]

export default function Doctors() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('All')
  const [maxFee, setMaxFee] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          users!inner(id, name, email)
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProviders(data || [])
    } catch (err) {
      console.error('Error fetching providers:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = providers.filter((p) => {
    const name = p.users?.name?.toLowerCase() || ''
    const spec = p.specialty?.toLowerCase() || ''
    const matchesSearch = !search || name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase())
    const matchesSpecialty = specialty === 'All' || p.specialty === specialty
    const matchesFee = !maxFee || p.consultation_fee <= parseFloat(maxFee)
    return matchesSearch && matchesSpecialty && matchesFee
  })

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-500 mt-1">Search verified healthcare providers</p>
        </div>

        {/* Search & filter bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Consultation Fee ($)</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={maxFee}
                  onChange={(e) => setMaxFee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {loading ? 'Loading...' : `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No doctors found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((provider) => (
              <DoctorCard
                key={provider.id}
                provider={provider}
                onClick={() => navigate(`/doctors/${provider.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function DoctorCard({ provider, onClick }: { provider: Provider; onClick: () => void }) {
  const initials = provider.users?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DR'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-600 font-semibold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            Dr. {provider.users?.name}
          </h3>
          <p className="text-sm text-brand-600">{provider.specialty}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-500 flex-shrink-0 mt-1 transition-colors" />
      </div>

      {provider.bio && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{provider.bio}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <DollarSign className="h-3.5 w-3.5" />
          <span>${provider.consultation_fee}/visit</span>
        </div>
        {provider.years_of_experience && (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            <span>{provider.years_of_experience}y exp</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-gray-700">New</span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="mt-4 w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
      >
        View Profile & Book
      </button>
    </div>
  )
}
