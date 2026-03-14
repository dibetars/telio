import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UserCreationGuide() {
  const [activeTab, setActiveTab] = useState<'manual' | 'sql' | 'api'>('manual')

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

  const sqlScript = `-- SQL Script to Create Sample Users for Telehealth Platform
-- Run this in your Supabase SQL Editor

-- Create Patient User
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  'patient@test.com',
  crypt('TestPatient123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);

-- Create Provider User  
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  'provider@test.com',
  crypt('TestProvider123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);

-- Create Admin User
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  'admin@test.com',
  crypt('TestAdmin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);

-- Create User Profiles (these will be created automatically by trigger, but here's manual version)
INSERT INTO public.users (id, email, name, role) VALUES
  ((SELECT id FROM auth.users WHERE email = 'patient@test.com'), 'patient@test.com', 'John Patient', 'patient'),
  ((SELECT id FROM auth.users WHERE email = 'provider@test.com'), 'provider@test.com', 'Dr. Sarah Provider', 'provider'),
  ((SELECT id FROM auth.users WHERE email = 'admin@test.com'), 'admin@test.com', 'Admin User', 'admin');

-- Create Provider Profile
INSERT INTO public.providers (
  user_id,
  specialty,
  license_number,
  years_of_experience,
  education,
  bio,
  consultation_fee,
  is_verified,
  availability
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'provider@test.com'),
  'General Practice',
  'MD-2024-001',
  10,
  'MD - Harvard Medical School',
  'Experienced general practitioner with 10+ years in family medicine.',
  150.00,
  true,
  '{"monday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "tuesday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "wednesday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "thursday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "friday": ["09:00", "10:00", "11:00", "14:00", "15:00"]}'
);

-- Create Sample Appointments
INSERT INTO public.appointments (
  patient_id,
  provider_id,
  appointment_date,
  appointment_time,
  duration_minutes,
  status,
  appointment_type,
  notes
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'patient@test.com'),
  (SELECT id FROM public.providers WHERE user_id = (SELECT id FROM auth.users WHERE email = 'provider@test.com')),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  30,
  'scheduled',
  'video',
  'Initial consultation'
);`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">📋 Sample User Creation Guide</h1>
            <p className="text-xl text-gray-600">Multiple ways to create test users for your telehealth platform</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🧑‍💻 Manual Creation
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sql'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🗄️ SQL Script
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'api'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔌 API Method
            </button>
          </div>

          {/* Manual Creation Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-brand-900 mb-3">🚀 Recommended: Use the User Manager</h3>
                <p className="text-brand-800 mb-4">
                  The easiest way to create sample users is using our built-in User Manager. It handles all the complexity automatically.
                </p>
                <a
                  href="/user-manager"
                  className="inline-block bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Open User Manager →
                </a>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {sampleUsers.map((user, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-xl">
                          {user.role === 'patient' ? '🧑‍⚕️' : user.role === 'provider' ? '👨‍⚕️' : '👨‍💼'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800">{user.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
                        <code className="block bg-white px-2 py-1 rounded text-xs font-mono mt-1">{user.email}</code>
                      </div>
                      <div>
                        <strong>Password:</strong>
                        <code className="block bg-white px-2 py-1 rounded text-xs font-mono mt-1">{user.password}</code>
                      </div>
                      <p className="text-gray-600 text-xs mt-2">{user.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SQL Script Tab */}
          {activeTab === 'sql' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  <li>• Run this script in your Supabase SQL Editor</li>
                  <li>• The script uses the crypt() function - make sure pgcrypto extension is enabled</li>
                  <li>• User profiles will be created automatically by the trigger</li>
                  <li>• You may need to adjust the provider_id in appointments if providers don't exist</li>
                </ul>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">SQL Script</h3>
                  <button
                    onClick={() => copyToClipboard(sqlScript)}
                    className="bg-brand-600 text-white px-3 py-1 rounded text-sm hover:bg-brand-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{sqlScript}</code>
                </pre>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">✅ After Running SQL</h3>
                <p className="text-green-800">
                  Your users will be created and ready to use. You can test login with the credentials shown in the Manual tab.
                </p>
              </div>
            </div>
          )}

          {/* API Method Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">🔧 API Method</h3>
                <p className="text-purple-800 mb-4">
                  You can also create users programmatically using the Supabase Auth API or our User Manager component.
                </p>
                <div className="space-y-3">
                  <a
                    href="/user-manager"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Use User Manager →
                  </a>
                  <a
                    href="/login-enhanced"
                    className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Go to Login →
                  </a>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {sampleUsers.map((user, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-xl">
                          {user.role === 'patient' ? '🧑‍⚕️' : user.role === 'provider' ? '👨‍⚕️' : '👨‍💼'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800">{user.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
                        <code className="block bg-white px-2 py-1 rounded text-xs font-mono mt-1">{user.email}</code>
                      </div>
                      <div>
                        <strong>Password:</strong>
                        <code className="block bg-white px-2 py-1 rounded text-xs font-mono mt-1">{user.password}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-brand-900 mb-3">🎯 Ready to Test?</h3>
            <p className="text-brand-800 mb-4">
              Once you've created your users using any of the methods above, you can test them immediately!
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
        </div>
      </div>
    </div>
  )
}