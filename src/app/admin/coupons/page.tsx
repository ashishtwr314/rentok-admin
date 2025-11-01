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
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as CouponIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  ContentCopy as CopyIcon,
  CalendarToday as CalendarIcon,
  Percent as PercentIcon,
  CurrencyRupee as CurrencyIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { CouponForm } from '../../../components/CouponForm'
import { supabase } from '../../../lib/supabase'

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

interface Coupon {
  coupon_id: string
  code: string
  title: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_amount?: number
  maximum_discount?: number
  usage_limit?: number
  used_count: number
  valid_from: string
  valid_until: string
  is_active: boolean
  applicable_to: 'all' | 'category' | 'product' | 'vendor'
  applicable_ids?: string[]
  created_at: string
  updated_at: string
}

const CouponsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('coupons')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [openCouponForm, setOpenCouponForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched coupons:', data?.length || 0, 'coupons')
      setCoupons(data || [])
    } catch (error) {
      console.error('Error fetching coupons:', error)
      setSnackbar({ 
        open: true, 
        message: `Error fetching coupons: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        severity: 'error' 
      })
      setCoupons([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    if (itemId === 'dashboard') {
      window.location.href = '/admin/dashboard'
    } else if (itemId === 'vendors') {
      window.location.href = '/admin/vendors'
    } else if (itemId === 'products') {
      window.location.href = '/admin/products'
    } else if (itemId === 'categories') {
      window.location.href = '/admin/categories'
    } else if (itemId === 'advertisements') {
      window.location.href = '/admin/advertisements'
    }
  }

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('coupon_id', couponToDelete.coupon_id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Coupon deleted successfully', severity: 'success' })
      setDeleteConfirmOpen(false)
      setCouponToDelete(null)
      fetchCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      setSnackbar({ open: true, message: 'Error deleting coupon', severity: 'error' })
    }
  }

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('coupon_id', coupon.coupon_id)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `Coupon ${!coupon.is_active ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      })
      fetchCoupons()
    } catch (error) {
      console.error('Error updating coupon status:', error)
      setSnackbar({ open: true, message: 'Error updating coupon status', severity: 'error' })
    }
  }

  const handleSaveCoupon = async (couponData: any) => {
    try {
      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update({
            ...couponData,
            updated_at: new Date().toISOString()
          })
          .eq('coupon_id', editingCoupon.coupon_id)

        if (error) throw error
        setSnackbar({ open: true, message: 'Coupon updated successfully', severity: 'success' })
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert([{
            ...couponData,
            used_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        setSnackbar({ open: true, message: 'Coupon created successfully', severity: 'success' })
      }

      setOpenCouponForm(false)
      setEditingCoupon(null)
      fetchCoupons()
    } catch (error) {
      console.error('Error saving coupon:', error)
      setSnackbar({ open: true, message: 'Error saving coupon', severity: 'error' })
    }
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setOpenCouponForm(true)
  }

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSnackbar({ open: true, message: 'Coupon code copied to clipboard', severity: 'success' })
  }

  // Filter coupons based on search and filters
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filterType || coupon.discount_type === filterType
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && coupon.is_active) ||
                         (filterStatus === 'inactive' && !coupon.is_active) ||
                         (filterStatus === 'expired' && new Date(coupon.valid_until) < new Date())

    return matchesSearch && matchesType && matchesStatus
  })

  const paginatedCoupons = filteredCoupons.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`
    } else {
      return `₹${coupon.discount_value} OFF`
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const getUsagePercentage = (used: number, limit?: number) => {
    if (!limit) return 0
    return Math.min((used / limit) * 100, 100)
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
            <CouponIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Coupon Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage discount coupons and promotional codes
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingCoupon(null)
              setOpenCouponForm(true)
            }}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Create New Coupon
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Search and Filters */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: THEME_COLORS.rentPrimary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                Search & Filters
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {/* Search Field */}
              <Grid item xs={12} md={6} lg={5}>
                <TextField
                  fullWidth
                  placeholder="Search coupons by code, title, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: THEME_COLORS.primary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    },
                  }}
                />
              </Grid>
              
              {/* Discount Type Filter */}
              <Grid item xs={12} sm={4} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={filterType}
                    label="Discount Type"
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{
                      minWidth: 140,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.primary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Status Filter */}
              <Grid item xs={12} sm={4} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{
                      minWidth: 120,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.primary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Results Counter */}
              <Grid item xs={12} sm={12} md={6} lg={1}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '56px',
                    backgroundColor: THEME_COLORS.tint,
                    borderRadius: 1,
                    border: `1px solid ${THEME_COLORS.primary}`,
                    px: 2,
                    minWidth: 120
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: THEME_COLORS.rentPrimary,
                      textAlign: 'center',
                      fontSize: '0.875rem'
                    }}
                  >
                    {filteredCoupons.length} / {coupons.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, fontSize: '0.8rem' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Debug Info:</Typography>
                <br />
                Total Coupons: {coupons.length} | Filtered: {filteredCoupons.length}
                <br />
                Search: "{searchTerm}" | Type: "{filterType}" | Status: "{filterStatus}"
                <br />
                Page: {page} | Rows per page: {rowsPerPage}
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchCoupons}
                  disabled={loading}
                  sx={{
                    color: THEME_COLORS.rentPrimary,
                    borderColor: THEME_COLORS.rentPrimary,
                    '&:hover': {
                      backgroundColor: THEME_COLORS.tint,
                      borderColor: THEME_COLORS.rentPrimaryDark,
                    }
                  }}
                >
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/coupons/test')
                        const result = await response.json()
                        console.log('Test result:', result)
                        setSnackbar({ 
                          open: true, 
                          message: result.success ? 'Test successful' : 'Test failed', 
                          severity: result.success ? 'success' : 'error' 
                        })
                        if (result.success) {
                          fetchCoupons() // Refresh data after test
                        }
                      } catch (error) {
                        console.error('Test error:', error)
                        setSnackbar({ 
                          open: true, 
                          message: 'Test failed', 
                          severity: 'error' 
                        })
                      }
                    }}
                    sx={{
                      color: 'orange',
                      borderColor: 'orange',
                      '&:hover': {
                        backgroundColor: '#fff3e0',
                        borderColor: 'orange',
                      }
                    }}
                  >
                    Test DB
                  </Button>
                )}
              </Box>
              
              {(searchTerm || filterType || filterStatus) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm('')
                    setFilterType('')
                    setFilterStatus('')
                    // Reset pagination when clearing filters
                    setPage(0)
                  }}
                  sx={{
                    color: THEME_COLORS.rentPrimary,
                    borderColor: THEME_COLORS.rentPrimary,
                    '&:hover': {
                      backgroundColor: THEME_COLORS.tint,
                      borderColor: THEME_COLORS.rentPrimaryDark,
                    }
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Box>
          </Card>

          {/* Coupons Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Coupon Code</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Validity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        Loading coupons...
                      </TableCell>
                    </TableRow>
                  ) : paginatedCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        No coupons found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCoupons.map((coupon) => {
                      const expired = isExpired(coupon.valid_until)
                      const usagePercentage = getUsagePercentage(coupon.used_count, coupon.usage_limit)

                      return (
                        <TableRow key={coupon.coupon_id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ 
                                p: 1, 
                                backgroundColor: THEME_COLORS.tint, 
                                borderRadius: 1,
                                border: `1px solid ${THEME_COLORS.primary}`,
                                mr: 2
                              }}>
                                <CouponIcon sx={{ color: THEME_COLORS.rentPrimary, fontSize: 20 }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {coupon.code}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Tooltip title="Copy code">
                                    <IconButton
                                      size="small"
                                      onClick={() => copyCouponCode(coupon.code)}
                                      sx={{ color: THEME_COLORS.primary }}
                                    >
                                      <CopyIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Typography variant="caption" color="text.secondary">
                                    {coupon.applicable_to}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {coupon.title}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {coupon.description || 'No description'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                                {formatDiscount(coupon)}
                              </Typography>
                              {coupon.minimum_amount && (
                                <Typography variant="caption" color="text.secondary">
                                  Min: ₹{coupon.minimum_amount}
                                </Typography>
                              )}
                              {coupon.maximum_discount && coupon.discount_type === 'percentage' && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Max: ₹{coupon.maximum_discount}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {coupon.used_count} / {coupon.usage_limit || '∞'}
                              </Typography>
                              {coupon.usage_limit && (
                                <Box sx={{ width: '100%', mt: 0.5 }}>
                                  <Box 
                                    sx={{ 
                                      width: '100%', 
                                      height: 4, 
                                      backgroundColor: '#e0e0e0', 
                                      borderRadius: 2,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: `${usagePercentage}%`, 
                                        height: '100%', 
                                        backgroundColor: usagePercentage > 80 ? 'error.main' : THEME_COLORS.primary,
                                        transition: 'width 0.3s ease'
                                      }} 
                                    />
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(coupon.valid_from).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              to {new Date(coupon.valid_until).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={coupon.is_active ? 'Active' : 'Inactive'}
                                color={coupon.is_active ? 'success' : 'default'}
                                size="small"
                                onClick={() => toggleCouponStatus(coupon)}
                                sx={{ cursor: 'pointer' }}
                              />
                              {expired && (
                                <Chip
                                  label="Expired"
                                  color="error"
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  sx={{ color: THEME_COLORS.primary }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Coupon">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditCoupon(coupon)}
                                  sx={{ color: THEME_COLORS.rentPrimary }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Coupon">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCouponToDelete(coupon)
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
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCoupons.length}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete coupon "{couponToDelete?.code}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCoupon}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Coupon Form Dialog */}
      <CouponForm
        open={openCouponForm}
        onClose={() => {
          setOpenCouponForm(false)
          setEditingCoupon(null)
        }}
        onSave={handleSaveCoupon}
        editingCoupon={editingCoupon}
        loading={loading}
      />

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

export default CouponsPage
