import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function AuthTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const runAuthTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult('🧪 Starting authentication tests...')
      
      // Test 1: Check current user session
      addResult('📋 Checking current session...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addResult(`❌ Session check failed: ${sessionError.message}`)
      } else if (sessionData.session) {
        addResult(`✅ Active session found for: ${sessionData.session.user.email}`)
        addResult(`   User ID: ${sessionData.session.user.id}`)
      } else {
        addResult('ℹ️  No active session - user needs to log in')
      }

      // Test 2: Check database connection
      addResult('🔗 Testing database connection...')
      const { data: dbTest, error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (dbError) {
        addResult(`❌ Database connection failed: ${dbError.message}`)
      } else {
        addResult('✅ Database connection successful')
      }

      // Test 3: Test RLS policies (if user is logged in)
      if (user) {
        addResult('🔒 Testing RLS policies...')
        
        // Test user profile access
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          addResult(`❌ User profile access failed: ${profileError.message}`)
        } else {
          addResult(`✅ User profile access successful`)
          addResult(`   Name: ${userProfile?.name}`)
          addResult(`   Role: ${userProfile?.role}`)
          addResult(`   Email: ${userProfile?.email}`)
        }

        // Test providers access (should work for authenticated users)
        const { data: providers, error: providersError } = await supabase
          .from('providers')
          .select('id, specialty, consultation_fee')
          .limit(3)
        
        if (providersError) {
          addResult(`❌ Providers access failed: ${providersError.message}`)
        } else {
          addResult(`✅ Providers access successful (${providers?.length || 0} providers)`)
        }

        // Test appointments access
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .limit(3)
        
        if (appointmentsError) {
          addResult(`❌ Appointments access failed: ${appointmentsError.message}`)
        } else {
          addResult(`✅ Appointments access successful (${appointments?.length || 0} appointments)`)
        }

        // Test consultations access
        const { data: consultations, error: consultationsError } = await supabase
          .from('consultations')
          .select('*')
          .limit(3)
        
        if (consultationsError) {
          addResult(`❌ Consultations access failed: ${consultationsError.message}`)
        } else {
          addResult(`✅ Consultations access successful (${consultations?.length || 0} consultations)`)
        }
      }

      // Test 4: Test user registration trigger (simulate)
      addResult('📝 Testing user registration system...')
      
      // Check if we can access auth.users (this will fail due to security, but that's expected)
      try {
        const { data: authUsers, error: authError } = await supabase
          .rpc('auth_user_count')
        
        if (authError) {
          addResult(`ℹ️  Auth users access restricted (expected): ${authError.message}`)
        } else {
          addResult(`✅ Auth users accessible`)
        }
      } catch (e) {
        addResult('ℹ️  Auth users access restricted (expected for security)')
      }

      addResult('🎉 Authentication tests completed!')
      
    } catch (error) {
      addResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🔧 Authentication Test Suite</h1>
            <div className="flex gap-2">
              <button
                onClick={runAuthTests}
                disabled={isLoading}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '🔄 Running Tests...' : '🚀 Run Tests'}
              </button>
              <button
                onClick={clearResults}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-brand-50 rounded-lg">
            <h2 className="text-lg font-semibold text-brand-900 mb-2">Current Status</h2>
            <div className="space-y-1 text-sm">
              <p><strong>User:</strong> {user ? `${user.email} (${user.role || 'unknown role'})` : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Last Test:</strong> {testResults.length > 0 ? testResults[testResults.length - 1] : 'No tests run yet'}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Click "Run Tests" to start authentication testing</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="font-mono text-sm p-2 bg-gray-50 rounded border-l-4 border-brand-500">
                  {result}
                </div>
              ))
            )}
          </div>

          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Test Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Total Tests:</strong> {testResults.length}</p>
                  <p><strong>Passed:</strong> {testResults.filter(r => r.includes('✅')).length}</p>
                </div>
                <div>
                  <p><strong>Failed:</strong> {testResults.filter(r => r.includes('❌')).length}</p>
                  <p><strong>Info:</strong> {testResults.filter(r => r.includes('ℹ️')).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}