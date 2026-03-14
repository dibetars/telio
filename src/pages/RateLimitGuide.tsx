import { useState } from 'react'
import { AlertCircle, Clock, Mail, Key, Github, Chrome, CheckCircle, XCircle } from 'lucide-react'

export default function RateLimitGuide() {
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

  const checkRateLimitSQL = `-- Check current rate limit status
SELECT 
  COUNT(*) as email_count,
  MIN(created_at) as oldest_email,
  MAX(created_at) as newest_email
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND email_confirmed_at IS NOT NULL;

-- Check for recent sign-up attempts
SELECT 
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;`

  const alternativeAuthSQL = `-- Enable magic link authentication
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ;

-- Check OAuth providers configuration
SELECT * FROM auth.providers WHERE enabled = true;

-- Enable Google OAuth (requires Google Cloud Console setup)
INSERT INTO auth.providers (id, name, enabled, config) VALUES 
('google', 'Google', true, '{"client_id": "YOUR_GOOGLE_CLIENT_ID"}')
ON CONFLICT (id) DO UPDATE SET enabled = true;

-- Enable GitHub OAuth (requires GitHub App setup)  
INSERT INTO auth.providers (id, name, enabled, config) VALUES 
('github', 'GitHub', true, '{"client_id": "YOUR_GITHUB_CLIENT_ID"}')
ON CONFLICT (id) DO UPDATE SET enabled = true;`

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
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle />
          Email Rate Limit Exceeded
        </h1>

        <div style={{ 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.25rem' }}>
            Problem: Email Rate Limiting
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Supabase enforces email rate limits to prevent abuse. When you exceed the limit (typically 3-5 emails per hour), 
            you'll receive this error. This affects password-based authentication and email confirmations.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: '600' }}>Rate limit resets after 1 hour</span>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key />
            🔧 Immediate Solutions
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                1. Use Magic Link Authentication
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Magic links bypass email rate limits and provide a seamless user experience.
              </p>
              <a 
                href="/login-enhanced" 
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Try Magic Link Login →
              </a>
            </div>

            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                2. Use Social Login (Google/GitHub)
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                OAuth providers don't count against email rate limits and are more user-friendly.
              </p>
              <a 
                href="/login-enhanced" 
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Try Social Login →
              </a>
            </div>

            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                3. Wait for Rate Limit Reset
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
                Email rate limits automatically reset after 1 hour. Use this time to test other authentication methods.
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail />
            📊 Check Current Status
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Run this SQL query in your Supabase SQL editor to check current email usage:
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
              {checkRateLimitSQL}
            </pre>
            <button
              onClick={() => copyToClipboard(checkRateLimitSQL, 'check-status')}
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
              {copied === 'check-status' ? '✅ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Chrome />
            🔗 Configure OAuth Providers
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Set up social login providers to completely bypass email rate limits:
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
              {alternativeAuthSQL}
            </pre>
            <button
              onClick={() => copyToClipboard(alternativeAuthSQL, 'oauth-config')}
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
              {copied === 'oauth-config' ? '✅ Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#d97706', marginBottom: '0.5rem' }}>⚠️ OAuth Setup Required:</h4>
            <ul style={{ color: '#b45309', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
              <li><strong>Google:</strong> Create OAuth 2.0 credentials in Google Cloud Console</li>
              <li><strong>GitHub:</strong> Create OAuth App in GitHub Developer Settings</li>
              <li>Add your Supabase URL as authorized redirect URI</li>
              <li>Configure client IDs in Supabase Authentication settings</li>
            </ul>
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
          <h3 style={{ color: '#16a34a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle />
            🎯 Best Practices
          </h3>
          <ul style={{ color: '#15803d', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li><strong>Development:</strong> Use magic links or social login during testing</li>
            <li><strong>Production:</strong> Implement OAuth providers for better UX</li>
            <li><strong>Testing:</strong> Use different email addresses to avoid hitting limits</li>
            <li><strong>Monitoring:</strong> Track authentication attempts in your application</li>
            <li><strong>User Experience:</strong> Show clear error messages and retry guidance</li>
          </ul>
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#fef2f2', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '2px solid #ef4444',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle />
            ⚠️ Common Mistakes to Avoid
          </h3>
          <ul style={{ color: '#7f1d1d', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Don't repeatedly retry email authentication when rate limited</li>
            <li>Don't use the same email address for multiple test accounts rapidly</li>
            <li>Don't ignore rate limit errors - implement proper error handling</li>
            <li>Don't rely solely on email authentication in production</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/login-enhanced'}
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
            Try Enhanced Login
          </button>
          
          <button 
            onClick={() => window.location.href = '/simple-test'}
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
            Test Connection
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