import { useState } from 'react'

export default function RLSFixGuide() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, scriptName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(scriptName)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const quickFixSQL = `-- Quick Fix for Users Table RLS Registration Issue
-- This script specifically addresses the "new row violates row-level security policy" error

-- Step 1: Grant basic permissions to anon role for registration
GRANT SELECT ON users TO anon;
GRANT INSERT ON users TO anon;

-- Step 2: Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Step 3: Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create essential RLS policies for user registration and management

-- Allow anonymous users to register (create new user records)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Step 5: Verify permissions are set correctly
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;`

  const comprehensiveFixSQL = `-- Comprehensive RLS Fix for All Tables
-- This script fixes permissions for all tables in the telehealth platform

-- =============================================
-- USERS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON users TO anon;
GRANT INSERT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- =============================================
-- PROVIDERS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON providers TO anon;
GRANT SELECT ON providers TO authenticated;
GRANT INSERT ON providers TO authenticated;
GRANT UPDATE ON providers TO authenticated;

-- =============================================
-- APPOINTMENTS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON appointments TO authenticated;
GRANT INSERT ON appointments TO authenticated;
GRANT UPDATE ON appointments TO authenticated;

-- =============================================
-- CONSULTATIONS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON consultations TO authenticated;
GRANT INSERT ON consultations TO authenticated;
GRANT UPDATE ON consultations TO authenticated;

-- =============================================
-- MEDICAL_RECORDS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON medical_records TO authenticated;
GRANT INSERT ON medical_records TO authenticated;
GRANT UPDATE ON medical_records TO authenticated;

-- =============================================
-- MESSAGES TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;

-- =============================================
-- REVIEWS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON reviews TO authenticated;
GRANT INSERT ON reviews TO authenticated;

-- =============================================
-- VERIFICATION CODES TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON verification_codes TO authenticated;
GRANT INSERT ON verification_codes TO authenticated;
GRANT UPDATE ON verification_codes TO authenticated;

-- =============================================
-- NOTIFICATIONS TABLE PERMISSIONS
-- =============================================
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;`

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
        maxWidth: '800px', 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          color: '#dc2626', 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          fontWeight: 'bold'
        }}>
          🚨 RLS Policy Fix Guide
        </h1>

        <div style={{ 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Problem: "new row violates row-level security policy for table 'users'"
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '1rem', lineHeight: '1.5' }}>
            This error occurs when Row Level Security (RLS) is enabled on your tables but the proper permissions 
            haven't been configured. When users try to register, Supabase blocks the insert operation because 
            the 'anon' role (unauthenticated users) doesn't have permission to create new user records.
          </p>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem' }}>
            🔧 Quick Fix (Recommended)
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Copy and run this SQL script in your Supabase SQL editor to fix the users table registration issue:
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <pre style={{ 
              backgroundColor: '#1f2937', 
              color: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
              {quickFixSQL}
            </pre>
            <button
              onClick={() => copyToClipboard(quickFixSQL, 'quick-fix')}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {copied === 'quick-fix' ? '✅ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem' }}>
            🛡️ Comprehensive Fix (All Tables)
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            If you want to fix permissions for all tables at once, use this comprehensive script:
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <pre style={{ 
              backgroundColor: '#1f2937', 
              color: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
              {comprehensiveFixSQL}
            </pre>
            <button
              onClick={() => copyToClipboard(comprehensiveFixSQL, 'comprehensive')}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {copied === 'comprehensive' ? '✅ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#f0fdf4', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '2px solid #22c55e',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>
            📋 Step-by-Step Instructions
          </h3>
          <ol style={{ color: '#15803d', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li><strong>Open Supabase Dashboard:</strong> Go to your Supabase project</li>
            <li><strong>Navigate to SQL Editor:</strong> Click on "SQL Editor" in the left sidebar</li>
            <li><strong>Paste the SQL Script:</strong> Copy the Quick Fix script above</li>
            <li><strong>Run the Script:</strong> Click "Run" to execute the SQL commands</li>
            <li><strong>Verify Results:</strong> Check the output to confirm permissions were granted</li>
            <li><strong>Test Registration:</strong> Try registering a new user on your website</li>
          </ol>
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#fef3c7', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '2px solid #f59e0b',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#d97706', marginBottom: '1rem' }}>
            ⚠️ Important Notes
          </h3>
          <ul style={{ color: '#b45309', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li><strong>Security:</strong> These permissions allow unauthenticated users to register</li>
            <li><strong>RLS Policies:</strong> The policies ensure users can only access their own data</li>
            <li><strong>Production:</strong> Review and adjust permissions based on your security requirements</li>
            <li><strong>Testing:</strong> After running the script, test both registration and login functionality</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/simple-test'}
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
            Test Connection
          </button>
          
          <button 
            onClick={() => window.location.href = '/register'}
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
            Test Registration
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
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}