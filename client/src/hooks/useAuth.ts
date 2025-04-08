import { useState } from 'react'
import { signIn, signUp } from '../services/auth'

interface User {
  id: string
  email: string
  user_metadata: {
    username: string
  }
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: Error | null
}

interface Credentials {
  email: string
  password: string
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  })

  const login = async ({ email, password }: Credentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { user } = await signIn(email, password)
      setState(prev => ({ ...prev, user }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const register = async ({ email, password }: Credentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { user } = await signUp(email, password)
      setState(prev => ({ ...prev, user }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const logout = () => {
    setState({
      user: null,
      isLoading: false,
      error: null
    })
  }

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout
  }
}
