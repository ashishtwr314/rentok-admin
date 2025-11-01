'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress
} from '@mui/material'
import { 
  ShoppingCart as OrderIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  LocalShipping as DeliveryIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Image as ImageIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

interface OrderItem {
  order_item_id: string
  product_id: string
  selected_size?: string
  quantity: number
  unit_price: number
  total_price: number
  products: {
    product_id: string
    title: string
    images: string[]
    vendor_id?: string
  }
}

interface Order {
  order_id: string
  profile_id: string
  order_number: string
  subtotal: number
  delivery_charge: number
  discount_amount: number
  total_amount: number
  rental_start_date: string
  rental_end_date: string
  rental_days: number
  status: string
  coupon_code?: string
  delivery_address: string
  contact_number: string
  payment_status: string
  payment_method?: string
  created_at: string
  updated_at: string
  profiles: {
    user_id: string
    name?: string
    full_name?: string
    email?: string
    mobile_number: string
    city?: string
    state?: string
    country?: string
  }
  order_items: OrderItem[]
}

const VendorOrdersPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const { logout, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchVendorOrders()
    }
  }, [user])

  const fetchVendorOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get vendor ID
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

      const vendorId = vendorData.vendor_id
      setCurrentVendorId(vendorId)

      // Fetch all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!inner(
            user_id,
            name,
            full_name,
            email,
            mobile_number,
            city,
            state,
            country
          ),
          order_items!inner(
            order_item_id,
            product_id,
            selected_size,
            quantity,
            unit_price,
            total_price,
            products!inner(
              product_id,
              title,
              images,
              vendor_id
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Filter orders to only include those with at least one item from this vendor
      const vendorOrders = allOrders?.filter(order => 
        order.order_items?.some(item => item.products?.vendor_id === vendorId)
      ).map(order => ({
        ...order,
        // Filter order items to only show items from this vendor
        order_items: order.order_items?.filter(item => item.products?.vendor_id === vendorId)
      })) || []

      setOrders(vendorOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setSnackbar({ open: true, message: 'Error fetching orders', severity: 'error' })
    } finally {
      setLoading(false)
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

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return

    try {
      setUpdating(true)
      
      // Use API route to update order status (which will also send email to customer)
      const updateData: any = {
        updated_by: `vendor-${currentVendorId}`
      }

      if (newStatus) {
        updateData.status = newStatus
      }

      if (newPaymentStatus) {
        updateData.payment_status = newPaymentStatus
      }

      if (statusNotes) {
        updateData.notes = statusNotes
      }

      const response = await fetch(`/api/orders/${selectedOrder.order_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order')
      }

      // Show appropriate message based on what was updated
      let successMessage = 'Order updated successfully'
      if (newStatus && newStatus !== selectedOrder.status) {
        successMessage += '. Customer has been notified via email.'
      }

      setSnackbar({ open: true, message: successMessage, severity: 'success' })
      setViewDetailsOpen(false)
      setSelectedOrder(null)
      setNewStatus('')
      setNewPaymentStatus('')
      setStatusNotes('')
      fetchVendorOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Error updating order', severity: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setNewPaymentStatus(order.payment_status)
    setStatusNotes('')
    setViewDetailsOpen(true)
  }

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const customerName = order.profiles?.name || order.profiles?.full_name || ''
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.mobile_number.includes(searchTerm)
    
    const matchesStatus = !statusFilter || order.status === statusFilter
    const matchesPaymentStatus = !paymentStatusFilter || order.payment_status === paymentStatusFilter

    return matchesSearch && matchesStatus && matchesPaymentStatus
  })

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'processing': return 'info'
      case 'shipped': return 'primary'
      case 'delivered': return 'success'
      case 'cancelled': return 'error'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning'
      case 'paid': return 'success'
      case 'cancelled': return 'error'
      case 'failed': return 'error'
      case 'refunded': return 'info'
      default: return 'default'
    }
  }

  // Calculate vendor-specific amounts (only for items from this vendor)
  const calculateVendorAmount = (order: Order) => {
    return order.order_items?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0
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
            <OrderIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                My Orders
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage orders for your products
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReceiptIcon sx={{ fontSize: 40, color: THEME_COLORS.primary, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      {orders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AcceptIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {orders.filter(o => o.status === 'delivered').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivered
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DeliveryIcon sx={{ fontSize: 40, color: '#2196f3', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {orders.filter(o => o.status === 'pending' || o.status === 'processing').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {formatPrice(orders.reduce((sum, order) => sum + calculateVendorAmount(order), 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: THEME_COLORS.rentPrimary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                Search & Filters
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={6}>
                <TextField
                  fullWidth
                  placeholder="Search by order number, customer name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3} lg={3}>
                <FormControl fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Order Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3} lg={3}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatusFilter}
                    label="Payment Status"
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {(searchTerm || statusFilter || paymentStatusFilter) && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('')
                    setPaymentStatusFilter('')
                  }}
                  sx={{
                    color: THEME_COLORS.rentPrimary,
                    borderColor: THEME_COLORS.rentPrimary,
                  }}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Card>

          {/* Orders Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Order Details</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Rental Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order.order_id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              #{order.order_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(order.created_at)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, bgcolor: THEME_COLORS.tint, color: THEME_COLORS.rentPrimary }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {order.profiles?.name || order.profiles?.full_name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.profiles?.mobile_number}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.order_items?.length || 0} item(s)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption" display="block">
                              {formatDate(order.rental_start_date)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              to {formatDate(order.rental_end_date)}
                            </Typography>
                            <Chip 
                              label={`${order.rental_days} days`} 
                              size="small" 
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                            {formatPrice(calculateVendorAmount(order))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Your items)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.payment_status}
                            color={getPaymentStatusColor(order.payment_status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(order)}
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
            />
          </Card>
        </Box>
      </Box>

      {/* View Order Details Dialog */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2
        }}>
          <ReceiptIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Order #{selectedOrder?.order_number}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedOrder && (
            <Box>
              {/* Status Bar */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: THEME_COLORS.tint,
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Chip 
                  label={`Order Status: ${selectedOrder.status}`} 
                  color={getStatusColor(selectedOrder.status)}
                  sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                />
                <Chip 
                  label={`Payment: ${selectedOrder.payment_status}`} 
                  color={getPaymentStatusColor(selectedOrder.payment_status)}
                  sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                />
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Customer Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedOrder.profiles?.name || selectedOrder.profiles?.full_name || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedOrder.profiles?.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedOrder.profiles?.mobile_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>City:</strong> {selectedOrder.profiles?.city || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Delivery Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Delivery Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedOrder.delivery_address}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact:</strong> {selectedOrder.contact_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Rental Period:</strong> {formatDate(selectedOrder.rental_start_date)} - {formatDate(selectedOrder.rental_end_date)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {selectedOrder.rental_days} days
                  </Typography>
                </Box>
              </Grid>

              {/* Order Items (Only vendor's items) */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Your Items in this Order
                </Typography>
                {selectedOrder.order_items?.map((item) => (
                  <Card key={item.order_item_id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.products.images && item.products.images.length > 0 ? (
                        <Image
                          src={item.products.images[0]}
                          alt={item.products.title}
                          width={80}
                          height={80}
                          style={{ borderRadius: 8, objectFit: 'cover' }}
                        />
                      ) : (
                        <Avatar sx={{ width: 80, height: 80, bgcolor: THEME_COLORS.tint }}>
                          <ImageIcon sx={{ fontSize: 40, color: THEME_COLORS.rentPrimary }} />
                        </Avatar>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.products.title}
                        </Typography>
                        {item.selected_size && (
                          <Typography variant="body2">
                            Size: {item.selected_size}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          Quantity: {item.quantity} × {formatPrice(item.unit_price)} = {formatPrice(item.total_price)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Grid>

              {/* Payment Summary for Vendor's Items */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Your Earnings from this Order
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      {formatPrice(calculateVendorAmount(selectedOrder))}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`Payment: ${selectedOrder.payment_status}`} color={getPaymentStatusColor(selectedOrder.payment_status)} />
                  </Box>
                </Box>
              </Grid>

                  {/* Update Status Section */}
                  <Grid item xs={12}>
                    <Card sx={{ p: 2.5, backgroundColor: '#fff7e6', border: '2px solid ' + THEME_COLORS.primary }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AcceptIcon sx={{ color: THEME_COLORS.rentPrimary, mr: 1, fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                          Update Order & Payment Status
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Order Status</InputLabel>
                            <Select
                              value={newStatus}
                              label="Order Status"
                              onChange={(e) => setNewStatus(e.target.value)}
                            >
                              <MenuItem value="pending">⏳ Pending</MenuItem>
                              <MenuItem value="confirmed">✓ Confirmed</MenuItem>
                              <MenuItem value="processing">⚙️ Processing</MenuItem>
                              <MenuItem value="shipped">🚚 Shipped</MenuItem>
                              <MenuItem value="delivered">✅ Delivered</MenuItem>
                              <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Payment Status</InputLabel>
                            <Select
                              value={newPaymentStatus}
                              label="Payment Status"
                              onChange={(e) => setNewPaymentStatus(e.target.value)}
                            >
                              <MenuItem value="pending">⏳ Pending</MenuItem>
                              <MenuItem value="paid">💰 Paid</MenuItem>
                              <MenuItem value="cancelled">🚫 Cancelled</MenuItem>
                              <MenuItem value="failed">❌ Failed</MenuItem>
                              <MenuItem value="refunded">↩️ Refunded</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            label="Notes (optional)"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            placeholder="Add any notes about this update..."
                          />
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={() => {
              setViewDetailsOpen(false)
              setSelectedOrder(null)
              setNewStatus('')
              setNewPaymentStatus('')
              setStatusNotes('')
            }}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateOrderStatus}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <AcceptIcon />}
            sx={{
              backgroundColor: THEME_COLORS.rentPrimary,
              '&:hover': { backgroundColor: THEME_COLORS.rentPrimaryDark },
              '&:disabled': { 
                backgroundColor: '#ccc',
                color: '#666'
              },
              minWidth: 150
            }}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default VendorOrdersPage

