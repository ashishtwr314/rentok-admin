'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  Button,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material'
import { 
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { VendorProductForm } from '../../../components/VendorProductForm'
import { supabase } from '../../../lib/supabase'
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

interface Category {
  category_id: string
  name: string
}

const VendorAddProductPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('add-product')
  const [categories, setCategories] = useState<Category[]>([])
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [openProductForm, setOpenProductForm] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const { logout, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hasFetched) return
    
    // Wait for auth to finish loading
    if (authLoading) return
    
    if (user) {
      fetchVendorInfo()
      fetchCategories()
      setHasFetched(true)
    } else {
      // If no user after auth loads, set loading to false
      setLoading(false)
      setHasFetched(true)
    }
  }, [user, authLoading, hasFetched])

  const fetchVendorInfo = async () => {
    if (!user) return

    try {
      // Get vendor ID by finding the vendor record that matches the user's email
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('vendor_id')
        .eq('email', user.email)
        .eq('is_active', true)
        .single()

      if (vendorError || !vendorData) {
        console.error('Vendor not found:', vendorError)
        setSnackbar({ open: true, message: 'Vendor profile not found', severity: 'error' })
        return
      }

      setCurrentVendorId(vendorData.vendor_id)
    } catch (error) {
      console.error('Error fetching vendor info:', error)
      setSnackbar({ open: true, message: 'Error loading vendor information', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('category_id, name')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.clear()
      router.push('/login')
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    if (itemId === 'dashboard') {
      router.push('/vendor/dashboard')
    } else if (itemId === 'my-products') {
      router.push('/vendor/products')
    }
  }

  const handleSaveProduct = async (productData: any) => {
    if (!currentVendorId) {
      setSnackbar({ open: true, message: 'Vendor ID not found', severity: 'error' })
      return
    }

    try {
      const productPayload = {
        ...productData,
        vendor_id: currentVendorId,
        created_by_admin: false,
        is_active: false // Vendors cannot activate products, only admins can
      }

      // Create new product
      const { error } = await supabase
        .from('products')
        .insert(productPayload)

      if (error) throw error
      
      setSnackbar({ open: true, message: 'Product submitted for admin approval!', severity: 'success' })
      setOpenProductForm(false)
      
      // Redirect to products page after successful creation
      setTimeout(() => {
        router.push('/vendor/products')
      }, 2000)
      
    } catch (error) {
      console.error('Error saving product:', error)
      setSnackbar({ open: true, message: 'Error creating product', severity: 'error' })
    }
  }

  const handleOpenForm = () => {
    setOpenProductForm(true)
  }

  const handleCloseForm = () => {
    setOpenProductForm(false)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
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
            <AddIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Add New Product
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/vendor/products')}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            Back to Products
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Welcome Card */}
          <Card elevation={3} sx={{ mb: 4 }}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: THEME_COLORS.tint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <AddIcon sx={{ fontSize: 40, color: THEME_COLORS.rentPrimary }} />
              </Box>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary, mb: 2 }}>
                Ready to Add a New Product?
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Create a new rental product for your store. Your product will be submitted for admin review 
                and approval before becoming visible to customers. Fill in all the details including images, 
                pricing, sizes, and descriptions.
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenForm}
                sx={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(154, 33, 67, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(154, 33, 67, 0.4)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Create Product
              </Button>
            </Box>
          </Card>

          {/* Tips Card */}
          <Card elevation={3}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary, mb: 3 }}>
                💡 Tips for Creating Great Products
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📸 High-Quality Images
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload clear, well-lit photos from multiple angles. Good images increase rental bookings by up to 40%.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    💰 Competitive Pricing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Research similar products and price competitively. Consider offering discounts for longer rental periods.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📝 Detailed Descriptions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Include material, care instructions, sizing details, and styling suggestions to help customers make decisions.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🏷️ Relevant Tags
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use descriptive tags like "wedding", "designer", "cotton" to help customers find your products easily.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Product Form Dialog */}
      <VendorProductForm
        open={openProductForm}
        onClose={handleCloseForm}
        onSave={handleSaveProduct}
        categories={categories}
        loading={loading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default VendorAddProductPage
