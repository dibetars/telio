import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  role: 'patient' | 'provider' | 'admin'
  full_name?: string
  created_at?: string
}

interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
  rateLimitInfo: {
    isRateLimited: boolean
    retryAfter: number | null
    message: string | null
  }
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, role: 'patient' | 'provider', fullName: string) => Promise<boolean>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signInWithGitHub: () => Promise<boolean>
  resetRateLimit: () => void
  clearError: () => void
}

const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  rateLimitInfo: {
    isRateLimited: false,
    retryAfter: null,
    message: null
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check for rate limit error
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          const retryAfter = extractRetryAfter(error.message)
          set({
            rateLimitInfo: {
              isRateLimited: true,
              retryAfter,
              message: 'Email rate limit exceeded. Please try again later or use alternative login methods.'
            },
            loading: false,
            error: 'Rate limit exceeded. Please wait before trying again.'
          })
          return false
        }
        
        set({ error: error.message, loading: false })
        return false
      }

      if (data.user) {
        // Fetch user role from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name, created_at')
          .eq('id', data.user.id)
          .single()

        if (userError || !userData) {
          console.error('Error fetching user data:', userError)
          throw new Error('User authenticated but profile not found. Please contact support or check database setup.')
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          role: userData.role,
          full_name: userData.full_name,
          created_at: userData.created_at
        }

        set({ 
          user, 
          session: data.session, 
          loading: false,
          rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
        })
        
        return true
      }
      
      return false
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  signUp: async (email: string, password: string, role: 'patient' | 'provider', fullName: string) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        // Check for rate limit error
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          const retryAfter = extractRetryAfter(error.message)
          set({
            rateLimitInfo: {
              isRateLimited: true,
              retryAfter,
              message: 'Email rate limit exceeded. Please try again later or use social login.'
            },
            loading: false,
            error: 'Rate limit exceeded. Please wait before trying again.'
          })
          return false
        }
        
        set({ error: error.message, loading: false })
        return false
      }

      if (data.user) {
        // Create user record in users table
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            role,
            full_name: fullName,
            created_at: new Date().toISOString()
          }])

        if (userError) {
          console.error('Error creating user record:', userError)
          throw new Error('Failed to create user profile. Please check database permissions.')
        }
        
        
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          role,
          full_name: fullName,
          created_at: new Date().toISOString()
        }

        set({ 
          user, 
          session: data.session, 
          loading: false,
          rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
        })
        
        return true
      }
      
      return false
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  signInWithMagicLink: async (email: string) => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        set({ error: error.message, loading: false })
        return false
      }

      // Magic link sent successfully
      set({ 
        loading: false,
        error: null,
        rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
      })
      
      // Show success message
      alert('Magic link sent! Check your email and click the link to sign in.')
      
      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        set({ error: error.message, loading: false })
        return false
      }

      // OAuth redirect will happen automatically
      set({ 
        loading: false,
        rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
      })
      
      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  signInWithGitHub: async () => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        set({ error: error.message, loading: false })
        return false
      }

      // OAuth redirect will happen automatically
      set({ 
        loading: false,
        rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
      })
      
      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      set({ 
        user: null, 
        session: null, 
        loading: false,
        rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  checkUser: async () => {
    set({ loading: true })
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      if (session?.user) {
        // Fetch user role from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name, created_at')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          role: userData?.role || 'patient',
          full_name: userData?.full_name,
          created_at: userData?.created_at
        }

        set({ 
          user, 
          session, 
          loading: false,
          rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null }
        })
      } else {
        set({ user: null, session: null, loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  resetRateLimit: () => {
    set({ 
      rateLimitInfo: { isRateLimited: false, retryAfter: null, message: null },
      error: null
    })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Helper function to extract retry time from error messages
function extractRetryAfter(errorMessage: string): number | null {
  const match = errorMessage.match(/(\d+)\s*(seconds?|minutes?|hours?)/i)
  if (match) {
    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()
    
    switch (unit) {
      case 'second':
      case 'seconds':
        return value
      case 'minute':
      case 'minutes':
        return value * 60
      case 'hour':
      case 'hours':
        return value * 3600
      default:
        return 60 // Default to 1 minute
    }
  }
  return 60 // Default to 1 minute
}

export default useAuthStore