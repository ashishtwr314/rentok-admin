import { AuthProvider } from 'react-admin'
import { supabase } from './supabase'

interface UserProfile {
  user_type: 'admin' | 'vendor'
  profile: {
    id: string
    name: string
    role: string
    is_active: boolean
    [key: string]: unknown
  }
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Login failed')
      }

      // Get user profile from single admin_users table
      const { data: userProfile, error: profileError } = await supabase
        .from('admin_users')
        .select(`
          *,
          vendors:vendor_id (
            name,
            business_name,
            is_active
          )
        `)
        .eq('auth_user_id', data.user.id)
        .eq('is_active', true)
        .single()

      if (!userProfile || profileError) {
        throw new Error('No valid profile found for this user')
      }

      // Check if vendor is active (for vendor users)
      if (userProfile.user_type === 'vendor' && userProfile.vendors && !userProfile.vendors.is_active) {
        throw new Error('Vendor account is inactive')
      }

      const profileData: UserProfile = {
        user_type: userProfile.user_type as 'admin' | 'vendor',
        profile: userProfile
      }

      // Store user data
      localStorage.setItem('userProfile', JSON.stringify(profileData))
      
      // Set redirect path based on user type
      const redirectPath = profileData.user_type === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'
      localStorage.setItem('redirectPath', redirectPath)
      
      return Promise.resolve()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      throw new Error(errorMessage)
    }
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Silent fail for logout
    } finally {
      // Always clear local storage
      localStorage.removeItem('userProfile')
      localStorage.removeItem('redirectPath')
    }
    return Promise.resolve()
  },
  
  checkAuth: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        localStorage.removeItem('userProfile')
        localStorage.removeItem('redirectPath')
        return Promise.reject()
      }

      // Verify user still has valid profile using single table
      const { data: userProfile } = await supabase
        .from('admin_users')
        .select(`
          *,
          vendors:vendor_id (
            name,
            business_name,
            is_active
          )
        `)
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (!userProfile) {
        localStorage.removeItem('userProfile')
        localStorage.removeItem('redirectPath')
        return Promise.reject()
      }

      // Check if vendor is active (for vendor users)
      if (userProfile.user_type === 'vendor' && userProfile.vendors && !userProfile.vendors.is_active) {
        localStorage.removeItem('userProfile')
        localStorage.removeItem('redirectPath')
        return Promise.reject()
      }

      const profileData: UserProfile = {
        user_type: userProfile.user_type as 'admin' | 'vendor',
        profile: userProfile
      }

      // Update stored profile data
      localStorage.setItem('userProfile', JSON.stringify(profileData))
      
      return Promise.resolve()
    } catch {
      localStorage.removeItem('userProfile')
      localStorage.removeItem('redirectPath')
      return Promise.reject()
    }
  },
  
  checkError: (error) => {
    const status = error.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('userProfile')
      localStorage.removeItem('redirectPath')
      return Promise.reject()
    }
    return Promise.resolve()
  },
  
  getIdentity: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const profileStr = localStorage.getItem('userProfile')
      
      if (user && profileStr) {
        const profileData: UserProfile = JSON.parse(profileStr)
        const profile = profileData.profile
        
        return Promise.resolve({
          id: profile.id,
          fullName: profile.name,
          avatar: undefined, // Can be added later
          role: profile.role,
          userType: profileData.user_type,
          email: user.email
        })
      }
      return Promise.reject()
    } catch {
      return Promise.reject()
    }
  },
  
  getPermissions: async () => {
    try {
      const profileStr = localStorage.getItem('userProfile')
      
      if (profileStr) {
        const profileData: UserProfile = JSON.parse(profileStr)
        const profile = profileData.profile
        
        return Promise.resolve({
          role: profile.role,
          userType: profileData.user_type,
          permissions: {
            canManageUsers: profileData.user_type === 'admin' && profile.role === 'super_admin',
            canManageVendors: profileData.user_type === 'admin',
            canManageProducts: true,
            canManageOrders: true,
            canViewReports: true,
            canManageCategories: profileData.user_type === 'admin',
            canManageSettings: profileData.user_type === 'admin' && profile.role === 'super_admin'
          }
        })
      }
      return Promise.resolve({})
    } catch {
      return Promise.resolve({})
    }
  },
}
