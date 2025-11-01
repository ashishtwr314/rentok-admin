'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  Alert,
  Autocomplete
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Tag as TagIcon,
  Straighten as SizeIcon
} from '@mui/icons-material'
import { Image } from '@imagekit/next'
import { ImageKitUploader } from './ImageKitUploader'
import { extractFileIdFromUrl, deleteFromImageKit } from '../lib/imagekit'

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

interface VendorProductFormData {
  title: string
  description: string
  category_id: string
  price_per_day: number
  original_price: number
  discount_percentage: number
  stock_quantity: number
  available_sizes: string[]
  tags: string[]
  images: string[]
  is_featured: boolean
  security_deposit: number
  specifications: Record<string, any>
}

interface VendorProductFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: VendorProductFormData) => Promise<void>
  categories: Category[]
  editingProduct?: any
  loading?: boolean
}

const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size']

// Specifications Manager Component
interface SpecificationsManagerProps {
  specifications: Record<string, any>
  onChange: (specs: Record<string, any>) => void
}

const SpecificationsManager: React.FC<SpecificationsManagerProps> = ({ specifications, onChange }) => {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const addSpecification = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({
        ...specifications,
        [newKey.trim()]: newValue.trim()
      })
      setNewKey('')
      setNewValue('')
    }
  }

  const removeSpecification = (key: string) => {
    const newSpecs = { ...specifications }
    delete newSpecs[key]
    onChange(newSpecs)
  }

  const updateSpecification = (key: string, value: string) => {
    onChange({
      ...specifications,
      [key]: value
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSpecification()
    }
  }

  return (
    <Box>
      {/* Add new specification */}
      <Box sx={{ mb: 3, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
          Add New Specification
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Specification Name"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g., Brand, Condition, Warranty"
            onKeyPress={handleKeyPress}
            sx={{
              flex: 1,
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
          <TextField
            label="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="e.g., Nike, New, 1 Year"
            onKeyPress={handleKeyPress}
            sx={{
              flex: 1,
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
          <Button
            variant="contained"
            onClick={addSpecification}
            disabled={!newKey.trim() || !newValue.trim()}
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: THEME_COLORS.rentPrimary,
              minWidth: 120,
              height: 56,
              '&:hover': {
                backgroundColor: THEME_COLORS.rentPrimaryDark,
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Existing specifications */}
      {Object.keys(specifications).length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
            Current Specifications ({Object.keys(specifications).length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(specifications).map(([key, value]) => (
              <Card key={key} sx={{ p: 2, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Specification Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                      {key}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Value
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={value}
                      onChange={(e) => updateSpecification(key, e.target.value)}
                      sx={{
                        mt: 0.5,
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
                  <IconButton
                    onClick={() => removeSpecification(key)}
                    sx={{ 
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {Object.keys(specifications).length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            No specifications added yet. Add product specifications like brand, condition, warranty, material, etc.
          </Typography>
        </Alert>
      )}
    </Box>
  )
}


export const VendorProductForm: React.FC<VendorProductFormProps> = ({
  open,
  onClose,
  onSave,
  categories,
  editingProduct,
  loading = false
}) => {
  const [formData, setFormData] = useState<VendorProductFormData>({
    title: '',
    description: '',
    category_id: '',
    price_per_day: 0,
    original_price: 0,
    discount_percentage: 0,
    stock_quantity: 1,
    available_sizes: [],
    tags: [],
    images: [],
    is_featured: false,
    security_deposit: 0,
    specifications: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // Fetch available tags from the API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true)
        const response = await fetch('/api/tags/active')
        const data = await response.json()
        
        if (data.success && data.tags) {
          setAvailableTags(data.tags)
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      } finally {
        setLoadingTags(false)
      }
    }

    if (open) {
      fetchTags()
    }
  }, [open])

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title || '',
        description: editingProduct.description || '',
        category_id: editingProduct.category_id || '',
        price_per_day: editingProduct.price_per_day || 0,
        original_price: editingProduct.original_price || 0,
        discount_percentage: editingProduct.discount_percentage || 0,
        stock_quantity: editingProduct.stock_quantity || 1,
        available_sizes: editingProduct.available_sizes || [],
        tags: editingProduct.tags || [],
        images: editingProduct.images || [],
        is_featured: editingProduct.is_featured || false,
        security_deposit: editingProduct.security_deposit || 0,
        specifications: editingProduct.specifications || {}
      })
    } else {
      // Reset form for new product
      setFormData({
        title: '',
        description: '',
        category_id: '',
        price_per_day: 0,
        original_price: 0,
        discount_percentage: 0,
        stock_quantity: 1,
        available_sizes: [],
        tags: [],
        images: [],
        is_featured: false,
        security_deposit: 0,
        specifications: {}
      })
    }
    setErrors({})
  }, [editingProduct, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    if (formData.price_per_day <= 0) {
      newErrors.price_per_day = 'Price per day must be greater than 0'
    }

    if (formData.original_price < 0) {
      newErrors.original_price = 'Original price cannot be negative'
    }

    if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
      newErrors.discount_percentage = 'Discount must be between 0 and 100'
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity cannot be negative'
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one product image is required'
    }

    if (formData.security_deposit < 0) {
      newErrors.security_deposit = 'Security deposit cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleInputChange = (field: keyof VendorProductFormData, value: any) => {
    const newFormData = { ...formData, [field]: value }
    
    // Auto-calculate discount percentage when original_price or price_per_day changes
    if (field === 'original_price' || field === 'price_per_day') {
      const originalPrice = field === 'original_price' ? value : formData.original_price
      const pricePerDay = field === 'price_per_day' ? value : formData.price_per_day
      
      if (originalPrice > 0 && pricePerDay > 0 && originalPrice > pricePerDay) {
        const discountPercentage = Math.round(((originalPrice - pricePerDay) / originalPrice) * 100)
        newFormData.discount_percentage = discountPercentage
      } else if (originalPrice <= pricePerDay || originalPrice <= 0) {
        newFormData.discount_percentage = 0
      }
    }
    
    setFormData(newFormData)
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }))
  }

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index]
    
    // If it's an ImageKit URL, delete from ImageKit
    if (imageUrl.includes('imagekit.io')) {
      try {
        const fileId = extractFileIdFromUrl(imageUrl)
        if (fileId) {
          await deleteFromImageKit(fileId)
        }
      } catch (error) {
        console.error('Error deleting image from ImageKit:', error)
      }
    }

    // Remove from form data
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      available_sizes: prev.available_sizes.includes(size)
        ? prev.available_sizes.filter(s => s !== size)
        : [...prev.available_sizes, size]
    }))
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
            <AddIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {editingProduct ? 'Update product information' : 'Create a new rental product for your store'}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Basic Information Section */}
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
                  Basic Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Product title, description, and category
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              {/* First Row - Product Title and Category */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
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
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.category_id} required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category_id}
                    label="Category"
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    sx={{
                      backgroundColor: 'white',
                      minWidth: 200,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.primary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.category_id} value={category.category_id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.category_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

         

              {/* Third Row - Stock Quantity */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                  error={!!errors.stock_quantity}
                  helperText={errors.stock_quantity}
                  inputProps={{ min: 0 }}
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
              </Grid>
            </Grid>
            <Grid container spacing={3} mt={3}>
                {/* Second Row - Description (Full width) */}
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Describe the product features, material, occasion, styling tips, care instructions, etc."
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
        
            </Grid>
          </Box>

          {/* Pricing Section */}
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
                  Pricing Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set rental prices and discounts
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price per Day"
                  type="number"
                  value={formData.price_per_day === 0 ? '' : formData.price_per_day}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('price_per_day', value === '' ? 0 : parseFloat(value))
                  }}
                  error={!!errors.price_per_day}
                  helperText={errors.price_per_day}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
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
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Original Price (Optional)"
                  type="number"
                  value={formData.original_price === 0 ? '' : formData.original_price}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('original_price', value === '' ? 0 : parseFloat(value))
                  }}
                  error={!!errors.original_price}
                  helperText={errors.original_price || 'Leave empty if no discount'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
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
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Discount Percentage"
                  type="number"
                  value={formData.discount_percentage === 0 ? '' : formData.discount_percentage}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('discount_percentage', value === '' ? 0 : parseFloat(value))
                  }}
                  error={!!errors.discount_percentage}
                  helperText={errors.discount_percentage || 'Auto-calculated from original price and price per day'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: formData.discount_percentage > 0 ? '#f0f8ff' : 'white',
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

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Security Deposit (Optional)"
                  type="number"
                  value={formData.security_deposit === 0 ? '' : formData.security_deposit}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('security_deposit', value === '' ? 0 : parseFloat(value))
                  }}
                  error={!!errors.security_deposit}
                  helperText={errors.security_deposit || 'Refundable security amount'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
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
              </Grid>
            </Grid>
          </Box>

          {/* Sizes & Tags Section */}
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
                  Sizes & Tags
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available sizes and product tags
                </Typography>
              </Box>
            </Box>

            {/* Available Sizes */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <SizeIcon sx={{ mr: 1 }} />
                Available Sizes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonSizes.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    onClick={() => toggleSize(size)}
                    color={formData.available_sizes.includes(size) ? 'primary' : 'default'}
                    variant={formData.available_sizes.includes(size) ? 'filled' : 'outlined'}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: formData.available_sizes.includes(size) 
                          ? THEME_COLORS.rentPrimaryDark 
                          : THEME_COLORS.tint
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <TagIcon sx={{ mr: 1 }} />
                Product Tags
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select tags from available options to help customers find your product
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  multiple
                  options={availableTags}
                  value={availableTags.filter(tag => formData.tags.includes(tag.name))}
                  onChange={(event, newValue) => {
                    const selectedTagNames = newValue.map(tag => tag.name)
                    setFormData(prev => ({
                      ...prev,
                      tags: selectedTagNames
                    }))
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.tag_id === value.tag_id}
                  loading={loadingTags}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={loadingTags ? "Loading tags..." : "Select tags for your product"}
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
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Chip
                        label={option.name}
                        size="small"
                        sx={{
                          backgroundColor: option.color || THEME_COLORS.rentPrimary,
                          color: 'white',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.tag_id}
                        label={option.name}
                        sx={{
                          backgroundColor: option.color || THEME_COLORS.rentPrimary,
                          color: 'white',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              color: 'white',
                            }
                          }
                        }}
                      />
                    ))
                  }
                  sx={{ mb: 2 }}
                />
              </Box>

              {formData.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Selected tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.tags.map((tagName, index) => {
                      const tag = availableTags.find(t => t.name === tagName)
                      return (
                        <Chip
                          key={index}
                          label={tagName}
                          onDelete={() => removeTag(tagName)}
                          sx={{
                            backgroundColor: tag?.color || THEME_COLORS.rentPrimary,
                            color: 'white',
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                color: 'white',
                              }
                            }
                          }}
                        />
                      )
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Specifications Section */}
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
                  4
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Product Specifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add product specifications like brand, condition, warranty, etc.
                </Typography>
              </Box>
            </Box>

            <SpecificationsManager
              specifications={formData.specifications}
              onChange={(specs) => handleInputChange('specifications', specs)}
            />
          </Box>

          {/* Images Section */}
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
                  5
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Product Images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload product photos (at least one required)
                </Typography>
              </Box>
            </Box>

            {/* ImageKit Uploader */}
            <ImageKitUploader
              onImageUploaded={handleImageUploaded}
              folder="vendor-products"
              maxFiles={10}
              maxSizeInMB={5}
              showUrlInput={true}
              themeColors={{
                primary: THEME_COLORS.primary,
                secondary: THEME_COLORS.rentPrimary,
                tint: THEME_COLORS.tint
              }}
            />

            {errors.images && (
              <Alert severity="error" sx={{ mt: 2, mb: 3, borderRadius: 2 }}>
                {errors.images}
              </Alert>
            )}

            {/* Uploaded Images Display */}
            {formData.images.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Uploaded Images ({formData.images.length})
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  These images will be displayed in your product listing. The first image will be the main product image.
                </Alert>
              </Box>
            )}

            {formData.images.length === 0 && !errors.images && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                👆 Upload product images using the button above. You can add up to 10 images. The first image will be your main product image.
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {formData.images.map((imageUrl, index) => (
                <Grid item xs={6} sm={4} md={3} key={`image-${index}-${imageUrl.substring(0, 20)}`}>
                  <Card sx={{ 
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: index === 0 ? `3px solid ${THEME_COLORS.primary}` : '1px solid #e0e0e0',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    }
                  }}>
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        width: '100%',
                        height: 200,
                        backgroundColor: '#f5f5f5',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      
                      {/* Image Badge */}
                      {index === 0 && (
                        <Chip
                          label="Main Image"
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            backgroundColor: THEME_COLORS.primary,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            zIndex: 1
                          }}
                        />
                      )}
                    </Box>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,1)',
                          transform: 'scale(1.1)',
                        }
                      }}
                      size="small"
                      onClick={() => removeImage(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Settings Section */}
          <Box sx={{ p: 4, backgroundColor: '#fafafa' }}>
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
                  6
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Product Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Featured status and approval information
                </Typography>
              </Box>
            </Box>

            {/* Admin Approval Notice */}
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                📋 Admin Approval Required
              </Typography>
              <Typography variant="body2">
                Your product will be submitted for admin review. Only approved products will be visible to customers.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: THEME_COLORS.rentPrimary,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Request Featured Status</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Request to show in featured products section (subject to admin approval)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 4, 
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
        gap: 2
      }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
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
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          size="large"
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
              boxShadow: 'none',
            }
          }}
        >
          {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
