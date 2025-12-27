import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export interface AdminUser {
  id: string
  email: string
  phone_number: string
  phone_verified: boolean
  email_verified: boolean
  is_verified: boolean
  type: 'admin' | 'vendor' | 'delivery_partner'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AdminUser | null
  loading: boolean
  error: string | null
}

// Store session in localStorage and cookies
const SESSION_KEY = 'rentok_admin_session'

// Set cookie helper
function setCookie(name: string, value: string, days: number = 1) {
  if (typeof window !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }
}

// Remove cookie helper
function removeCookie(name: string) {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`
  }
}

// Login function using admin table
export async function loginUser(email: string, password: string): Promise<AdminUser> {
  try {
    console.log('Attempting login with admin table...')
    
    console.log('email', email)
    console.log('password', password)

    const {data: adminUser, error: queryError} = await supabase.from("admins").select("*").eq("email", email).single();

    if (queryError || !adminUser) {
      console.error('User not found:', queryError)
      throw new Error('Invalid email or password')
    }

    console.log('User found, verifying password...')
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminUser.password)

    console.log('isPasswordValid', isPasswordValid)
    
    if (!isPasswordValid) {
      console.error('Invalid password')
      throw new Error('Invalid email or password')
    }

    // Check if user is verified
    if (!adminUser.is_verified) {
      throw new Error('Account not verified. Please verify your email and phone number.')
    }

    console.log('Login successful!')

    // Create session data (exclude password)
    const sessionUser: AdminUser = {
      id: adminUser.id,
      email: adminUser.email,
      phone_number: adminUser.phone_number,
      phone_verified: adminUser.phone_verified,
      email_verified: adminUser.email_verified,
      is_verified: adminUser.is_verified,
      type: adminUser.type,
      created_at: adminUser.created_at,
      updated_at: adminUser.updated_at
    }

    // Store session in both localStorage and cookie
    const sessionData = JSON.stringify({
      user: sessionUser,
      timestamp: Date.now()
    })
    
    localStorage.setItem(SESSION_KEY, sessionData)
    setCookie(SESSION_KEY, sessionData, 1) // 1 day expiry

    return sessionUser
  } catch (error) {
    console.error('Login error:', error)
    throw error instanceof Error ? error : new Error('Login failed')
  }
}

// Logout function
export async function logoutUser(): Promise<void> {
  try {
    // Clear session from localStorage
    localStorage.removeItem(SESSION_KEY)
    
    // Clear cookie with multiple domain/path combinations to ensure it's removed
    removeCookie(SESSION_KEY)
    
    // Also try removing with different paths (belt and suspenders approach)
    if (typeof window !== 'undefined') {
      // Remove for root path
      document.cookie = `${SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      // Remove for current path
      document.cookie = `${SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${window.location.pathname};`
      // Remove without path (some browsers need this)
      document.cookie = `${SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    }
    
    console.log('Logout: Session cleared successfully')
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, ensure localStorage is cleared
    if (typeof window !== 'undefined') {
      localStorage.clear() // Nuclear option
    }
  }
}

// Get current user from session
export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    const storedSessionData = localStorage.getItem(SESSION_KEY)
    
    if (!storedSessionData) {
      console.log('getCurrentUser: No session found')
      return null
    }

    const { user, timestamp } = JSON.parse(storedSessionData)
    
    // Check if session is expired (24 hours)
    const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - timestamp > SESSION_DURATION) {
      console.log('getCurrentUser: Session expired')
      await logoutUser() // Use proper logout to clear everything
      return null
    }

    // Verify user still exists and is active
    const { data: adminUser, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .eq('is_verified', true)
      .single()

    if (error || !adminUser) {
      console.log('getCurrentUser: User not found or not verified')
      await logoutUser() // Use proper logout to clear everything
      return null
    }

    // Update session with latest user data
    const updatedUser: AdminUser = {
      id: adminUser.id,
      email: adminUser.email,
      phone_number: adminUser.phone_number,
      phone_verified: adminUser.phone_verified,
      email_verified: adminUser.email_verified,
      is_verified: adminUser.is_verified,
      type: adminUser.type,
      created_at: adminUser.created_at,
      updated_at: adminUser.updated_at
    }

    const updatedSessionData = JSON.stringify({
      user: updatedUser,
      timestamp: Date.now()
    })

    localStorage.setItem(SESSION_KEY, updatedSessionData)
    setCookie(SESSION_KEY, updatedSessionData, 1)

    return updatedUser
  } catch (error) {
    console.error('getCurrentUser error:', error)
    await logoutUser() // Use proper logout to clear everything
    return null
  }
}

// Check if user has permission
export function hasPermission(user: AdminUser | null, permission: string): boolean {
  if (!user || !user.is_verified) return false

  const permissions = {
    canManageUsers: user.type === 'admin',
    canManageVendors: user.type === 'admin',
    canManageDeliveryPartners: user.type === 'admin',
    canManageProducts: user.type === 'admin' || user.type === 'vendor',
    canManageOrders: user.type === 'admin' || user.type === 'vendor',
    canViewReports: user.type === 'admin' || user.type === 'vendor',
    canManageCategories: user.type === 'admin',
    canManageSettings: user.type === 'admin',
    canManageDeliveries: user.type === 'admin' || user.type === 'delivery_partner',
    canViewDeliveries: user.type === 'delivery_partner'
  }

  return permissions[permission as keyof typeof permissions] || false
}

// Get redirect path based on user type
export function getRedirectPath(user: AdminUser): string {
  if (user.type === 'admin') return '/admin/dashboard'
  if (user.type === 'vendor') return '/vendor/dashboard'
  if (user.type === 'delivery_partner') return '/delivery/dashboard'
  return '/login'
}

// Check if session exists (for server-side)
export function getSessionFromCookie(cookieString?: string): AdminUser | null {
  if (typeof window === 'undefined') {
    // Server-side: we'll need to implement cookie-based sessions for middleware
    return null
  }
  
  // Client-side: use localStorage
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null
    
    const { user, timestamp } = JSON.parse(sessionData)
    const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    
    if (Date.now() - timestamp > SESSION_DURATION) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    
    return user
  } catch {
    return null
  }
}
