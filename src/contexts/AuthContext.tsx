'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AdminUser, AuthState, getCurrentUser } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  // Login function
  const login = async (email: string, password: string) => {
    console.log('AuthContext: login called', { email })
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('AuthContext: importing loginUser')
      const { loginUser } = await import('@/lib/auth')
      console.log('AuthContext: calling loginUser')
      const user = await loginUser(email, password)
      console.log('AuthContext: login successful', user)
      setState({ user, loading: false, error: null })
    } catch (error) {
      console.error('AuthContext: login error', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setState({ user: null, loading: false, error: errorMessage })
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    console.log('AuthContext: logout called')
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const { logoutUser } = await import('@/lib/auth')
      await logoutUser()
      console.log('AuthContext: logout successful')
      setState({ user: null, loading: false, error: null })
      
      // Force redirect to login after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('AuthContext: logout error', error)
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      setState({ user: null, loading: false, error: null }) // Still clear user even on error
      
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const user = await getCurrentUser()
      setState({ user, loading: false, error: null })
    } catch (error) {
      setState({ user: null, loading: false, error: null })
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    getCurrentUser().then(user => {
      setState({ user, loading: false, error: null })
    }).catch(() => {
      setState({ user: null, loading: false, error: null })
    })

    // Listen for storage changes (for logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rentok_admin_session') {
        if (e.newValue === null) {
          // Session was cleared
          setState({ user: null, loading: false, error: null })
        } else {
          // Session was updated, refresh user
          refreshUser()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
