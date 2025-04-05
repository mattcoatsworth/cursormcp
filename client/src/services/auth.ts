import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': '@supabase/auth-helpers-react'
    }
  }
})

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        username: email.split('@')[0]
      }
    }
  })
  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })
  if (error) throw error
  return data
}
