import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Clock, Key, Github, Chrome } from 'lucide-react'
import useAuthStore from '../stores/authStoreEnhanced'

export default function LoginEnhanced() {
  const navigate = useNavigate()
  const { signIn, signInWithMagicLink, signInWithGoogle, signInWithGitHub, loading, error, rateLimitInfo, resetRateLimit, clearError, user } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'password' | 'magic' | 'social'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter) {
      setCountdown(rateLimitInfo.retryAfter)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev > 1) {
            return prev - 1
          } else {
            resetRateLimit()
            return null
          }
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [rateLimitInfo.isRateLimited, rateLimitInfo.retryAfter, resetRateLimit])

  // Clear error when switching tabs
  useEffect(() => {
    clearError()
  }, [activeTab, clearError])

  // Navigate to dashboard when user is authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      alert('Please fill in all fields')
      return
    }
    
    const success = await signIn(email, password)
    if (success) {
      navigate('/dashboard')
    }
  }

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert('Please enter your email')
      return
    }
    
    const success = await signInWithMagicLink(email)
    if (success) {
      setMagicLinkSent(true)
    }
  }

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle()
    if (success) {
      navigate('/dashboard')
    }
  }

  const handleGitHubSignIn = async () => {
    const success = await signInWithGitHub()
    if (success) {
      navigate('/dashboard')
    }
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
        maxWidth: '500px', 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#2563eb', 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          fontWeight: 'bold'
        }}>
          Welcome Back
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem', 
          marginBottom: '2rem'
        }}>
          Sign in to access your telehealth account
        </p>

        {/* Rate Limit Warning */}
        {rateLimitInfo.isRateLimited && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '0.75rem', 
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle style={{ color: '#dc2626', width: '20px', height: '20px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.25rem' }}>
                Email Rate Limit Exceeded
              </p>
              <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {rateLimitInfo.message}
              </p>
              {countdown && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                  <Clock style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    Retry in: {formatCountdown(countdown)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Authentication Tabs */}
        <div style={{ 
          display: 'flex', 
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: activeTab === 'password' ? '#2563eb' : 'white',
              color: activeTab === 'password' ? 'white' : '#6b7280',
              border: 'none',
              borderRight: '1px solid #e5e7eb',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Lock style={{ width: '16px', height: '16px' }} />
            Password
          </button>
          <button
            onClick={() => setActiveTab('magic')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: activeTab === 'magic' ? '#2563eb' : 'white',
              color: activeTab === 'magic' ? 'white' : '#6b7280',
              border: 'none',
              borderRight: '1px solid #e5e7eb',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Mail style={{ width: '16px', height: '16px' }} />
            Magic Link
          </button>
          <button
            onClick={() => setActiveTab('social')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: activeTab === 'social' ? '#2563eb' : 'white',
              color: activeTab === 'social' ? 'white' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <User style={{ width: '16px', height: '16px' }} />
            Social
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            marginBottom: '1rem',
            color: '#dc2626',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Password Login Form */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSignIn} style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  width: '16px',
                  height: '16px'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading || rateLimitInfo.isRateLimited}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    backgroundColor: loading || rateLimitInfo.isRateLimited ? '#f3f4f6' : 'white'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  width: '16px',
                  height: '16px'
                }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading || rateLimitInfo.isRateLimited}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    backgroundColor: loading || rateLimitInfo.isRateLimited ? '#f3f4f6' : 'white'
                  }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || rateLimitInfo.isRateLimited}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: rateLimitInfo.isRateLimited ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: rateLimitInfo.isRateLimited ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Magic Link Form */}
        {activeTab === 'magic' && (
          <form onSubmit={handleMagicLinkSignIn} style={{ marginBottom: '1.5rem' }}>
            {magicLinkSent ? (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                marginBottom: '1rem',
                color: '#16a34a',
                textAlign: 'center'
              }}>
                <Mail style={{ width: '24px', height: '24px', marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Magic Link Sent!</p>
                <p style={{ fontSize: '0.9rem' }}>Check your email and click the link to sign in.</p>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ 
                    position: 'absolute', 
                    left: '0.75rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    width: '16px',
                    height: '16px'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || magicLinkSent}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: magicLinkSent ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: magicLinkSent ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Sending...' : magicLinkSent ? 'Link Sent' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {/* Social Login */}
        {activeTab === 'social' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
              Sign in with your preferred social account
            </p>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = loading ? '#dc2626' : '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              <Chrome style={{ width: '18px', height: '18px' }} />
              Continue with Google
            </button>
            
            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = loading ? '#1f2937' : '#111827'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            >
              <Github style={{ width: '18px', height: '18px' }} />
              Continue with GitHub
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            Don't have an account?{' '}
            <a 
              href="/register" 
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Sign up here
            </a>
          </p>
          <p>
            <a 
              href="/home" 
              style={{ color: '#6b7280', textDecoration: 'none' }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Back to Home
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}