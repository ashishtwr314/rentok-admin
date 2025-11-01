'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment
} from '@mui/material'
import {
  Store as StoreIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material'

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

interface VendorFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  business_name: string
  business_address: string
  city: string
  state: string
  postal_code: string
  country: string
  gst_number: string
  pan_number: string
  bank_account_number: string
  bank_ifsc_code: string
  bank_account_holder_name: string
  is_verified: boolean
  is_active: boolean
  commission_rate: number
}

interface VendorFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: VendorFormData) => void
  formData: VendorFormData
  setFormData: (data: VendorFormData) => void
  editingVendor: any
  loading?: boolean
}

// Validation functions
const validateEmail = (email: string): string => {
  if (!email) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  return ''
}

const validatePhone = (phone: string): string => {
  if (!phone) return 'Phone number is required'
  
  // Remove any spaces/dashes for validation
  const cleanPhone = phone.replace(/[\s\-]/g, '')
  
  // Check if it's exactly 10 digits
  const phoneRegex = /^\d{10}$/
  if (!phoneRegex.test(cleanPhone)) return 'Phone number must be exactly 10 digits'
  
  // Check if it starts with valid Indian mobile prefixes (6, 7, 8, 9)
  if (!/^[6-9]/.test(cleanPhone)) return 'Indian mobile number must start with 6, 7, 8, or 9'
  
  return ''
}

const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === '') return `${fieldName} is required`
  return ''
}

const validatePassword = (password: string): string => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
  if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)'
  return ''
}

const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Please confirm your password'
  if (password !== confirmPassword) return 'Passwords do not match'
  return ''
}

export const VendorForm: React.FC<VendorFormProps> = ({
  open,
  onClose,
  onSave,
  formData,
  setFormData,
  editingVendor,
  loading = false
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required field validations
    newErrors.name = validateRequired(formData.name, 'Full Name')
    newErrors.email = validateEmail(formData.email)
    newErrors.phone = validatePhone(formData.phone)
    newErrors.business_name = validateRequired(formData.business_name, 'Business Name')
    newErrors.business_address = validateRequired(formData.business_address, 'Business Address')
    newErrors.city = validateRequired(formData.city, 'City')
    newErrors.state = validateRequired(formData.state, 'State')
    newErrors.postal_code = validateRequired(formData.postal_code, 'Postal Code')
    
    // Password validations (only for new vendors or when password is being changed)
    if (!editingVendor || formData.password) {
      newErrors.password = validatePassword(formData.password)
      newErrors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword)
    }

    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key]
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handlePhoneChange = (value: string) => {
    // Extract only the digits from the input
    const digitsOnly = value.replace(/\D/g, '')
    
    // Limit to 10 digits maximum
    const limitedDigits = digitsOnly.slice(0, 10)
    
    // Format as XXXXX XXXXX for better readability
    let formatted = ''
    if (limitedDigits.length > 0) {
      if (limitedDigits.length <= 5) {
        formatted = limitedDigits
      } else {
        formatted = limitedDigits.slice(0, 5) + ' ' + limitedDigits.slice(5)
      }
    }
    
    setFormData({ ...formData, phone: formatted })
  }

  const handleFieldChange = (field: keyof VendorFormData, value: any) => {
    if (field === 'phone') {
      handlePhoneChange(value)
    } else {
      setFormData({ ...formData, [field]: value })
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const getFieldError = (field: string): boolean => {
    return !!errors[field]
  }

  const getHelperText = (field: string): string => {
    return errors[field] || ''
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow digits, backspace, delete, arrow keys, tab
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
    
    if (!/[\d]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault()
    }
  }

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target
    // Position cursor at the end of the input
    setTimeout(() => {
      const length = input.value.length
      input.setSelectionRange(length, length)
    }, 0)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
        color: 'white',
        p: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StoreIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          {/* Basic Information Section */}
          <Card sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: THEME_COLORS.primary, 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <BusinessIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Basic Information
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    required
                    error={getFieldError('name')}
                    helperText={getHelperText('name')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: THEME_COLORS.primary }} />
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    required
                    error={getFieldError('email')}
                    helperText={getHelperText('email')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: THEME_COLORS.primary }} />
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                    onFocus={handlePhoneFocus}
                    required
                    error={getFieldError('phone')}
                    helperText={getHelperText('phone')}
                    placeholder="98765 43210"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: THEME_COLORS.primary }} />
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={editingVendor ? "New Password (leave blank to keep current)" : "Password"}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    required={!editingVendor}
                    error={getFieldError('password')}
                    helperText={getHelperText('password') || 'Must be at least 8 characters with uppercase, lowercase, number, and special character'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: THEME_COLORS.primary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    required={!editingVendor || formData.password}
                    error={getFieldError('confirmPassword')}
                    helperText={getHelperText('confirmPassword')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: THEME_COLORS.primary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Business Information Section */}
          <Card sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: THEME_COLORS.secondary, 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <StoreIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Business Information
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={formData.business_name}
                    onChange={(e) => handleFieldChange('business_name', e.target.value)}
                    required
                    error={getFieldError('business_name')}
                    helperText={getHelperText('business_name')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon sx={{ color: THEME_COLORS.primary }} />
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    value={formData.gst_number}
                    onChange={(e) => handleFieldChange('gst_number', e.target.value)}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: THEME_COLORS.primary, fontWeight: 'bold' }}>GST</Typography>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Address"
                    multiline
                    rows={3}
                    value={formData.business_address}
                    onChange={(e) => handleFieldChange('business_address', e.target.value)}
                    placeholder="Enter complete business address..."
                    required
                    error={getFieldError('business_address')}
                    helperText={getHelperText('business_address')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: THEME_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: THEME_COLORS.rentPrimary,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    required
                    error={getFieldError('city')}
                    helperText={getHelperText('city')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: THEME_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: THEME_COLORS.rentPrimary,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    required
                    error={getFieldError('state')}
                    helperText={getHelperText('state')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: THEME_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: THEME_COLORS.rentPrimary,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={formData.postal_code}
                    onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                    required
                    error={getFieldError('postal_code')}
                    helperText={getHelperText('postal_code')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: THEME_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: THEME_COLORS.rentPrimary,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Bank Information Section */}
          <Card sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: '#4CAF50', 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹</Typography>
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Bank Information
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    value={formData.bank_account_holder_name}
                    onChange={(e) => handleFieldChange('bank_account_holder_name', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: THEME_COLORS.primary }} />
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={formData.bank_account_number}
                    onChange={(e) => handleFieldChange('bank_account_number', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: THEME_COLORS.primary, fontWeight: 'bold' }}>A/C</Typography>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={formData.bank_ifsc_code}
                    onChange={(e) => handleFieldChange('bank_ifsc_code', e.target.value)}
                    placeholder="e.g., SBIN0001234"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: THEME_COLORS.primary, fontWeight: 'bold' }}>IFSC</Typography>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    value={formData.pan_number}
                    onChange={(e) => handleFieldChange('pan_number', e.target.value)}
                    placeholder="e.g., ABCDE1234F"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: THEME_COLORS.primary, fontWeight: 'bold' }}>PAN</Typography>
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
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: THEME_COLORS.rentPrimary,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card sx={{ mb: 2, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: '#FF9800', 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <VerifiedIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                  Vendor Status
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: `2px solid ${formData.is_active ? '#4CAF50' : '#ccc'}`,
                    borderRadius: 2,
                    backgroundColor: formData.is_active ? '#E8F5E8' : '#f5f5f5',
                    transition: 'all 0.3s ease'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4CAF50',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4CAF50',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Active Status
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formData.is_active ? 'Vendor can receive orders' : 'Vendor is inactive'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: `2px solid ${formData.is_verified ? THEME_COLORS.primary : '#ccc'}`,
                    borderRadius: 2,
                    backgroundColor: formData.is_verified ? THEME_COLORS.tint : '#f5f5f5',
                    transition: 'all 0.3s ease'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_verified}
                          onChange={(e) => handleFieldChange('is_verified', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: THEME_COLORS.primary,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: THEME_COLORS.primary,
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Verification Status
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formData.is_verified ? 'Documents verified' : 'Pending verification'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            mr: 2,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={editingVendor ? <EditIcon /> : <AddIcon />}
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              opacity: 0.6,
              transform: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Saving...' : (editingVendor ? 'Update Vendor' : 'Create Vendor')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
