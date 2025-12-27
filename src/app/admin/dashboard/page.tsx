'use client'

import { useState, useEffect } from 'react'
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
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  Campaign as CampaignIcon,
  LocalOffer as DealIcon,
  Label as TagIcon
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

interface DashboardStats {
  totalVendors: number
  totalProducts: number
  totalCategories: number
  totalUsers: number
  rentedProducts: number
}

const AdminDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalVendors: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
    rentedProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)
  const { logout, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (hasFetched) return

      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json()
        
        if (result.data) {
          setStats(result.data)
        }
        
        if (!result.success) {
          const errorMsg = result.details?.hint || result.error || 'Failed to fetch dashboard stats'
          console.error('Dashboard stats error:', result)
          setError(errorMsg)
        }
        
        setHasFetched(true)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setError('Failed to connect to the server. Please check your connection.')
        setHasFetched(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [hasFetched])

  const handleLogout = async () => {
    try {
      console.log('Dashboard: Logout initiated')
      await logout()
      // AuthContext will handle redirect
    } catch (error) {
      console.error('Dashboard: Logout error:', error)
      // AuthContext will still handle redirect
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    // Handle navigation logic here
    switch (itemId) {
      case 'vendors':
        window.location.href = '/admin/vendors'
        break
      case 'dashboard':
        // Already on dashboard
        break
      // Add more routes as needed
      default:
        break
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        userRole="admin" 
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
            RentOK Admin Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
              {user?.email || 'admin@rentok.com'}
            </Typography>
            <Chip 
              label="ADMIN" 
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
            {user?.email?.charAt(0).toUpperCase() || 'A'}
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
            <AlertTitle>Database Connection Issue</AlertTitle>
            {error}
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Possible solutions:</strong>
              <br />
              • Check if Row Level Security (RLS) policies allow public read access in Supabase
              <br />
              • Verify your Supabase credentials in .env.local
              <br />
              • Ensure the database tables have been created and contain data
              <br />
              • Check the browser console and server logs for more details
            </Typography>
          </Alert>
        )}

        {/* Stats Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', mb: 4 }}>
            <CircularProgress sx={{ color: THEME_COLORS.primary }} size={60} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <StoreIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Total Vendors</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.totalVendors.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active vendors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                    Available products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CategoryIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Categories</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.totalCategories.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Product categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Total App Users</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registered users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ViewIcon sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>Rented Products</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                    {stats.rentedProducts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently active
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<StoreIcon />}
                  onClick={() => window.location.href = '/admin/vendors'}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Vendors
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<InventoryIcon />}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Products
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CategoryIcon />}
                  onClick={() => window.location.href = '/admin/categories'}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Categories
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DealIcon />}
                  onClick={() => window.location.href = '/admin/coupons'}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Coupons
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<TagIcon />}
                  onClick={() => window.location.href = '/admin/tags'}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Tags
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Additional Quick Actions */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              Marketing & Promotions
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CampaignIcon />}
                  onClick={() => window.location.href = '/admin/advertisements'}
                  sx={{
                    py: 2,
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                    color: 'white'
                  }}
                >
                  Manage Advertisements
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Admin Privileges */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              Admin Privileges
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, backgroundColor: THEME_COLORS.tint, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: THEME_COLORS.rentPrimary }}>
                    Full System Access
                  </Typography>
                  <Typography variant="body2">
                    • Manage all users and vendors<br/>
                    • Access all properties and bookings<br/>
                    • View financial reports<br/>
                    • System configuration
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, backgroundColor: THEME_COLORS.tint, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: THEME_COLORS.rentPrimary }}>
                    Administrative Tools
                  </Typography>
                  <Typography variant="body2">
                    • User role management<br/>
                    • Platform analytics<br/>
                    • Content moderation<br/>
                    • Support ticket management
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

export default AdminDashboard
