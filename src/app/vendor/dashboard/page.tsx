'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material'
import { 
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { useAuth } from '../../../contexts/AuthContext'
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

interface VendorStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  activeRentals: number
  totalRevenue: number
  monthlyRevenue: number
}

const VendorDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard')
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    activeRentals: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)
  const { logout, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchVendorStats = async () => {
      if (!user?.id || hasFetched) {
        if (!user?.id) {
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/vendor/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id })
        })
        const result = await response.json()
        
        if (result.data) {
          setStats(result.data)
        }
        
        if (!result.success) {
          const errorMsg = result.error || 'Failed to fetch vendor stats'
          console.error('Vendor stats error:', result)
          setError(errorMsg)
        }
        
        setHasFetched(true)
      } catch (error) {
        console.error('Error fetching vendor stats:', error)
        setError('Failed to connect to the server. Please check your connection.')
        setHasFetched(true)
      } finally {
        setLoading(false)
      }
    }

    fetchVendorStats()
  }, [user?.id, hasFetched])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: clear localStorage and redirect
      localStorage.clear()
      router.push('/login')
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    // Handle navigation logic here
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        userRole="vendor" 
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <Box sx={{ flex: 1, marginLeft: '280px', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            RentOK Vendor Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
              {user?.email || 'vendor@rentok.com'}
            </Typography>
            <Chip 
              label="VENDOR" 
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }} 
            />
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            {user?.email?.charAt(0).toUpperCase() || 'V'}
          </Avatar>
          <Button 
            variant="outlined" 
            onClick={handleLogout}
            sx={{ 
              color: 'white', 
              borderColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Unable to Load Stats</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', mb: 4 }}>
            <CircularProgress sx={{ color: THEME_COLORS.primary }} size={60} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Total Products</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.totalProducts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your listed products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ActiveIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Active Products</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.activeProducts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently available
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <OrderIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Total Orders</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.totalOrders.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time orders
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ActiveIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Active Rentals</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.activeRentals.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently rented
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>This Month</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold', fontSize: '1.75rem' }}>
                    {formatCurrency(stats.monthlyRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Quick Actions */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/vendor/add-product')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Add Product
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<InventoryIcon />}
                  onClick={() => router.push('/vendor/products')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  My Products
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<OrderIcon />}
                  onClick={() => router.push('/vendor/orders')}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Orders
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<TrendingUpIcon />}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Analytics
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Vendor Features */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              Vendor Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: THEME_COLORS.tint, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: THEME_COLORS.rentPrimary }}>
                    Product Management
                  </Typography>
                  <Typography variant="body2">
                    • Add and edit your products<br/>
                    • Upload photos and descriptions<br/>
                    • Set pricing and availability<br/>
                    • Manage product specifications
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: THEME_COLORS.tint, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: THEME_COLORS.rentPrimary }}>
                    Order Management
                  </Typography>
                  <Typography variant="body2">
                    • View rental orders<br/>
                    • Track order status<br/>
                    • Manage active rentals<br/>
                    • Monitor earnings & revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      </Box>
    </Box>
  )
}

export default VendorDashboard
