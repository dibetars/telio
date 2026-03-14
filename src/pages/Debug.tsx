import { useEffect, useState } from 'react'

export default function Debug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href,
        pathname: window.location.pathname,
        env: {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
          MODE: import.meta.env.MODE,
          DEV: import.meta.env.DEV,
          PROD: import.meta.env.PROD
        },
        localStorage: {
          'sb-zrotpnurlipgykxtxbnf-auth-token': localStorage.getItem('sb-zrotpnurlipgykxtxbnf-auth-token') ? 'Present' : 'Missing'
        }
      }
      setDebugInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="font-bold text-lg mb-2">Error Loading Debug Info</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Debug Information</h1>
          
          <div className="space-y-4">
            <div className="bg-brand-50 p-4 rounded-lg">
              <h2 className="font-semibold text-brand-900 mb-2">Environment</h2>
              <pre className="text-sm text-brand-800 overflow-x-auto">
                {JSON.stringify(debugInfo.env, null, 2)}
              </pre>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="font-semibold text-green-900 mb-2">Local Storage</h2>
              <pre className="text-sm text-green-800 overflow-x-auto">
                {JSON.stringify(debugInfo.localStorage, null, 2)}
              </pre>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="font-semibold text-yellow-900 mb-2">Browser Info</h2>
              <div className="text-sm text-yellow-800 space-y-1">
                <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
                <p><strong>Current URL:</strong> {debugInfo.location}</p>
                <p><strong>Pathname:</strong> {debugInfo.pathname}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="font-semibold text-purple-900 mb-2">Quick Actions</h2>
              <div className="space-y-2">
                <a href="/database-user-creation" className="block text-purple-700 hover:text-purple-900 underline">
                  → Create Sample Users in Database
                </a>
                <a href="/user-manager" className="block text-purple-700 hover:text-purple-900 underline">
                  → User Manager Interface
                </a>
                <a href="/user-creation-guide" className="block text-purple-700 hover:text-purple-900 underline">
                  → User Creation Guide
                </a>
                <a href="/complete-test" className="block text-purple-700 hover:text-purple-900 underline">
                  → Go to Complete Test Guide
                </a>
                <a href="/login-enhanced" className="block text-purple-700 hover:text-purple-900 underline">
                  → Test Enhanced Login
                </a>
                <a href="/auth-test" className="block text-purple-700 hover:text-purple-900 underline">
                  → Run Authentication Tests
                </a>
                <a href="/home" className="block text-purple-700 hover:text-purple-900 underline">
                  → View Home Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}