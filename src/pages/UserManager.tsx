import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface SampleUser {
  email: string
  password: string
  name: string
  role: 'patient' | 'provider' | 'admin'
  specialty?: string
  licenseNumber?: string
  bio?: string
  consultationFee?: number
}

const sampleUsers: SampleUser[] = [
  {
    email: 'patient@test.com',
    password: 'TestPatient123!',
    name: 'John Patient',
    role: 'patient'
  },
  {
    email: 'provider@test.com',
    password: 'TestProvider123!',
    name: 'Dr. Sarah Provider',
    role: 'provider',
    specialty: 'General Practice',
    licenseNumber: 'MD-2024-001',
    bio: 'Experienced general practitioner with 10+ years in family medicine.',
    consultationFee: 150.00
  },
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    name: 'Admin User',
    role: 'admin'
  }
]

export default function UserManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [createdUsers, setCreatedUsers] = useState<string[]>([])

  const createUser = async (userData: SampleUser) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { 
            name: userData.name,
            role: userData.role
          }
        }
      })

      if (authError) {
        throw new Error(`Auth creation failed: ${authError.message}`)
      }

      if (authData.user) {
        // Wait for trigger to create user profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Update user profile with additional data
        const { error: profileError } = await supabase
          .from('users')
          .update({
            name: userData.name,
            role: userData.role,
            phone: userData.role === 'provider' ? '+1-555-0123' : '+1-555-0124'
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.warn('Profile update failed:', profileError.message)
        }

        // Create provider profile if role is provider
        if (userData.role === 'provider') {
          const { error: providerError } = await supabase
            .from('providers')
            .insert([
              {
                user_id: authData.user.id,
                specialty: userData.specialty || 'General Practice',
                license_number: userData.licenseNumber || `TEMP-${Date.now()}`,
                bio: userData.bio || 'Experienced healthcare provider.',
                consultation_fee: userData.consultationFee || 100.00,
                is_verified: true,
                years_of_experience: 8,
                education: 'MD - Harvard Medical School',
                availability: {
                  monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
                  tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
                  wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
                  thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
                  friday: ['09:00', '10:00', '11:00', '14:00', '15:00']
                }
              }
            ])

          if (providerError) {
            console.warn('Provider profile creation failed:', providerError.message)
          }
        }

        // Create some sample appointments for patients
        if (userData.role === 'patient') {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)

          const { error: appointmentError } = await supabase
            .from('appointments')
            .insert([
              {
                patient_id: authData.user.id,
                provider_id: '00000000-0000-0000-0000-000000000001', // Will be replaced with actual provider ID
                appointment_date: tomorrow.toISOString().split('T')[0],
                appointment_time: '10:00:00',
                duration_minutes: 30,
                status: 'scheduled',
                appointment_type: 'video',
                notes: 'Initial consultation'
              }
            ])

          if (appointmentError) {
            console.warn('Sample appointment creation failed:', appointmentError.message)
          }
        }

        return authData.user.id
      }
    } catch (error) {
      throw error
    }
  }

  const createAllSampleUsers = async () => {
    setIsLoading(true)
    const created: string[] = []

    try {
      for (const user of sampleUsers) {
        try {
          const userId = await createUser(user)
          created.push(user.email)
          toast.success(`Created ${user.role}: ${user.name}`)
        } catch (error) {
          console.error(`Failed to create ${user.email}:`, error)
          toast.error(`Failed to create ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      setCreatedUsers(created)
      toast.success(`Successfully created ${created.length} sample users!`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(`Login failed: ${error.message}`)
      } else {
        toast.success(`Successfully logged in as ${email}`)
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      }
    } catch (error) {
      toast.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">👥 Sample User Manager</h1>
            <p className="text-xl text-gray-600">Create test users for your telehealth platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {sampleUsers.map((user, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">
                      {user.role === 'patient' ? '🧑‍⚕️' : user.role === 'provider' ? '👨‍⚕️' : '👨‍💼'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800">{user.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'patient' ? 'bg-green-100 text-green-800' :
                    user.role === 'provider' ? 'bg-brand-100 text-brand-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Email:</strong>
                    <code className="block bg-gray-200 px-2 py-1 rounded text-xs font-mono">{user.email}</code>
                  </div>
                  <div>
                    <strong>Password:</strong>
                    <code className="block bg-gray-200 px-2 py-1 rounded text-xs font-mono">{user.password}</code>
                  </div>
                  {user.specialty && (
                    <div>
                      <strong>Specialty:</strong> {user.specialty}
                    </div>
                  )}
                  {user.consultationFee && (
                    <div>
                      <strong>Fee:</strong> ${user.consultationFee}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => testLogin(user.email, user.password)}
                  className="w-full mt-4 bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 transition-colors text-sm"
                >
                  Test Login
                </button>
              </div>
            ))}
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={createAllSampleUsers}
              disabled={isLoading}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '🔄 Creating Users...' : '✨ Create All Sample Users'}
            </button>

            {createdUsers.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Successfully Created:</h3>
                <ul className="text-green-700 space-y-1">
                  {createdUsers.map((email, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">📋 Quick Reference</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong className="text-yellow-800">Patient:</strong>
                  <div className="text-yellow-700">
                    <div>patient@test.com</div>
                    <div>TestPatient123!</div>
                  </div>
                </div>
                <div>
                  <strong className="text-yellow-800">Provider:</strong>
                  <div className="text-yellow-700">
                    <div>provider@test.com</div>
                    <div>TestProvider123!</div>
                  </div>
                </div>
                <div>
                  <strong className="text-yellow-800">Admin:</strong>
                  <div className="text-yellow-700">
                    <div>admin@test.com</div>
                    <div>TestAdmin123!</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/login-enhanced"
                className="inline-block bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
              >
                🚀 Go to Login Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}