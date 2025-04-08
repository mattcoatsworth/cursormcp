import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Simplified auth that doesn't require real authentication
export const signUp = async (email: string, _password: string) => {
  return {
    user: {
      id: 'anonymous',
      email,
      user_metadata: {
        username: email.split('@')[0]
      }
    }
  }
}

export const signIn = async (email: string, _password: string) => {
  return {
    user: {
      id: 'anonymous',
      email,
      user_metadata: {
        username: email.split('@')[0]
      }
    }
  }
}
