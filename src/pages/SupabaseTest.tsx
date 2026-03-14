import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...')
  const [error, setError] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<any[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing basic connection...')
      
      // Test 1: Basic connection by checking if we can query the auth.users table
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        setError(`Auth connection failed: ${authError.message}`)
        setConnectionStatus('Connection Failed - Auth Error')
        return
      }
      
      setConnectionStatus('Auth connection successful!')
      
      // Test 2: Check if our custom tables exist
      const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (tableError) {
        setError(`Custom tables not found: ${tableError.message}. Please run the database setup SQL.`)
        setConnectionStatus('Tables Not Found')
        return
      }
      
      setConnectionStatus('Connected Successfully!')
      setError(null)
      
      // Test 3: Get table information
      const { data: tables, error: infoError } = await supabase
        .rpc('get_tables')
      
      if (tables) {
        setTableInfo(tables)
      }
      
    } catch (err: any) {
      setError(`Connection error: ${err.message}`)
      setConnectionStatus('Connection Failed')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
        <h1 style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }}>
          Supabase Connection Test
        </h1>
        <div style={{ 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          backgroundColor: error ? '#fef2f2' : '#f0fdf4',
          border: `2px solid ${error ? '#ef4444' : '#22c55e'}`,
          marginBottom: '1rem'
        }}>
          <p style={{ 
            color: error ? '#dc2626' : '#16a34a',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            {connectionStatus}
          </p>
          {error && (
            <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
        </div>
        
        <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Configuration:</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            <strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}
          </p>
        </div>

        {connectionStatus === 'Tables Not Found' && (
          <div style={{ textAlign: 'left', backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f59e0b' }}>
            <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>📝 Next Steps:</h3>
            <ol style={{ color: '#92400e', fontSize: '0.9rem', marginLeft: '1rem' }}>
              <li>Go to your Supabase dashboard</li>
              <li>Open the SQL Editor</li>
              <li>Run the database setup SQL script</li>
              <li>Return here to test again</li>
            </ol>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Go to Setup Guide
            </button>
          </div>
        )}
        
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
            marginRight: '1rem'
          }}
        >
          Test Again
        </button>
        <button 
          onClick={() => window.location.href = '/home'}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}