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
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete
} from '@mui/material'
import {
  LocalOffer as CouponIcon,
  Percent as PercentIcon,
  CurrencyRupee as CurrencyIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'

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

interface CouponFormProps {
  open: boolean
  onClose: () => void
  onSave: (couponData: any) => void
  editingCoupon?: Coupon | null
  loading?: boolean
}

interface Category {
  category_id: string
  name: string
}

interface Product {
  product_id: string
  title: string
}

interface Vendor {
  vendor_id: string
  name: string
}

export const CouponForm: React.FC<CouponFormProps> = ({
  open,
  onClose,
  onSave,
  editingCoupon,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: 0,
    valid_from: '',
    valid_until: '',
    is_active: true,
    applicable_to: 'all' as 'all' | 'category' | 'product' | 'vendor',
    applicable_ids: [] as string[]
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open) {
      fetchData()
      if (editingCoupon) {
        setFormData({
          code: editingCoupon.code,
          title: editingCoupon.title,
          description: editingCoupon.description || '',
          discount_type: editingCoupon.discount_type,
          discount_value: editingCoupon.discount_value,
          minimum_amount: editingCoupon.minimum_amount || 0,
          maximum_discount: editingCoupon.maximum_discount || 0,
          usage_limit: editingCoupon.usage_limit || 0,
          valid_from: editingCoupon.valid_from.split('T')[0],
          valid_until: editingCoupon.valid_until.split('T')[0],
          is_active: editingCoupon.is_active,
          applicable_to: editingCoupon.applicable_to,
          applicable_ids: editingCoupon.applicable_ids || []
        })
      } else {
        // Reset form for new coupon
        setFormData({
          code: '',
          title: '',
          description: '',
          discount_type: 'percentage',
          discount_value: 0,
          minimum_amount: 0,
          maximum_discount: 0,
          usage_limit: 0,
          valid_from: '',
          valid_until: '',
          is_active: true,
          applicable_to: 'all',
          applicable_ids: []
        })
      }
      setErrors({})
    }
  }, [open, editingCoupon])

  useEffect(() => {
    if (formData.applicable_to !== 'all' && formData.applicable_ids.length > 0) {
      fetchSelectedItems()
    } else {
      setSelectedItems([])
    }
  }, [formData.applicable_to, formData.applicable_ids])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('category_id, name')
        .eq('is_active', true)
        .order('name')
      
      setCategories(categoriesData || [])

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('product_id, title')
        .eq('is_active', true)
        .order('title')
      
      setProducts(productsData || [])

      // Fetch vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('vendor_id, name')
        .eq('is_active', true)
        .order('name')
      
      setVendors(vendorsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchSelectedItems = async () => {
    if (formData.applicable_ids.length === 0) {
      setSelectedItems([])
      return
    }

    try {
      let data: any[] = []
      
      switch (formData.applicable_to) {
        case 'category':
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('category_id, name')
            .in('category_id', formData.applicable_ids)
          data = categoriesData || []
          break
        case 'product':
          const { data: productsData } = await supabase
            .from('products')
            .select('product_id, title')
            .in('product_id', formData.applicable_ids)
          data = productsData || []
          break
        case 'vendor':
          const { data: vendorsData } = await supabase
            .from('vendors')
            .select('vendor_id, name')
            .in('vendor_id', formData.applicable_ids)
          data = vendorsData || []
          break
      }
      
      setSelectedItems(data)
    } catch (error) {
      console.error('Error fetching selected items:', error)
    }
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code: result })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleApplicableItemsChange = (items: any[]) => {
    const ids = items.map(item => 
      formData.applicable_to === 'category' ? item.category_id :
      formData.applicable_to === 'product' ? item.product_id :
      item.vendor_id
    )
    setFormData({ ...formData, applicable_ids: ids })
    setSelectedItems(items)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required'
    } else if (formData.code.length < 3) {
      newErrors.code = 'Coupon code must be at least 3 characters'
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Discount value must be greater than 0'
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage discount cannot exceed 100%'
    }

    if (formData.minimum_amount < 0) {
      newErrors.minimum_amount = 'Minimum amount cannot be negative'
    }

    if (formData.maximum_discount < 0) {
      newErrors.maximum_discount = 'Maximum discount cannot be negative'
    }

    if (formData.usage_limit < 0) {
      newErrors.usage_limit = 'Usage limit cannot be negative'
    }

    if (!formData.valid_from) {
      newErrors.valid_from = 'Valid from date is required'
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required'
    }

    if (formData.valid_from && formData.valid_until && new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      newErrors.valid_until = 'Valid until date must be after valid from date'
    }

    if (formData.applicable_to !== 'all' && formData.applicable_ids.length === 0) {
      newErrors.applicable_ids = `Please select at least one ${formData.applicable_to}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const couponData = {
      ...formData,
      minimum_amount: formData.minimum_amount || null,
      maximum_discount: formData.maximum_discount || null,
      usage_limit: formData.usage_limit || null,
      applicable_ids: formData.applicable_to === 'all' ? null : formData.applicable_ids,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: new Date(formData.valid_until).toISOString()
    }

    onSave(couponData)
  }

  const getApplicableItems = () => {
    switch (formData.applicable_to) {
      case 'category':
        return categories
      case 'product':
        return products
      case 'vendor':
        return vendors
      default:
        return []
    }
  }

  const getItemLabel = (item: any) => {
    return formData.applicable_to === 'category' ? item.name :
           formData.applicable_to === 'product' ? item.title :
           item.name
  }

  const getItemValue = (item: any) => {
    return formData.applicable_to === 'category' ? item.category_id :
           formData.applicable_to === 'product' ? item.product_id :
           item.vendor_id
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
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
        <CouponIcon />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {editingCoupon ? 'Update coupon details' : 'Set up a new discount coupon'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loadingData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading data...
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Coupon Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Coupon Code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              error={!!errors.code}
              helperText={errors.code}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={generateCouponCode}
                      sx={{ color: THEME_COLORS.primary }}
                    >
                      Generate
                    </Button>
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

          {/* Title */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
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

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
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

          {/* Discount Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={formData.discount_type}
                label="Discount Type"
                onChange={(e) => handleInputChange('discount_type', e.target.value)}
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.rentPrimary,
                  },
                }}
              >
                <MenuItem value="percentage">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PercentIcon fontSize="small" />
                    Percentage
                  </Box>
                </MenuItem>
                <MenuItem value="fixed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CurrencyIcon fontSize="small" />
                    Fixed Amount
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Discount Value */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={formData.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₹)'}
              type="number"
              value={formData.discount_value}
              onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
              error={!!errors.discount_value}
              helperText={errors.discount_value}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {formData.discount_type === 'percentage' ? <PercentIcon /> : <CurrencyIcon />}
                  </InputAdornment>
                ),
                inputProps: { min: 0, max: formData.discount_type === 'percentage' ? 100 : undefined }
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

          {/* Minimum Amount */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Amount (₹)"
              type="number"
              value={formData.minimum_amount}
              onChange={(e) => handleInputChange('minimum_amount', parseFloat(e.target.value) || 0)}
              error={!!errors.minimum_amount}
              helperText={errors.minimum_amount || 'Minimum order amount to use this coupon'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyIcon />
                  </InputAdornment>
                ),
                inputProps: { min: 0 }
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

          {/* Maximum Discount (for percentage) */}
          {formData.discount_type === 'percentage' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Discount (₹)"
                type="number"
                value={formData.maximum_discount}
                onChange={(e) => handleInputChange('maximum_discount', parseFloat(e.target.value) || 0)}
                error={!!errors.maximum_discount}
                helperText={errors.maximum_discount || 'Maximum discount amount (optional)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CurrencyIcon />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
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
          )}

          {/* Usage Limit */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Usage Limit"
              type="number"
              value={formData.usage_limit}
              onChange={(e) => handleInputChange('usage_limit', parseInt(e.target.value) || 0)}
              error={!!errors.usage_limit}
              helperText={errors.usage_limit || 'Leave 0 for unlimited usage'}
              InputProps={{
                inputProps: { min: 0 }
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

          {/* Valid From */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Valid From"
              type="date"
              value={formData.valid_from}
              onChange={(e) => handleInputChange('valid_from', e.target.value)}
              error={!!errors.valid_from}
              helperText={errors.valid_from}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon />
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

          {/* Valid Until */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Valid Until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => handleInputChange('valid_until', e.target.value)}
              error={!!errors.valid_until}
              helperText={errors.valid_until}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon />
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

          {/* Applicable To */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Applicable To</InputLabel>
              <Select
                value={formData.applicable_to}
                label="Applicable To"
                onChange={(e) => handleInputChange('applicable_to', e.target.value)}
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.rentPrimary,
                  },
                }}
              >
                <MenuItem value="all">All Products</MenuItem>
                <MenuItem value="category">Specific Categories</MenuItem>
                <MenuItem value="product">Specific Products</MenuItem>
                <MenuItem value="vendor">Specific Vendors</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Applicable Items */}
          {formData.applicable_to !== 'all' && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={getApplicableItems()}
                value={selectedItems}
                onChange={(event, newValue) => handleApplicableItemsChange(newValue)}
                getOptionLabel={getItemLabel}
                isOptionEqualToValue={(option, value) => getItemValue(option) === getItemValue(value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={getItemLabel(option)}
                      {...getTagProps({ index })}
                      key={getItemValue(option)}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${formData.applicable_to}s`}
                    error={!!errors.applicable_ids}
                    helperText={errors.applicable_ids || `Choose specific ${formData.applicable_to}s for this coupon`}
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
                )}
              />
            </Grid>
          )}

          {/* Active Status */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
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
              label="Active"
            />
          </Grid>

          {/* Info Alert */}
          <Grid item xs={12}>
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              sx={{ 
                backgroundColor: THEME_COLORS.tint,
                '& .MuiAlert-icon': {
                  color: THEME_COLORS.rentPrimary
                }
              }}
            >
              <Typography variant="body2">
                <strong>Coupon Preview:</strong> {formData.code} - {formData.discount_type === 'percentage' ? `${formData.discount_value}% OFF` : `₹${formData.discount_value} OFF`}
                {formData.minimum_amount > 0 && ` (Min: ₹${formData.minimum_amount})`}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            color: THEME_COLORS.rentPrimary,
            borderColor: THEME_COLORS.rentPrimary,
            '&:hover': {
              backgroundColor: THEME_COLORS.tint,
              borderColor: THEME_COLORS.rentPrimaryDark,
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, #e6970a 0%, ${THEME_COLORS.rentPrimaryDark} 100%)`,
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              {editingCoupon ? 'Updating...' : 'Creating...'}
            </Box>
          ) : (
            editingCoupon ? 'Update Coupon' : 'Create Coupon'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
