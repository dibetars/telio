import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  role: 'patient' | 'provider' | 'admin' | 'organization'
  name: string
  phone?: string
  medical_history?: Record<string, unknown>
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,   // true until checkUser() resolves on first load
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        if (userError) throw userError
        set({ user: userData, loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  signUp: async (email: string, password: string, name: string, role: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      })
      if (error) throw error

      if (data.user) {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .upsert({ id: data.user.id, email, name, role }, { onConflict: 'id' })
          .select()
          .single()
        if (insertError) throw new Error('Profile creation failed: ' + insertError.message)

        // Create provider record
        if (role === 'provider') {
          const { error: providerError } = await supabase
            .from('providers')
            .insert({
              user_id: data.user.id,
              specialty: 'General Practice',
              license_number: 'TEMP-' + Date.now(),
              bio: '',
              consultation_fee: 0,
              is_verified: true,
            })
          if (providerError) console.warn('Provider record creation failed:', providerError.message)
        }

        // Create organization record
        if (role === 'organization') {
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({ user_id: data.user.id, name, is_verified: false })
          if (orgError) console.warn('Organization record creation failed:', orgError.message)
        }

        set({ user: userData, loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  checkUser: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single()
        if (error) throw error
        set({ user: userData, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))
