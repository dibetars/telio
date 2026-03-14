import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Provider, Review } from '../types'
import {
  ArrowLeft, Star, DollarSign, Clock, GraduationCap,
  Calendar, CheckCircle, MessageSquare,
} from 'lucide-react'

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProvider(id)
      fetchReviews(id)
    }
  }, [id])

  const fetchProvider = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*, users!inner(id, name, email)')
        .eq('id', providerId)
        .single()

      if (error) throw error
      setProvider(data)
    } catch (err) {
      console.error('Error fetching provider:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (providerId: string) => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, users!patient_id(name)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(10)

      setReviews(data || [])
    } catch {
      // reviews table may not exist yet
    }
  }

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      </Layout>
    )
  }

  if (!provider) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Doctor not found.</p>
          <button onClick={() => navigate('/doctors')} className="mt-4 text-brand-600 hover:underline text-sm">
            Back to search
          </button>
        </div>
      </Layout>
    )
  }

  const initials = provider.users?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/doctors')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-8">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dr. {provider.users?.name}</h1>
                <p className="text-brand-100 mt-1">{provider.specialty}</p>
                <div className="flex items-center gap-4 mt-2">
                  {averageRating && (
                    <div className="flex items-center gap-1 text-amber-300">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-white font-medium">{averageRating}</span>
                      <span className="text-brand-200 text-sm">({reviews.length} reviews)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-brand-100">
                    <CheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-sm">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-5">
              {provider.bio && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h2>
                  <p className="text-gray-700 text-sm leading-relaxed">{provider.bio}</p>
                </div>
              )}

              {provider.education && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Education</span>
                  </h2>
                  <p className="text-gray-700 text-sm">{provider.education}</p>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Patient Reviews
                  </h2>
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {(review as any).users?.name || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-gray-600">{review.review_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking sidebar */}
            <div className="space-y-4">
              <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="h-4 w-4 text-brand-600" />
                      <span className="text-sm">Consultation Fee</span>
                    </div>
                    <span className="font-bold text-brand-700">${provider.consultation_fee}</span>
                  </div>
                  {provider.years_of_experience && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4 text-brand-600" />
                        <span className="text-sm">Experience</span>
                      </div>
                      <span className="font-medium text-gray-900">{provider.years_of_experience} years</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/appointments/book?provider=${provider.id}`)}
                  className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </button>

                <button
                  onClick={() => navigate(`/messages/${provider.user_id}`)}
                  className="mt-2 w-full py-2.5 border border-brand-600 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">License</h3>
                <p className="text-xs text-gray-500 font-mono">{provider.license_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
