import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ConnectionTest() {
  const [status, setStatus] = useState('Initializing...')
  const [details, setDetails] = useState<string[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    const testDetails: string[] = []
    
    try {
      setStatus('Testing basic connection...')
      
      // Test 1: Basic Supabase connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        testDetails.push(`❌ Auth connection failed: ${sessionError.message}`)
        setStatus('Connection Failed')
        setDetails(testDetails)
        return
      }
      
      testDetails.push('✅ Basic Supabase connection successful')
      
      // Test 2: Check authentication status
      setStatus('Checking authentication...')
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        testDetails.push(`⚠️  Auth check: ${userError.message}`)
      } else {
        testDetails.push(`✅ Auth system working${userData.user ? ` (user: ${userData.user.email})` : ' (no user logged in)'}`)
      }
      
      // Test 3: Test database connectivity (without custom tables)
      setStatus('Testing database connectivity...')
      try {
        // Try to query the built-in auth.users table (this should always work if connected)
        const { data, error } = await supabase.rpc('version')
        
        if (error) {
          testDetails.push(`⚠️  Database version check: ${error.message}`)
        } else {
          testDetails.push(`✅ Database connection working`)
          if (data) {
            testDetails.push(`📊 PostgreSQL version: ${data}`)
          }
        }
      } catch (dbError: any) {
        testDetails.push(`⚠️  Database test failed: ${dbError.message}`)
      }
      
      // Test 4: Try custom tables (this will fail if not created)
      setStatus('Testing custom tables...')
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(1)
        
        if (usersError) {
          testDetails.push(`❌ Custom users table not found: ${usersError.message}`)
          testDetails.push('📋 You need to run the database setup SQL in Supabase')
          testDetails.push('🔗 Go to /guide for setup instructions')
        } else {
          testDetails.push('✅ Custom users table accessible')
          testDetails.push(`📊 Found ${usersData?.length || 0} users`)
        }
      } catch (tableError: any) {
        testDetails.push(`❌ Table error: ${tableError.message}`)
        testDetails.push('📋 Database tables need to be created')
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
          Database Connection Test
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
                         detail.startsWith('✅') ? '#16a34a' : '#6b7280',
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
          backgroundColor: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
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
            onClick={testConnection}
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
            onClick={() => window.location.href = '/guide'}
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
            Setup Guide
          </button>
          
          <button 
            onClick={() => window.location.href = '/home'}
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
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}