import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Session cookie name
const SESSION_COOKIE = 'rentok_admin_session'

interface AdminUser {
  id: string
  email: string
  type: 'admin' | 'vendor'
  is_verified: boolean
}

// Get user from session cookie
function getUserFromSession(req: NextRequest): AdminUser | null {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value
    if (!sessionCookie) return null
    
    const sessionData = JSON.parse(sessionCookie)
    const { user, timestamp } = sessionData
    
    // Check if session is expired (24 hours)
    const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - timestamp > SESSION_DURATION) {
      return null
    }
    
    return user
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Get user from session
  const user = getUserFromSession(req)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && pathname === '/login') {
    const redirectPath = user.type === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'
    const redirectUrl = new URL(redirectPath, req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  if (user && !isPublicRoute) {
    // Admin routes protection
    if (pathname.startsWith('/admin') && user.type !== 'admin') {
      const redirectUrl = new URL('/vendor/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Vendor routes protection
    if (pathname.startsWith('/vendor') && user.type !== 'vendor') {
      const redirectUrl = new URL('/admin/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Root redirect based on user type
    if (pathname === '/') {
      const redirectPath = user.type === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'
      const redirectUrl = new URL(redirectPath, req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If no user and accessing root, redirect to login
  if (!user && pathname === '/') {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
