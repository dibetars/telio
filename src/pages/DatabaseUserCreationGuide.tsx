import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'

export default function DatabaseUserCreationGuide() {
  const [isLoading, setIsLoading] = useState(false)
  const [usersCreated, setUsersCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sampleUsers = [
    {
      role: 'patient',
      email: 'patient@test.com',
      password: 'TestPatient123!',
      name: 'John Patient',
      description: 'A sample patient user for testing appointment booking and consultations'
    },
    {
      role: 'provider', 
      email: 'provider@test.com',
      password: 'TestProvider123!',
      name: 'Dr. Sarah Provider',
      description: 'A sample healthcare provider for testing consultation management',
      specialty: 'General Practice',
      licenseNumber: 'MD-2024-001'
    },
    {
      role: 'admin',
      email: 'admin@test.com', 
      password: 'TestAdmin123!',
      name: 'Admin User',
      description: 'A sample admin user for testing administrative functions'
    }
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').limit(1)
      if (error) {
        setError(`Database connection failed: ${error.message}`)
        return false
      }
      return true
    } catch (err) {
      setError('Database connection test failed')
      return false
    }
  }

  const createUsersViaAPI = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Test database connection first
      const isConnected = await testDatabaseConnection()
      if (!isConnected) {
        setIsLoading(false)
        return
      }

      // Create users one by one
      for (const user of sampleUsers) {
        try {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              data: { 
                name: user.name,
                role: user.role
              }
            }
          })

          if (authError) {
            console.warn(`Auth creation failed for ${user.email}:`, authError.message)
            // Continue with next user even if this one fails
            continue
          }

          if (authData.user) {
            // Wait for trigger to create user profile
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Update user profile with additional data
            const { error: profileError } = await supabase
              .from('users')
              .update({
                name: user.name,
                role: user.role,
                phone: user.role === 'provider' ? '+1-555-0123' : '+1-555-0124'
              })
              .eq('id', authData.user.id)

            if (profileError) {
              console.warn('Profile update failed:', profileError.message)
            }

            // Create provider profile if role is provider
            if (user.role === 'provider') {
              const { error: providerError } = await supabase
                .from('providers')
                .insert([
                  {
                    user_id: authData.user.id,
                    specialty: user.specialty || 'General Practice',
                    license_number: user.licenseNumber || `TEMP-${Date.now()}`,
                    bio: 'Experienced healthcare provider.',
                    consultation_fee: 150.00,
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

            console.log(`Successfully created ${user.role}: ${user.name}`)
          }
        } catch (error) {
          console.error(`Error creating ${user.email}:`, error)
        }
      }

      setUsersCreated(true)
      alert('Sample users created successfully! You can now test login.')
    } catch (error) {
      console.error('User creation failed:', error)
      setError('Failed to create users. Please try the manual SQL method.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">📋 Database User Creation Guide</h1>
            <p className="text-xl text-gray-600">Create sample users directly in your Supabase database</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h3 className="text-red-800 font-semibold">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Important Prerequisites</h3>
            <ul className="text-yellow-800 space-y-2">
              <li>• Ensure your database tables are created (users, providers, appointments)</li>
              <li>• Verify RLS policies are properly configured</li>
              <li>• Check that pgcrypto extension is enabled</li>
              <li>• Make sure you have proper permissions</li>
            </ul>
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
                  <p className="text-gray-600 text-xs mt-2">{user.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-brand-900 mb-3">🚀 Method 1: Automatic Creation (Recommended)</h3>
              <p className="text-brand-800 mb-4">
                Use the built-in API to create users automatically. This method handles all the complexity for you.
              </p>
              <button
                onClick={createUsersViaAPI}
                disabled={isLoading}
                className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '🔄 Creating Users...' : '✨ Create Users Automatically'}
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">🗄️ Method 2: Manual SQL Script</h3>
              <p className="text-green-800 mb-4">
                Copy and paste the SQL script below into your Supabase SQL Editor. This gives you full control over the user creation process.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-white font-semibold text-sm">SQL Script</h4>
                  <button
                    onClick={() => copyToClipboard(sqlScript)}
                    className="bg-brand-600 text-white px-3 py-1 rounded text-sm hover:bg-brand-700 transition-colors flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </button>
                </div>
                <pre className="text-green-400 text-xs overflow-x-auto max-h-64">
                  <code>{sqlScript}</code>
                </pre>
              </div>
              <a
                href="https://app.supabase.com/project/_/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase SQL Editor →
              </a>
            </div>
          </div>

          {usersCreated && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <h3 className="text-green-800 font-semibold">Success!</h3>
                  <p className="text-green-700">Sample users created successfully. You can now test login.</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-brand-900 mb-3">🎯 Ready to Test?</h3>
            <p className="text-brand-800 mb-4">
              Once you've created your users using either method, you can test them immediately!
            </p>
            <div className="space-y-3">
              <a
                href="/login-enhanced"
                className="inline-block bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
              >
                🚀 Test Login →
              </a>
              <a
                href="/auth-test"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                🔧 Run Auth Tests →
              </a>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔧 Troubleshooting</h3>
            <div className="text-yellow-800 space-y-2 text-sm">
              <p>• <strong>RLS Policy Errors:</strong> Make sure RLS policies are properly configured</p>
              <p>• <strong>Database Connection:</strong> Check your Supabase credentials in .env.local</p>
              <p>• <strong>Rate Limiting:</strong> If you get rate limit errors, wait a few minutes before retrying</p>
              <p>• <strong>Missing Tables:</strong> Run the database setup script first if tables don't exist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const sqlScript = `-- ROBUST USER CREATION SCRIPT
-- This script handles existing Triggers and Foreign Key constraints safely.

-- Step 1: Safe Cleanup (Delete children first to avoid Foreign Key errors)
-- 1a. Delete appointments for these test users
DELETE FROM public.appointments 
WHERE patient_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'))
   OR provider_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'));

-- 1b. Delete provider profiles
DELETE FROM public.providers 
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'));

-- 1c. Delete public users
DELETE FROM public.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');

-- 1d. Delete auth users (Finally)
DELETE FROM auth.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');

-- Step 2: Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 3: Create Auth Users
-- We store the IDs in variables or just use subqueries later. 
-- Here we insert them. If they somehow exist (shouldn't after delete), we do nothing.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES 
-- Patient
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'patient@test.com', crypt('TestPatient123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "John Patient", "role": "patient"}', false, NOW(), NOW()
),
-- Provider
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'provider@test.com', crypt('TestProvider123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "Dr. Sarah Provider", "role": "provider"}', false, NOW(), NOW()
),
-- Admin
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'admin@test.com', crypt('TestAdmin123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "Admin User", "role": "admin"}', true, NOW(), NOW()
);

-- Step 4: Upsert Public Users (Handles "Trigger already created this" case)
-- We use ON CONFLICT DO UPDATE to ensure the data is correct even if a trigger created the row.
INSERT INTO public.users (id, email, name, role, phone, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name', 
  raw_user_meta_data->>'role', 
  CASE WHEN email = 'patient@test.com' THEN '+1-555-0123' 
       WHEN email = 'provider@test.com' THEN '+1-555-0124' 
       ELSE '+1-555-0125' END,
  NOW(), 
  NOW()
FROM auth.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Step 5: Upsert Provider Profile
INSERT INTO public.providers (
  user_id, specialty, license_number, years_of_experience, education, bio, 
  consultation_fee, is_verified, availability, created_at, updated_at
)
SELECT 
  id, 
  'General Practice', 'MD-2024-001', 10, 'MD - Harvard Medical School', 
  'Experienced general practitioner with 10+ years in family medicine.', 
  150.00, true, 
  '{"monday": ["09:00", "10:00"], "tuesday": ["09:00", "10:00"]}'::jsonb, 
  NOW(), NOW()
FROM auth.users 
WHERE email = 'provider@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  is_verified = true;

-- Step 6: Create Sample Appointment
INSERT INTO public.appointments (
  patient_id, provider_id, appointment_date, appointment_time, duration_minutes, 
  status, appointment_type, notes, created_at, updated_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'patient@test.com'),
  (SELECT id FROM auth.users WHERE email = 'provider@test.com'),
  CURRENT_DATE + INTERVAL '1 day', '10:00:00', 30, 'scheduled', 'video', 
  'Initial consultation', NOW(), NOW()
-- We can't easily do ON CONFLICT here without a known ID, but since we deleted appointments in Step 1, this should be fine.
;

-- Step 7: Verify
SELECT email, role FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');`