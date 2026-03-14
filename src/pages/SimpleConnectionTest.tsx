import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SimpleConnectionTest() {
  const [status, setStatus] = useState('Initializing...')
  const [details, setDetails] = useState<string[]>([])

  useEffect(() => {
    testSimpleConnection()
  }, [])

  const testSimpleConnection = async () => {
    const testDetails: string[] = []
    
    try {
      setStatus('Testing basic connection...')
      
      // Test 1: Check if Supabase client is configured correctly
      if (!supabase) {
        testDetails.push('❌ Supabase client not initialized')
        setStatus('Connection Failed')
        setDetails(testDetails)
        return
      }
      
      testDetails.push('✅ Supabase client initialized')
      
      // Test 2: Check if we can access the auth object (basic connectivity)
      if (!supabase.auth) {
        testDetails.push('❌ Auth object not available')
        setStatus('Connection Failed')
        setDetails(testDetails)
        return
      }
      
      testDetails.push('✅ Auth object accessible')
      
      // Test 3: Try to get current session (won't fail if no session)
      setStatus('Checking session status...')
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          testDetails.push(`⚠️  Session check: ${error.message}`)
        } else {
          testDetails.push('✅ Session check successful')
          if (data.session) {
            testDetails.push(`✅ User logged in: ${data.session.user.email}`)
          } else {
            testDetails.push('ℹ️  No active session (normal for testing)')
          }
        }
      } catch (authError: any) {
        testDetails.push(`⚠️  Auth error: ${authError.message}`)
      }
      
      // Test 4: Check environment variables
      testDetails.push('📋 Environment check:')
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (url && key) {
        testDetails.push('✅ Environment variables set')
        testDetails.push(`📍 URL: ${url.substring(0, 30)}...`)
        testDetails.push(`🔑 Key: ${key.substring(0, 10)}...`)
      } else {
        testDetails.push('❌ Environment variables missing')
        if (!url) testDetails.push('❌ VITE_SUPABASE_URL not set')
        if (!key) testDetails.push('❌ VITE_SUPABASE_ANON_KEY not set')
      }
      
      setStatus('Tests Completed')
      setDetails(testDetails)
      
    } catch (err: any) {
      testDetails.push(`❌ Unexpected error: ${err.message}`)
      setStatus('Test Failed')
      setDetails(testDetails)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '600px', 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          color: '#2563eb', 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          fontWeight: 'bold'
        }}>
          Simple Connection Test
        </h1>
        
        <div style={{ 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          backgroundColor: status.includes('Failed') ? '#fef2f2' : '#f0fdf4',
          border: `2px solid ${status.includes('Failed') ? '#ef4444' : '#22c55e'}`,
          marginBottom: '1.5rem'
        }}>
          <p style={{ 
            color: status.includes('Failed') ? '#dc2626' : '#16a34a',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {status}
          </p>
          
          {details.length > 0 && (
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              {details.map((detail, index) => (
                <p key={index} style={{ 
                  color: detail.startsWith('❌') ? '#dc2626' : 
                         detail.startsWith('⚠️') ? '#f59e0b' :
                         detail.startsWith('✅') ? '#16a34a' : 
                         detail.startsWith('ℹ️') ? '#6b7280' : '#4b5563',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'monospace'
                }}>
                  {detail}
                </p>
              ))}
            </div>
          )}
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#fef3c7', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #f59e0b',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#d97706', marginBottom: '0.5rem', fontWeight: '600' }}>
            🔒 Getting RLS Errors?
          </h3>
          <p style={{ color: '#b45309', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            If you're getting "row-level security policy" errors when trying to register or login,
            you need to fix the database permissions.
          </p>
          <button 
            onClick={() => window.location.href = '/rls-fix'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              marginRight: '0.5rem',
              marginBottom: '0.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
          >
            Fix RLS Permissions →
          </button>
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#fef2f2', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #ef4444',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '0.5rem', fontWeight: '600' }}>
            📧 Email Rate Limit Issues?
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            If you're getting "email rate limit exceeded" errors, try alternative authentication methods.
          </p>
          <button 
            onClick={() => window.location.href = '/rate-limit-guide'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            Fix Rate Limit Issues →
          </button>
        </div>

        <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#374151', marginBottom: '0.5rem', fontWeight: '600' }}>
            Configuration:
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            <strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={testSimpleConnection}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Run Tests Again
          </button>
          
          <button 
            onClick={() => window.location.href = '/basic-test'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            Basic Test
          </button>
          
          <button 
            onClick={() => window.location.href = '/guide'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            Setup Guide
          </button>
          
          <button 
            onClick={() => window.location.href = '/login-enhanced'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
          >
            Enhanced Login
          </button>
        </div>
      </div>
    </div>
  )
}