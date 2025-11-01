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
  Rating,
  Badge,
  CircularProgress
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  LocalOffer as DealIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { VendorProductForm } from '../../../components/VendorProductForm'
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

interface Product {
  product_id: string
  category_id: string
  vendor_id?: string
  title: string
  description?: string
  price_per_day: number
  original_price?: number
  discount_percentage: number
  rating: number
  review_count: number
  available_sizes: string[]
  tags: string[]
  images: string[]
  stock_quantity: number
  is_featured: boolean
  is_active: boolean
  deal_of_the_day: boolean
  created_by_admin: boolean
  created_at: string
  updated_at: string
  // Joined data
  category_name?: string
  vendor_name?: string
}

interface Category {
  category_id: string
  name: string
}

const VendorProductsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('my-products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openProductForm, setOpenProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const { logout, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hasFetched) return
    
    // Wait for auth to finish loading
    if (authLoading) return
    
    if (user) {
      fetchProducts()
      fetchCategories()
      setHasFetched(true)
    } else {
      // If no user after auth loads, set loading to false
      setLoading(false)
      setHasFetched(true)
    }
  }, [user, authLoading, hasFetched])

  const fetchProducts = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get vendor ID by finding the vendor record that matches the user's email
      // Since the admin user and vendor might have the same email
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

      // Fetch products for this vendor only
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // Transform the data to flatten the joined fields
      const transformedProducts = productsData?.map(product => ({
        ...product,
        category_name: product.categories?.name
      })) || []

      setProducts(transformedProducts)

    } catch (error) {
      console.error('Error fetching products:', error)
      setSnackbar({ open: true, message: 'Error fetching products', severity: 'error' })
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
    } else if (itemId === 'add-product') {
      setEditingProduct(null)
      setOpenProductForm(true)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productToDelete.product_id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' })
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' })
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setOpenProductForm(true)
  }

  const handleProductFormClose = () => {
    setOpenProductForm(false)
    setEditingProduct(null)
    fetchProducts()
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

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('product_id', editingProduct.product_id)

        if (error) throw error
        setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' })
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productPayload)

        if (error) throw error
        setSnackbar({ open: true, message: 'Product submitted for admin approval!', severity: 'success' })
      }

      setOpenProductForm(false)
      setEditingProduct(null)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      setSnackbar({ open: true, message: 'Error saving product', severity: 'error' })
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active) ||
                         (statusFilter === 'featured' && product.is_featured)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
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
            <InventoryIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              My Products
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleMenuItemClick('add-product')}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Add Product
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <InventoryIcon sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                      {products.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Products
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                      {products.filter(p => p.is_active).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Products
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <StarIcon sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                      {products.filter(p => p.is_featured).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Featured Products
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                      {new Set(products.map(p => p.category_id)).size}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} lg={4}>
                  <TextField
                    fullWidth
                    placeholder="Search products..."
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
                <Grid item xs={12} sm={6} lg={3}>
                  <FormControl fullWidth size="medium" sx={{ minWidth: 180 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            minWidth: 200,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.category_id} value={category.category_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <FormControl fullWidth size="medium" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            minWidth: 180,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="featured">Featured</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} lg={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => {
                      setSearchTerm('')
                      setCategoryFilter('')
                      setStatusFilter('')
                    }}
                    sx={{ 
                      minHeight: 56,
                      minWidth: 120
                    }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>

          {/* Products Table */}
          <Card elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price/Day</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.product_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {product.images && product.images.length > 0 ? (
                            <Avatar
                              sx={{ width: 60, height: 60, mr: 2, borderRadius: 2 }}
                              variant="rounded"
                            >
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={60}
                                height={60}
                                style={{ objectFit: 'cover' }}
                              />
                            </Avatar>
                          ) : (
                            <Avatar
                              sx={{ width: 60, height: 60, mr: 2, borderRadius: 2, bgcolor: THEME_COLORS.tint }}
                              variant="rounded"
                            >
                              <ImageIcon sx={{ color: THEME_COLORS.rentPrimary }} />
                            </Avatar>
                          )}
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {product.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {product.description}
                            </Typography>
                            {product.is_featured && (
                              <Chip
                                label="Featured"
                                size="small"
                                sx={{ mt: 0.5, backgroundColor: THEME_COLORS.primary, color: 'white' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.category_name}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {formatPrice(product.price_per_day)}
                        </Typography>
                        {product.original_price && product.discount_percentage > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                              {formatPrice(product.original_price)}
                            </Typography>
                            <Chip
                              label={`${product.discount_percentage}% OFF`}
                              size="small"
                              color="success"
                            />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={product.stock_quantity}
                          color={product.stock_quantity > 5 ? 'success' : product.stock_quantity > 0 ? 'warning' : 'error'}
                          max={99}
                        >
                          <InventoryIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={product.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({product.review_count})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            label={product.is_active ? 'Active' : 'Pending Approval'}
                            color={product.is_active ? 'success' : 'warning'}
                            size="small"
                          />
                          {!product.is_active && (
                            <Typography variant="caption" color="text.secondary">
                              Awaiting admin review
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {product.is_featured && (
                              <Chip
                                icon={<StarIcon />}
                                label="Featured"
                                color="primary"
                                size="small"
                              />
                            )}
                            {product.deal_of_the_day && (
                              <Chip
                                icon={<DealIcon />}
                                label="Deal of Day"
                                color="secondary"
                                size="small"
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Product">
                            <IconButton
                              size="small"
                              onClick={() => handleEditProduct(product)}
                              sx={{ color: THEME_COLORS.primary }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setProductToDelete(product)
                                setDeleteDialogOpen(true)
                              }}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
            />
          </Card>

          {filteredProducts.length === 0 && !loading && (
            <Card elevation={3} sx={{ mt: 3 }}>
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || categoryFilter || statusFilter 
                    ? 'Try adjusting your filters to see more products.'
                    : 'Start by adding your first product to showcase your inventory.'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleMenuItemClick('add-product')}
                  sx={{
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                  }}
                >
                  Add Your First Product
                </Button>
              </Box>
            </Card>
          )}
        </Box>
      </Box>

      {/* Product Form Dialog */}
      <VendorProductForm
        open={openProductForm}
        onClose={handleProductFormClose}
        onSave={handleSaveProduct}
        categories={categories}
        editingProduct={editingProduct}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{productToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default VendorProductsPage
