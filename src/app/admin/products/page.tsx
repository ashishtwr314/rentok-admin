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
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  LocalOffer as DealIcon,
  Straighten as SizeIcon,
  Tag as TagIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { ProductForm } from '../../../components/ProductForm'
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
  is_verified?: boolean
  security_deposit?: number
  specifications?: Record<string, any>
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

interface Vendor {
  vendor_id: string
  name: string
}

const ProductsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [openProductForm, setOpenProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [filterCategory, setFilterCategory] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch products with category and vendor names
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name),
          vendors(name)
        `)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // Transform the data to flatten the joined fields
      const transformedProducts = productsData?.map(product => ({
        ...product,
        category_name: product.categories?.name,
        vendor_name: product.vendors?.name
      })) || []

      setProducts(transformedProducts)

      // Fetch categories for filter
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('category_id, name')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch vendors for filter
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('vendor_id, name')
        .eq('is_active', true)
        .order('name')

      if (vendorsError) throw vendorsError
      setVendors(vendorsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbar({ open: true, message: 'Error fetching products', severity: 'error' })
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
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      // First, delete associated images from storage
      if (productToDelete.images && productToDelete.images.length > 0) {
        const imagesToDelete = productToDelete.images.filter((imageUrl: string) => 
          imageUrl.includes('supabase') && imageUrl.includes('product-images')
        )
        
        for (const imageUrl of imagesToDelete) {
          try {
            // Extract file path from URL
            const urlParts = imageUrl.split('/product-images/')
            if (urlParts.length > 1) {
              const filePath = `products/${urlParts[1].split('?')[0]}`
              await supabase.storage
                .from('product-images')
                .remove([filePath])
            }
          } catch (imageError) {
            console.error('Error deleting image:', imageError)
            // Continue with product deletion even if image deletion fails
          }
        }
      }

      // Then delete the product from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productToDelete.product_id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Product and associated images deleted successfully', severity: 'success' })
      setDeleteConfirmOpen(false)
      setProductToDelete(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting product:', error)
      setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' })
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('product_id', product.product_id)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      })
      fetchData()
    } catch (error) {
      console.error('Error updating product status:', error)
      setSnackbar({ open: true, message: 'Error updating product status', severity: 'error' })
    }
  }

  const toggleFeaturedStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('product_id', product.product_id)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `Product ${!product.is_featured ? 'featured' : 'unfeatured'} successfully`, 
        severity: 'success' 
      })
      fetchData()
    } catch (error) {
      console.error('Error updating featured status:', error)
      setSnackbar({ open: true, message: 'Error updating featured status', severity: 'error' })
    }
  }

  const toggleDealOfTheDayStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ deal_of_the_day: !product.deal_of_the_day })
        .eq('product_id', product.product_id)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `Product ${!product.deal_of_the_day ? 'marked as deal of the day' : 'removed from deal of the day'} successfully`, 
        severity: 'success' 
      })
      fetchData()
    } catch (error) {
      console.error('Error updating deal of the day status:', error)
      setSnackbar({ open: true, message: 'Error updating deal of the day status', severity: 'error' })
    }
  }

  const handleSaveProduct = async (productData: any) => {
    try {
      // Clean up the data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...productData,
        vendor_id: productData.vendor_id && productData.vendor_id.trim() !== '' ? productData.vendor_id : null,
        category_id: productData.category_id && productData.category_id.trim() !== '' ? productData.category_id : null,
      }

      // Validate required fields
      if (!cleanedData.category_id) {
        setSnackbar({ open: true, message: 'Category is required', severity: 'error' })
        return
      }

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            ...cleanedData,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', editingProduct.product_id)

        if (error) throw error
        setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' })
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([{
            ...cleanedData,
            created_by_admin: !cleanedData.vendor_id, // Mark as admin product if no vendor
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' })
      }

      setOpenProductForm(false)
      setEditingProduct(null)
      fetchData()
    } catch (error) {
      console.error('Error saving product:', error)
      setSnackbar({ open: true, message: 'Error saving product', severity: 'error' })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setOpenProductForm(true)
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setViewDetailsOpen(true)
  }

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !filterCategory || product.category_id === filterCategory
    const matchesVendor = !filterVendor || product.vendor_id === filterVendor
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && product.is_active) ||
                         (filterStatus === 'inactive' && !product.is_active) ||
                         (filterStatus === 'featured' && product.is_featured)

    return matchesSearch && matchesCategory && matchesVendor && matchesStatus
  })

  const paginatedProducts = filteredProducts.slice(
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

  const getFirstImage = (images: string[]) => {
    return images && images.length > 0 ? images[0] : null
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
            <InventoryIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Products Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage all rental products in the system
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProduct(null)
              setOpenProductForm(true)
            }}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Add New Product
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
              {/* Search Field - Full width on mobile, half on tablet, 5 columns on desktop */}
              <Grid item xs={12} md={6} lg={5}>
                <TextField
                  fullWidth
                  placeholder="Search products by title, description, category, or vendor..."
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
              
              {/* Category Filter - Wider on all screens */}
              <Grid item xs={12} sm={4} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
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
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.category_id} value={category.category_id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Vendor Filter - Wider on all screens */}
              <Grid item xs={12} sm={4} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={filterVendor}
                    label="Vendor"
                    onChange={(e) => setFilterVendor(e.target.value)}
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
                    <MenuItem value="">All Vendors</MenuItem>
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.vendor_id} value={vendor.vendor_id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Status Filter - Wider on all screens */}
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
                    <MenuItem value="featured">Featured</MenuItem>
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
                    {filteredProducts.length} items
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterCategory || filterVendor || filterStatus) && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('')
                    setFilterVendor('')
                    setFilterStatus('')
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
              </Box>
            )}
          </Card>

          {/* Products Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Pricing</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ) : paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => {
                      const firstImage = getFirstImage(product.images)

                      return (
                        <TableRow key={product.product_id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ mr: 2, position: 'relative' }}>
                                {firstImage ? (
                                  <Image
                                    src={firstImage}
                                    alt={product.title}
                                    width={60}
                                    height={60}
                                    style={{
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      border: '1px solid #e0e0e0'
                                    }}
                                  />
                                ) : (
                                  <Avatar
                                    sx={{ 
                                      width: 60, 
                                      height: 60, 
                                      bgcolor: THEME_COLORS.tint,
                                      color: THEME_COLORS.rentPrimary
                                    }}
                                  >
                                    <ImageIcon />
                                  </Avatar>
                                )}
                                {product.images.length > 1 && (
                                  <Badge
                                    badgeContent={product.images.length}
                                    color="primary"
                                    sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      '& .MuiBadge-badge': {
                                        fontSize: '0.7rem',
                                        height: 18,
                                        minWidth: 18
                                      }
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {product.title}
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
                                  {product.description || 'No description'}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  {product.tags.slice(0, 2).map((tag, index) => (
                                    <Chip
                                      key={index}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 0.5, fontSize: '0.7rem', height: 20 }}
                                    />
                                  ))}
                                  {product.tags.length > 2 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{product.tags.length - 2} more
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CategoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {product.category_name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StoreIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {product.vendor_name || 'Admin'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                              {formatPrice(product.price_per_day)}/day
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Rating
                                value={product.rating}
                                readOnly
                                size="small"
                                precision={0.1}
                              />
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                ({product.review_count})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: product.stock_quantity > 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {product.stock_quantity} units
                            </Typography>
                            {product.available_sizes.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Sizes: {product.available_sizes.join(', ')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                <Chip
                                  label={product.is_active ? 'Active' : 'Inactive'}
                                  color={product.is_active ? 'success' : 'default'}
                                  size="small"
                                  onClick={() => toggleProductStatus(product)}
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {product.is_featured && (
                                  <Chip
                                    icon={<StarIcon />}
                                    label="Featured"
                                    color="primary"
                                    size="small"
                                    onClick={() => toggleFeaturedStatus(product)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                )}
                                {!product.is_featured && (
                                  <Chip
                                    label="Feature"
                                    variant="outlined"
                                    size="small"
                                    onClick={() => toggleFeaturedStatus(product)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                )}
                                {product.deal_of_the_day && (
                                  <Chip
                                    icon={<DealIcon />}
                                    label="Deal of Day"
                                    color="secondary"
                                    size="small"
                                    onClick={() => toggleDealOfTheDayStatus(product)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                )}
                                {!product.deal_of_the_day && (
                                  <Chip
                                    label="Deal"
                                    variant="outlined"
                                    size="small"
                                    onClick={() => toggleDealOfTheDayStatus(product)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(product)}
                                  sx={{ color: THEME_COLORS.primary }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Product">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditProduct(product)}
                                  sx={{ color: THEME_COLORS.rentPrimary }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Product">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setProductToDelete(product)
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
              count={filteredProducts.length}
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
            Are you sure you want to delete product "{productToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProduct}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <VisibilityIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Product Details
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedProduct?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedProduct && (
            <Box>
              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                    Product Images
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    overflowX: 'auto',
                    pb: 1
                  }}>
                    {selectedProduct.images.map((imageUrl, index) => (
                      <Box key={index} sx={{ 
                        minWidth: 120,
                        width: 120,
                        height: 120,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                        flexShrink: 0
                      }}>
                        {imageUrl.includes('imagekit.io') ? (
                          <Image
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            width={120}
                            height={120}
                            style={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            style={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/120/120'
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Product Information Grid */}
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Product Title
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.title}
                      </Typography>
                    </Box>
                    
                    {selectedProduct.description && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {selectedProduct.description}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.category_name || 'Unknown'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Vendor
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.vendor_name || (selectedProduct.created_by_admin ? 'Admin Product' : 'Unknown')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Pricing & Stock */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                    Pricing & Stock
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Price per Day
                      </Typography>
                      <Typography variant="h5" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                        ₹{selectedProduct.price_per_day}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Original Price
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.original_price ? `₹${selectedProduct.original_price}` : 'Not set'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Discount
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: selectedProduct.discount_percentage > 0 ? '#4caf50' : 'inherit',
                          fontWeight: selectedProduct.discount_percentage > 0 ? 'bold' : 'normal'
                        }}>
                          {selectedProduct.discount_percentage}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Security Deposit
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.security_deposit ? `₹${selectedProduct.security_deposit}` : 'Not required'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Stock Quantity
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.stock_quantity} units
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Rating
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={selectedProduct.rating} readOnly size="small" />
                        <Typography variant="body2">
                          {selectedProduct.rating} ({selectedProduct.review_count} reviews)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Available Sizes */}
                {selectedProduct.available_sizes && selectedProduct.available_sizes.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      Available Sizes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedProduct.available_sizes.map((size, index) => (
                        <Chip 
                          key={index} 
                          label={size} 
                          sx={{ 
                            backgroundColor: THEME_COLORS.tint,
                            color: THEME_COLORS.rentPrimary,
                            fontWeight: 'bold'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      Product Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedProduct.tags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* Specifications */}
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <Grid item xs={12}>
                    <Accordion defaultExpanded sx={{ boxShadow: 2, borderRadius: 2 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: THEME_COLORS.tint,
                          borderRadius: '8px 8px 0 0',
                          '&.Mui-expanded': {
                            minHeight: 48,
                          },
                          '& .MuiAccordionSummary-content': {
                            margin: '12px 0',
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                          Product Specifications
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                              <Box sx={{ 
                                p: 2, 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ 
                                  fontWeight: 'bold',
                                  textTransform: 'capitalize',
                                  mb: 0.5
                                }}>
                                  {key.replace(/_/g, ' ')}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {String(value)}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                {/* Status & Settings */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                    Status & Settings
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip 
                      label={selectedProduct.is_active ? 'Active' : 'Inactive'} 
                      color={selectedProduct.is_active ? 'success' : 'default'}
                    />
                    {selectedProduct.is_verified && (
                      <Chip 
                        label="✓ Verified" 
                        sx={{ backgroundColor: '#4caf50', color: 'white' }}
                      />
                    )}
                    {selectedProduct.is_featured && (
                      <Chip label="Featured" color="primary" />
                    )}
                    {selectedProduct.deal_of_the_day && (
                      <Chip label="Deal of the Day" color="warning" />
                    )}
                    {selectedProduct.created_by_admin && (
                      <Chip label="Admin Product" color="info" />
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 4,
                    pt: 2, 
                    borderTop: '1px solid #e0e0e0',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body2">
                      <strong>Created:</strong> {new Date(selectedProduct.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Updated:</strong> {new Date(selectedProduct.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setViewDetailsOpen(false)}
            variant="outlined"
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setViewDetailsOpen(false)
              if (selectedProduct) {
                handleEditProduct(selectedProduct)
              }
            }}
            sx={{
              backgroundColor: THEME_COLORS.rentPrimary,
              '&:hover': {
                backgroundColor: THEME_COLORS.rentPrimaryDark,
              },
            }}
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Form Dialog */}
      <ProductForm
        open={openProductForm}
        onClose={() => {
          setOpenProductForm(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
        categories={categories}
        vendors={vendors}
        editingProduct={editingProduct}
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

export default ProductsPage
