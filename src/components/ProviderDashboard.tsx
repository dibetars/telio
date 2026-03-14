import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useTourStore } from '../stores/tourStore'
import { Calendar, Clock, User, Video, FileText, Play, Settings } from 'lucide-react'

interface Appointment {
  id: string
  appointment_date: string
  duration: number
  status: string
  reason: string
  patient_id: string
  fee: number
  users: {
    name: string
    email: string
  }
}

export default function ProviderDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const { startTour } = useTourStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      // First get the provider ID
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (providerError) throw providerError

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq('provider_id', providerData.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-brand-100 text-brand-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-full bg-gray-50 tour-provider-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/availability')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Settings className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Set Availability</span>
                </button>
                <button
                  onClick={() => navigate('/appointments')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">View Schedule</span>
                </button>
                <button
                  onClick={() => navigate('/medical-records')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <FileText className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Patient Records</span>
                </button>
                <button
                  onClick={startTour}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-brand-400 rounded-lg hover:border-brand-600 hover:bg-brand-50 transition-colors group"
                >
                  <Play className="h-6 w-6 text-brand-400 group-hover:text-brand-600 mr-2" />
                  <span className="text-brand-500 group-hover:text-brand-700 font-medium">Demo Tour</span>
                </button>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow tour-appointments-list">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments scheduled for today</p>
                    <button
                      onClick={() => navigate('/availability')}
                      className="mt-4 text-brand-600 hover:text-brand-500 text-sm font-medium"
                    >
                      Set your availability
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 rounded-full p-2">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {appointment.users.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointment.users.email}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.appointment_date)}
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          {appointment.duration} minutes
                        </div>
                        {appointment.reason && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Reason:</strong> {appointment.reason}
                          </div>
                        )}
                        <div className="mt-3 flex space-x-2">
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => navigate(`/consultation/${appointment.id}`)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Start Consultation
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                            className="px-3 py-1 text-sm text-brand-600 hover:text-brand-500"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Profile</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <User className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. {user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Today's Appointments</span>
                  <span className="font-medium">
                    {appointments.filter(a => {
                      const today = new Date().toDateString()
                      const appointmentDate = new Date(a.appointment_date).toDateString()
                      return appointmentDate === today
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/availability')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Manage Availability
                </button>
                <button
                  onClick={() => navigate('/appointments')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  All Appointments
                </button>
                <button
                  onClick={() => navigate('/medical-records')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Patient Records
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}