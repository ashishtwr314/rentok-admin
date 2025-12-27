'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  CircularProgress
} from '@mui/material'
import { 
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Menu as MenuIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ShoppingBag as ShoppingBagIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../../components/Sidebar'
import { supabase } from '../../../../lib/supabase'
import { getCurrentUser } from '../../../../lib/auth'
import { useRouter, useParams } from 'next/navigation'

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

interface DeliveryPartner {
  delivery_partner_id: string
  name: string
  email: string
}

interface Order {
  order_id: string
  order_number: string
  profile_id: string
  subtotal: number
  delivery_charge: number
  discount_amount: number
  total_amount: number
  rental_start_date: string
  rental_end_date: string
  rental_days: number
  status: string
  delivery_status: string
  delivery_address: string
  contact_number: string
  payment_status: string
  payment_method?: string
  pickup_time?: string
  delivery_time?: string
  created_at: string
  updated_at: string
  profiles?: {
    name: string
    email: string
    mobile_number: string
  }
  order_items?: Array<{
    order_item_id: string
    quantity: number
    unit_price: number
    total_price: number
    selected_size?: string
    products: {
      title: string
      images: string[]
    }
  }>
}

const DeliveryOrderDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard')
  const [partner, setPartner] = useState<DeliveryPartner | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [orderStatus, setOrderStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')

  useEffect(() => {
    fetchData()
  }, [orderId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get current user from auth
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Fetch partner details
      const { data: partnerData, error: partnerError } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('email', currentUser.email)
        .single()

      if (partnerError) throw partnerError
      setPartner(partnerData)

      // Fetch order details with related data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:profile_id (
            name,
            email,
            mobile_number
          ),
          order_items (
            order_item_id,
            quantity,
            unit_price,
            total_price,
            selected_size,
            products (
              title,
              images
            )
          )
        `)
        .eq('order_id', orderId)
        .eq('delivery_partner_id', partnerData.delivery_partner_id)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        setSnackbar({ open: true, message: 'Order not found or not assigned to you', severity: 'error' })
        setTimeout(() => router.push('/delivery/dashboard'), 2000)
        return
      }

      setOrder(orderData)
      setOrderStatus(orderData.status)
      setPaymentStatus(orderData.payment_status)
    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbar({ open: true, message: 'Error loading data', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!order) return

    try {
      setSaving(true)

      const statusChanged = orderStatus !== order.status
      const paymentStatusChanged = paymentStatus !== order.payment_status

      // Update order in database
      const { error } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      // Add to order status history if status changed
      if (statusChanged) {
        await supabase
          .from('order_status_history')
          .insert([{
            order_id: orderId,
            status: orderStatus,
            notes: `Status updated by delivery partner: ${partner?.name}`,
            updated_by: `delivery_partner_${partner?.delivery_partner_id}`
          }])
      }

      // Send email notification to customer if status changed
      if (statusChanged && order.profiles?.email) {
        try {
          console.log('📧 Sending order status update email to customer...')
          
          const products = order.order_items?.map(item => ({
            title: item.products.title,
            quantity: item.quantity,
            image: item.products.images && item.products.images.length > 0 
              ? item.products.images[0] 
              : undefined
          })) || []

          const emailResponse = await fetch('/api/orders/send-status-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerName: order.profiles.name || 'Customer',
              customerEmail: order.profiles.email,
              orderNumber: order.order_number,
              orderStatus: orderStatus,
              previousStatus: order.status,
              orderDate: order.created_at,
              rentalStartDate: order.rental_start_date,
              rentalEndDate: order.rental_end_date,
              rentalDays: order.rental_days,
              totalAmount: order.total_amount,
              products: products,
              notes: `Your order status has been updated by our delivery partner.`,
            }),
          })

          if (emailResponse.ok) {
            console.log('✅ Email notification sent successfully')
          } else {
            console.error('❌ Failed to send email notification')
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError)
          // Don't fail the update if email fails
        }
      }

      setSnackbar({ 
        open: true, 
        message: statusChanged 
          ? 'Order updated and customer notified' 
          : 'Order updated successfully', 
        severity: 'success' 
      })
      
      // Refresh order data
      await fetchData()
    } catch (error) {
      console.error('Error updating order:', error)
      setSnackbar({ open: true, message: 'Error updating order', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    if (itemId === 'dashboard') {
      router.push('/delivery/dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('@/lib/auth')
      await logoutUser()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!order) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Typography>Order not found</Typography>
      </Box>
    )
  }

  const hasChanges = orderStatus !== order.status || paymentStatus !== order.payment_status

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          userRole="delivery_partner" 
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
          onLogout={handleLogout}
        />
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Box sx={{ width: 280 }}>
            <Sidebar 
              userRole="delivery_partner" 
              activeItem={activeMenuItem}
              onItemClick={(itemId) => {
                handleMenuItemClick(itemId)
                setMobileMenuOpen(false)
              }}
              onLogout={handleLogout}
            />
          </Box>
        </Drawer>
      )}
      
      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : '280px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
            color: 'white',
            p: isMobile ? 2 : 3,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => router.back()}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography 
                variant={isMobile ? 'h6' : 'h5'} 
                component="h1" 
                sx={{ fontWeight: 'bold' }}
              >
                Order Details
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {order.order_number}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: isMobile ? 2 : 3 }}>
          {/* Order Status Cards */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            {/* Status Update Section */}
            <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'} 
                  sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                >
                  Update Status
                </Typography>
                
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Order Status</InputLabel>
                    <Select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      label="Order Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      label="Payment Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                      <MenuItem value="refunded">Refunded</MenuItem>
                    </Select>
                  </FormControl>

                  {hasChanges && (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveChanges}
                      disabled={saving}
                      sx={{
                        bgcolor: THEME_COLORS.rentPrimary,
                        '&:hover': { bgcolor: THEME_COLORS.rentPrimaryDark },
                        py: 1.5
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'} 
                  sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                >
                  Customer Information
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.profiles?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Phone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.profiles?.mobile_number || order.contact_number}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <LocationIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Delivery Address
                      </Typography>
                      <Typography variant="body2">
                        {order.delivery_address}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'} 
                  sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                >
                  Order Information
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Rental Period
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {new Date(order.rental_start_date).toLocaleDateString()} - {new Date(order.rental_end_date).toLocaleDateString()} ({order.rental_days} days)
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Current Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Order: ${order.status}`}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          bgcolor: 
                            order.status === 'completed' ? '#4caf50' :
                            order.status === 'pending' ? '#ff9800' :
                            order.status === 'confirmed' ? '#2196f3' :
                            order.status === 'cancelled' ? '#f44336' :
                            '#9e9e9e',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Chip
                        label={`Payment: ${order.payment_status}`}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          bgcolor: 
                            order.payment_status === 'paid' ? '#4caf50' :
                            order.payment_status === 'pending' ? '#ff9800' :
                            order.payment_status === 'failed' ? '#f44336' :
                            '#9e9e9e',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Payment Method
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {order.payment_method || 'Not specified'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
              <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography 
                    variant={isMobile ? 'subtitle1' : 'h6'} 
                    sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                  >
                    Order Items
                  </Typography>
                  
                  <Stack spacing={2}>
                    {order.order_items.map((item) => (
                      <Box 
                        key={item.order_item_id}
                        sx={{ 
                          display: 'flex', 
                          gap: 2,
                          p: 1.5,
                          bgcolor: THEME_COLORS.tint,
                          borderRadius: 1
                        }}
                      >
                        {item.products.images && item.products.images.length > 0 && (
                          <Box
                            component="img"
                            src={item.products.images[0]}
                            alt={item.products.title}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.products.title}
                          </Typography>
                          {item.selected_size && (
                            <Typography variant="caption" color="text.secondary">
                              Size: {item.selected_size}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Quantity: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary, mt: 0.5 }}>
                            ₹{item.total_price.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Price Summary */}
            <Card sx={{ borderRadius: isMobile ? 2 : 1 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'} 
                  sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                >
                  Price Summary
                </Typography>
                
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{order.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Delivery Charge</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{order.delivery_charge.toFixed(2)}
                    </Typography>
                  </Box>

                  {order.discount_amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">Discount</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        -₹{order.discount_amount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      ₹{order.total_amount.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
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

export default DeliveryOrderDetailPage

