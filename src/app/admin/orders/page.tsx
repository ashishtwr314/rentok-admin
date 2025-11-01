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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material'
import { 
  ShoppingCart as OrderIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  LocalShipping as DeliveryIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { supabase } from '../../../lib/supabase'
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
    vendors?: {
      vendor_id: string
      name: string
      email: string
      phone: string
      business_name?: string
    }
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

const OrdersPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
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
              vendor_id,
              vendors(
                vendor_id,
                name,
                email,
                phone,
                business_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setSnackbar({ open: true, message: 'Error fetching orders', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    if (itemId === 'dashboard') {
      window.location.href = '/admin/dashboard'
    } else if (itemId === 'products') {
      window.location.href = '/admin/products'
    } else if (itemId === 'vendors') {
      window.location.href = '/admin/vendors'
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', orderToDelete.order_id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' })
      setDeleteConfirmOpen(false)
      setOrderToDelete(null)
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      setSnackbar({ open: true, message: 'Error deleting order', severity: 'error' })
    }
  }

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return

    try {
      setUpdating(true)
      
      // Use API route to update order status (which will also send email to customer)
      const updateData: any = {
        updated_by: 'admin'
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
      fetchOrders()
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        userRole="admin" 
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
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
                Orders Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage all rental orders in the system
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
                      {formatPrice(orders.reduce((sum, order) => sum + Number(order.total_amount), 0))}
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
                            {formatPrice(order.total_amount)}
                          </Typography>
                          {order.discount_amount > 0 && (
                            <Chip
                              label={`Saved ${formatPrice(order.discount_amount)}`}
                              size="small"
                              color="success"
                              sx={{ mt: 0.5 }}
                            />
                          )}
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
                          {order.payment_method && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {order.payment_method}
                            </Typography>
                          )}
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
                            <Tooltip title="Delete Order">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setOrderToDelete(order)
                                  setDeleteConfirmOpen(true)
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon />
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
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          mb: 0,
          py: 3,
          px: 4
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <ReceiptIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Order #{selectedOrder?.order_number}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedOrder && `Placed on ${formatDate(selectedOrder.created_at)}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={selectedOrder?.status} 
              color={getStatusColor(selectedOrder?.status || '')}
              sx={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '0.875rem' }}
            />
            <Chip 
              label={selectedOrder?.payment_status} 
              color={getPaymentStatusColor(selectedOrder?.payment_status || '')}
              sx={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '0.875rem' }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedOrder && (
            <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Section 1: Customer & Delivery Information */}
              <Box sx={{ p: 4, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: THEME_COLORS.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      1
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      Customer & Delivery Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer details and delivery address
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}>
                        Customer Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Name
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.profiles?.name || selectedOrder.profiles?.full_name || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Email
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.profiles?.email || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Phone
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.profiles?.mobile_number}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Location
                          </Typography>
                          <Typography variant="body2">
                            {[selectedOrder.profiles?.city, selectedOrder.profiles?.state]
                              .filter(Boolean)
                              .join(', ') || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}>
                        Delivery Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Delivery Address
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {selectedOrder.delivery_address}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Contact Number
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.contact_number}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                            Rental Period
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip 
                              label={formatDate(selectedOrder.rental_start_date)} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption">to</Typography>
                            <Chip 
                              label={formatDate(selectedOrder.rental_end_date)} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          <Chip 
                            label={`${selectedOrder.rental_days} days total`}
                            size="small"
                            sx={{ backgroundColor: THEME_COLORS.tint, fontWeight: 'bold' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Section 2: Order Items */}
              <Box sx={{ p: 4, backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: THEME_COLORS.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      2
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      Order Items ({selectedOrder.order_items?.length || 0})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Products included in this order
                    </Typography>
                  </Box>
                </Box>

                {selectedOrder.order_items?.map((item, index) => (
                      <Card key={item.order_item_id} sx={{ mb: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                          {/* Product Image */}
                          <Box sx={{ 
                            width: 120, 
                            flexShrink: 0,
                            position: 'relative',
                            backgroundColor: THEME_COLORS.tint
                          }}>
                            {item.products.images && item.products.images.length > 0 ? (
                              <Image
                                src={item.products.images[0]}
                                alt={item.products.title}
                                width={120}
                                height={120}
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <Box sx={{ 
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center'
                              }}>
                                <ImageIcon sx={{ fontSize: 48, color: THEME_COLORS.rentPrimary }} />
                              </Box>
                            )}
                          </Box>
                          
                          {/* Product Details */}
                          <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {item.products.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {item.products.vendors?.business_name || item.products.vendors?.name || 'N/A'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 'auto' }}>
                              {item.selected_size && (
                                <Chip 
                                  label={`Size: ${item.selected_size}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              <Chip 
                                label={`Qty: ${item.quantity}`}
                                size="small"
                                color="primary"
                              />
                              <Chip 
                                label={`${formatPrice(item.unit_price)} each`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>

                          {/* Price Section */}
                          <Box sx={{ 
                            width: 140,
                            flexShrink: 0,
                            backgroundColor: THEME_COLORS.tint,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                            borderLeft: '1px solid #e0e0e0'
                          }}>
                            <Typography variant="caption" color="text.secondary">
                              Item Total
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                              {formatPrice(item.total_price)}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    ))}
              </Box>

              {/* Section 3: Payment Summary & Update Order */}
              <Box sx={{ p: 4, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: THEME_COLORS.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      3
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      Payment & Order Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment summary and order status updates
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}>
                        Payment Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatPrice(selectedOrder.subtotal)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Delivery Charge</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatPrice(selectedOrder.delivery_charge)}
                          </Typography>
                        </Box>
                        {selectedOrder.discount_amount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                              Discount
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                              - {formatPrice(selectedOrder.discount_amount)}
                            </Typography>
                          </Box>
                        )}
                        {selectedOrder.coupon_code && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Coupon</Typography>
                            <Chip label={selectedOrder.coupon_code} size="small" color="success" />
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: THEME_COLORS.tint,
                          borderRadius: 1
                        }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Amount</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                            {formatPrice(selectedOrder.total_amount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}>
                        Update Order Status
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Order Status</InputLabel>
                          <Select
                            value={newStatus}
                            label="Order Status"
                            onChange={(e) => setNewStatus(e.target.value)}
                            sx={{
                              backgroundColor: 'white',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: THEME_COLORS.primary,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: THEME_COLORS.rentPrimary,
                              },
                            }}
                          >
                            <MenuItem value="pending">⏳ Pending</MenuItem>
                            <MenuItem value="confirmed">✓ Confirmed</MenuItem>
                            <MenuItem value="processing">⚙️ Processing</MenuItem>
                            <MenuItem value="shipped">🚚 Shipped</MenuItem>
                            <MenuItem value="delivered">✅ Delivered</MenuItem>
                            <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                            <MenuItem value="rejected">⛔ Rejected</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControl fullWidth>
                          <InputLabel>Payment Status</InputLabel>
                          <Select
                            value={newPaymentStatus}
                            label="Payment Status"
                            onChange={(e) => setNewPaymentStatus(e.target.value)}
                            sx={{
                              backgroundColor: 'white',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: THEME_COLORS.primary,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: THEME_COLORS.rentPrimary,
                              },
                            }}
                          >
                            <MenuItem value="pending">⏳ Pending</MenuItem>
                            <MenuItem value="paid">💰 Paid</MenuItem>
                            <MenuItem value="cancelled">🚫 Cancelled</MenuItem>
                            <MenuItem value="failed">❌ Failed</MenuItem>
                            <MenuItem value="refunded">↩️ Refunded</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Notes (optional)"
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          placeholder="Add notes about this update..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'white',
                              '&:hover fieldset': {
                                borderColor: THEME_COLORS.primary,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: THEME_COLORS.rentPrimary,
                              },
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 4, 
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          gap: 2
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
            size="large"
            sx={{
              borderColor: '#ddd',
              color: '#666',
              '&:hover': {
                borderColor: '#bbb',
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateOrderStatus}
            disabled={updating}
            size="large"
            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              backgroundColor: THEME_COLORS.rentPrimary,
              minWidth: 160,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(154, 33, 67, 0.3)',
              '&:hover': {
                backgroundColor: THEME_COLORS.rentPrimaryDark,
                boxShadow: '0 6px 16px rgba(154, 33, 67, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': { 
                backgroundColor: '#ccc',
                color: '#666',
                boxShadow: 'none'
              }
            }}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order #{orderToDelete?.order_number}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteOrder}
          >
            Delete
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

export default OrdersPage

