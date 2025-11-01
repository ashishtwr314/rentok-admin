'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Card, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { getRedirectPath } from '@/lib/auth'
import { useRouter } from 'next/navigation'

// Brand theme colors
const THEME_COLORS = {
  primary: '#FBA800', 
  secondary: '#9A2143',
  rentPrimary: '#9A2143',
  rentPrimaryDark: '#7a1a35',
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  tint: '#FCF5E9', 
}

export const SimpleLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loading, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = getRedirectPath(user)
      router.push(redirectPath)
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Login form submitted', { email, password: '***' })
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setError('')
    
    try {
      console.log('Attempting login...')
      await login(email, password)
      console.log('Login successful!')
      // Success - useEffect will handle redirect
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="lg">
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${THEME_COLORS.tint}`,
          }}
        >
          <Box sx={{ display: 'flex', minHeight: '600px', flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Login Form Section */}
            <Box 
              sx={{ 
                flex: 1,
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                backgroundColor: THEME_COLORS.tint
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#333',
                    textAlign: 'center',
                    mb: 3
                  }}
                >
                  Welcome Back
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#666',
                    textAlign: 'center',
                    mb: 4
                  }}
                >
                  Sign in to access your admin panel
                </Typography>

                {/* Development Mode Notice */}
                {process.env.NODE_ENV === 'development' && (
                  <Box
                    sx={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: 1,
                      p: 2,
                      mb: 3,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#856404', fontWeight: 500 }}>
                      🚧 Development Mode
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#856404', display: 'block' }}>
                      Admin: admin@rentok.com / admin123
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#856404', display: 'block' }}>
                      Vendor: vendor@rentok.com / vendor123
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        href="/test-upload"
                        sx={{
                          color: '#856404',
                          borderColor: '#856404',
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          '&:hover': {
                            backgroundColor: 'rgba(133, 100, 4, 0.1)',
                          }
                        }}
                      >
                        🧪 Test ImageKit Upload
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleLogin}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rentok.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: THEME_COLORS.rentPrimary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    required
                    disabled={loading}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: THEME_COLORS.rentPrimary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    required
                    disabled={loading}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !email || !password}
                    sx={{
                      py: 1.5,
                      background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                      color: 'white',
                      '&:hover': {
                        background: `linear-gradient(135deg, #e6970a 0%, ${THEME_COLORS.rentPrimaryDark} 100%)`,
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </Box>
            </Box>

            {/* Logo Section */}
            <Box 
              sx={{
                flex: 1,
                background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/logo-transparent-white.png"
                  alt="RentOK Logo"
                  sx={{
                    width: 300,
                    height: 300,
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mt: 2,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  RentOK Admin
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    mt: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  Manage your rental business with ease
                </Typography>
              </Box>
              
              {/* Decorative elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  zIndex: 1
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  zIndex: 1
                }}
              />
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}
