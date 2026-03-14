import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Calendar, Clock, User, Video, FileText, Plus } from 'lucide-react'

interface Appointment {
  id: string
  appointment_date: string
  duration: number
  status: string
  reason: string
  provider_id: string
  fee: number
  providers: {
    specialty: string
    users: {
      name: string
    }
  }
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          providers!inner(
            specialty,
            users!inner(name)
          )
        `)
        .eq('patient_id', user?.id)
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
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/appointments')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <Plus className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Book Appointment</span>
                </button>
                <button
                  onClick={() => navigate('/medical-records')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <FileText className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">View Records</span>
                </button>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming appointments</p>
                    <button
                      onClick={() => navigate('/appointments')}
                      className="mt-4 text-brand-600 hover:text-brand-500 text-sm font-medium"
                    >
                      Book your first appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-brand-100 rounded-full p-2">
                              <User className="h-5 w-5 text-brand-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Dr. {appointment.providers.users.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointment.providers.specialty}
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
                        <div className="mt-3 flex space-x-2">
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => navigate(`/consultation/${appointment.id}`)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join Call
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <User className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Profile
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}