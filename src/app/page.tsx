'use client'

import { useAuth } from '@/contexts/AuthContext'
import { getRedirectPath } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in, redirect to appropriate dashboard
        const redirectPath = getRedirectPath(user)
        router.push(redirectPath)
      } else {
        // User is not logged in, redirect to login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Show loading while checking auth status
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  )
}
