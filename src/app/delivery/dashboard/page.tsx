'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Divider,
  Stack,
  Tabs,
  Tab,
  Button,
  Badge,
  CircularProgress
} from '@mui/material'
import { 
  DeliveryDining as DeliveryIcon,
  LocationOn as LocationIcon,
  Menu as MenuIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  LocalShipping as TruckIcon,
  KeyboardReturn as ReturnIcon,
  History as HistoryIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { supabase } from '../../../lib/supabase'
import { getCurrentUser } from '../../../lib/auth'
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

interface DeliveryPartner {
  delivery_partner_id: string
  name: string
  email: string
  phone: string
  vehicle_type?: string
  vehicle_number?: string
  is_active: boolean
  city?: string
  state?: string
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
}

const DeliveryDashboardPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [activeMenuItem, setActiveMenuItem] = useState('today')
  const [partner, setPartner] = useState<DeliveryPartner | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [todayTab, setTodayTab] = useState(0) // 0 = Drop, 1 = Pickup
  const [completingOrder, setCompletingOrder] = useState<string | null>(null)

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      
      // Get current user from auth
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        window.location.href = '/login'
        return
      }

      // Fetch partner details
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('email', currentUser.email)
        .single()

      if (error) throw error
      setPartner(data)

      // Fetch orders for this delivery partner
      if (data?.delivery_partner_id) {
        await fetchOrders(data.delivery_partner_id)
      }
    } catch (error) {
      console.error('Error fetching partner data:', error)
      setSnackbar({ open: true, message: 'Error loading data', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async (deliveryPartnerId: string) => {
    try {
      setOrdersLoading(true)
      
      // Fetch all orders assigned to this delivery partner
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:profile_id (
            name,
            email,
            mobile_number
          )
        `)
        .eq('delivery_partner_id', deliveryPartnerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setSnackbar({ open: true, message: 'Error loading orders', severity: 'error' })
    } finally {
      setOrdersLoading(false)
    }
  }

  // Filter orders for Today's Drops (pending deliveries)
  const getTodayDrops = () => {
    return orders.filter(order => 
      (order.delivery_status === 'pending' || 
      order.delivery_status === 'picked_up' ||
      (!order.delivery_status && order.status !== 'cancelled' && order.status !== 'rejected')) &&
      order.status !== 'cancelled' &&
      order.status !== 'rejected'
    )
  }

  // Filter orders for Today's Pickups (items to be returned today or overdue)
  const getTodayPickups = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return orders.filter(order => {
      const endDate = new Date(order.rental_end_date)
      endDate.setHours(0, 0, 0, 0)
      
      return (
        endDate.getTime() <= today.getTime() && // Today or overdue
        order.status !== 'cancelled' &&
        order.status !== 'rejected' &&
        order.delivery_status === 'delivered' // MUST be delivered first before we can pick it up
      )
    })
  }

  // Filter all deliveries (completed, cancelled, etc.)
  const getCompletedDeliveries = () => {
    return orders.filter(order => 
      order.delivery_status === 'delivered' ||
      order.delivery_status === 'returned' ||
      order.status === 'cancelled' ||
      order.status === 'rejected'
    )
  }

  // Mark delivery as complete
  const markDeliveryComplete = async (orderId: string, type: 'drop' | 'pickup') => {
    try {
      setCompletingOrder(orderId)
      
      const newStatus = type === 'drop' ? 'delivered' : 'returned'
      const timeField = type === 'drop' ? 'delivery_time' : 'pickup_time'
      
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_status: newStatus,
          [timeField]: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `${type === 'drop' ? 'Delivery' : 'Pickup'} marked as complete!`, 
        severity: 'success' 
      })
      
      // Refresh orders
      if (partner?.delivery_partner_id) {
        await fetchOrders(partner.delivery_partner_id)
      }
    } catch (error) {
      console.error('Error marking delivery complete:', error)
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' })
    } finally {
      setCompletingOrder(null)
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    // Reset today tab when switching views
    if (itemId === 'today') {
      setTodayTab(0)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Delivery Dashboard: Logout initiated')
      const { logoutUser } = await import('@/lib/auth')
      await logoutUser()
      window.location.href = '/login'
    } catch (error) {
      console.error('Delivery Dashboard: Logout error:', error)
      // Force redirect anyway
      window.location.href = '/login'
    }
  }

  const renderOrderCard = (order: Order, type: 'drop' | 'pickup' | 'completed') => {
    // Check if pickup is overdue
    const isOverdue = type === 'pickup' && (() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endDate = new Date(order.rental_end_date)
      endDate.setHours(0, 0, 0, 0)
      return endDate.getTime() < today.getTime()
    })()

    return (
    <Card 
      key={order.order_id} 
      sx={{ 
        borderRadius: 2, 
        boxShadow: 2,
        border: '2px solid',
        borderColor: isOverdue ? '#f44336' : (type === 'drop' ? THEME_COLORS.primary : type === 'pickup' ? '#ff9800' : '#4caf50')
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Order Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              {order.order_number}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(order.created_at).toLocaleDateString()}
            </Typography>
            {isOverdue && (
              <Chip
                label="⚠️ OVERDUE"
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: '#f44336',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
            )}
          </Box>
          <Chip
            label={order.delivery_status || 'pending'}
            size="small"
            sx={{
              textTransform: 'capitalize',
              bgcolor: 
                order.delivery_status === 'delivered' ? '#4caf50' :
                order.delivery_status === 'returned' ? '#2196f3' :
                order.delivery_status === 'picked_up' ? '#ff9800' :
                '#9e9e9e',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Customer Info */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Customer
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {order.profiles?.name || 'N/A'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {order.profiles?.mobile_number || order.contact_number}
            </Typography>
          </Box>
        </Box>

        {/* Delivery Address */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {type === 'pickup' ? 'Pickup Address' : 'Delivery Address'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
            <Typography variant="body2">
              {order.delivery_address}
            </Typography>
          </Box>
        </Box>

        {/* Rental Period */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Rental Period
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2">
              {new Date(order.rental_start_date).toLocaleDateString()} - {new Date(order.rental_end_date).toLocaleDateString()} ({order.rental_days} days)
            </Typography>
          </Box>
        </Box>

        {type === 'completed' && order.delivery_time && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Completed At
            </Typography>
            <Typography variant="body2">
              {new Date(order.delivery_time).toLocaleString()}
            </Typography>
          </Box>
        )}

        {type === 'completed' && order.pickup_time && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Picked Up At
            </Typography>
            <Typography variant="body2">
              {new Date(order.pickup_time).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Bottom Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Total Amount
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
              ₹{order.total_amount.toFixed(2)}
            </Typography>
          </Box>
          {type !== 'completed' && (
            <Button
              variant="contained"
              size="small"
              startIcon={completingOrder === order.order_id ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
              disabled={completingOrder === order.order_id}
              onClick={() => markDeliveryComplete(order.order_id, type)}
              sx={{
                bgcolor: type === 'drop' ? THEME_COLORS.primary : '#ff9800',
                '&:hover': {
                  bgcolor: type === 'drop' ? THEME_COLORS.secondary : '#f57c00'
                }
              }}
            >
              {completingOrder === order.order_id ? 'Marking...' : 'Mark Complete'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
    )
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Avatar 
                sx={{ 
                  mr: isMobile ? 1.5 : 2, 
                  width: isMobile ? 45 : 60, 
                  height: isMobile ? 45 : 60,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: isMobile ? '1.2rem' : '1.5rem'
                }}
              >
                {partner?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography 
                  variant={isMobile ? 'h6' : 'h4'} 
                  component="h1" 
                  sx={{ fontWeight: 'bold', mb: 0.5 }}
                >
                  {isMobile ? partner?.name?.split(' ')[0] : `Welcome, ${partner?.name}!`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    label={partner?.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{ 
                      bgcolor: partner?.is_active ? 'rgba(76,175,80,0.9)' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      height: isMobile ? 20 : 24,
                      fontSize: isMobile ? '0.7rem' : '0.8rem'
                    }}
                  />
                  <Chip
                    label={activeMenuItem === 'today' ? '📅 Today' : '📋 All Deliveries'}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                      height: isMobile ? 20 : 24,
                      fontSize: isMobile ? '0.7rem' : '0.8rem'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: isMobile ? 2 : 3 }}>
          {/* TODAY Section */}
          {activeMenuItem === 'today' && (
            <Box>
              {/* Sub-tabs for Drop vs Pickup */}
              <Card sx={{ mb: 3 }}>
                <Tabs
                  value={todayTab}
                  onChange={(e, newValue) => setTodayTab(newValue)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: THEME_COLORS.tint
                  }}
                >
                  <Tab 
                    icon={<TruckIcon />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>Drop (Deliver)</Typography>
                        <Chip 
                          label={getTodayDrops().length} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                    }
                  />
                  <Tab 
                    icon={<ReturnIcon />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>Pickup (Return)</Typography>
                        <Chip 
                          label={getTodayPickups().length} 
                          size="small" 
                          color="warning"
                        />
                      </Box>
                    }
                  />
                </Tabs>
              </Card>

              {/* Drop Tab Content */}
              {todayTab === 0 && (
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                  >
                    🚚 Today's Deliveries ({getTodayDrops().length})
                  </Typography>

                  {ordersLoading ? (
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading deliveries...</Typography>
                      </CardContent>
                    </Card>
                  ) : getTodayDrops().length === 0 ? (
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <TruckIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary">
                          No deliveries for today!
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : (
                    <Stack spacing={2}>
                      {getTodayDrops().map((order) => renderOrderCard(order, 'drop'))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* Pickup Tab Content */}
              {todayTab === 1 && (
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
                  >
                    📦 Today's Pickups & Overdue Returns ({getTodayPickups().length})
                  </Typography>

                  {ordersLoading ? (
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading pickups...</Typography>
                      </CardContent>
                    </Card>
                  ) : getTodayPickups().length === 0 ? (
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <ReturnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary">
                          No pickups for today!
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : (
                    <Stack spacing={2}>
                      {getTodayPickups().map((order) => renderOrderCard(order, 'pickup'))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ALL DELIVERIES Section */}
          {activeMenuItem === 'all-deliveries' && (
            <Box>
              <Typography 
                variant="h6" 
                sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}
              >
                📋 All Completed Deliveries ({getCompletedDeliveries().length})
              </Typography>

              {ordersLoading ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography color="text.secondary" sx={{ mt: 2 }}>Loading deliveries...</Typography>
                  </CardContent>
                </Card>
              ) : getCompletedDeliveries().length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      No completed deliveries yet!
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={2}>
                  {getCompletedDeliveries().map((order) => renderOrderCard(order, 'completed'))}
                </Stack>
              )}
            </Box>
          )}
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

export default DeliveryDashboardPage
