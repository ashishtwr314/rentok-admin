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
  Box,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
  Chip
} from '@mui/material'
import {
  Label as TagIcon,
  Palette as ColorIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { ImageKitUploader } from './ImageKitUploader'

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

interface Tag {
  tag_id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  color: string
  is_active: boolean
  usage_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

interface TagFormProps {
  open: boolean
  onClose: () => void
  onSave: (tagData: any) => void
  editingTag?: Tag | null
  loading?: boolean
}

const PREDEFINED_COLORS = [
  '#9A2143', // Brand primary
  '#FBA800', // Brand secondary
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#FFD700', // Gold
]

export const TagForm: React.FC<TagFormProps> = ({
  open,
  onClose,
  onSave,
  editingTag,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    color: '#9A2143',
    is_active: true,
    sort_order: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingTag) {
        setFormData({
          name: editingTag.name,
          description: editingTag.description || '',
          image_url: editingTag.image_url || '',
          color: editingTag.color,
          is_active: editingTag.is_active,
          sort_order: editingTag.sort_order
        })
      } else {
        // Reset form for new tag
        setFormData({
          name: '',
          description: '',
          image_url: '',
          color: '#9A2143',
          is_active: true,
          sort_order: 0
        })
      }
      setErrors({})
    }
  }, [open, editingTag])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    
    // Auto-generate slug when name changes
    if (field === 'name') {
      const slug = generateSlug(value)
      setFormData(prev => ({ ...prev, slug }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true)
      // The ImageKitUploader component will handle the upload
      // We'll get the URL back through the onSuccess callback
    } catch (error) {
      console.error('Error uploading image:', error)
      setErrors({ ...errors, image_url: 'Error uploading image' })
    } finally {
      setImageUploading(false)
    }
  }

  const handleImageUploadSuccess = (url: string) => {
    setFormData({ ...formData, image_url: url })
    setImageUploading(false)
  }

  const handleImageUploadError = (error: string) => {
    setErrors({ ...errors, image_url: error })
    setImageUploading(false)
  }

  const removeImage = () => {
    setFormData({ ...formData, image_url: '' })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tag name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tag name must be less than 100 characters'
    }

    if (formData.sort_order < 0) {
      newErrors.sort_order = 'Sort order cannot be negative'
    }

    if (formData.color && !formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.color = 'Invalid color format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const tagData = {
      ...formData,
      slug: generateSlug(formData.name),
      image_url: formData.image_url || null,
      description: formData.description || null
    }

    onSave(tagData)
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
        <TagIcon />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {editingTag ? 'Update tag details' : 'Set up a new product tag'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Basic Information Section */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary, display: 'flex', alignItems: 'center' }}>
            <TagIcon sx={{ mr: 1 }} />
            Basic Information
          </Typography>
          
          <Grid container spacing={3}>
            {/* Tag Name */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Tag Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name || 'Display name for the tag (2-100 characters)'}
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

            {/* Sort Order */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sort Order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                error={!!errors.sort_order}
                helperText={errors.sort_order || 'Display order (lower = first)'}
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

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                helperText="Optional description explaining what this tag represents"
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
          </Grid>
        </Box>

        {/* Visual Design Section */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary, display: 'flex', alignItems: 'center' }}>
            <ColorIcon sx={{ mr: 1 }} />
            Visual Design
          </Typography>
          
          <Grid container spacing={3}>
            {/* Tag Color */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Tag Color
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField
                    label="Color Code"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    error={!!errors.color}
                    helperText={errors.color || 'Hex color code (e.g., #9A2143)'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ColorIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
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
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: formData.color,
                      borderRadius: 2,
                      border: '2px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <TagIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                </Box>

                {/* Predefined Colors */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Quick select colors:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {PREDEFINED_COLORS.map((color) => (
                    <Chip
                      key={color}
                      label=""
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: color,
                        border: formData.color === color ? '3px solid #000' : '2px solid #e0e0e0',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Tag Image */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Tag Image/Icon
                </Typography>
                
                {formData.image_url ? (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      src={formData.image_url}
                      sx={{ width: 80, height: 80 }}
                      variant="rounded"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Current image
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={removeImage}
                        variant="outlined"
                      >
                        Remove Image
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #e0e0e0',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: '#fafafa',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: THEME_COLORS.primary,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload tag image/icon
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      Recommended: 64x64px or larger
                    </Typography>
                    <ImageKitUploader
                      onSuccess={handleImageUploadSuccess}
                      onError={handleImageUploadError}
                      folder="tags"
                      buttonText="Choose Image"
                      buttonProps={{
                        variant: 'outlined',
                        size: 'small',
                        startIcon: <UploadIcon />,
                        disabled: imageUploading
                      }}
                    />
                    {imageUploading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Uploading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {errors.image_url && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.image_url}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Settings Section */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary, display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            Settings
          </Typography>
          
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
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Active Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.is_active ? 'Tag is available for use' : 'Tag is disabled and hidden'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Preview Section */}
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: THEME_COLORS.rentPrimary, display: 'flex', alignItems: 'center' }}>
            <TagIcon sx={{ mr: 1 }} />
            Preview
          </Typography>
          
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: formData.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {formData.image_url ? (
                  <Avatar
                    src={formData.image_url}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <TagIcon sx={{ color: 'white', fontSize: 20 }} />
                )}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {formData.name || 'Tag Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.description || 'No description provided'}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Generated Slug:</strong> {generateSlug(formData.name) || 'tag-slug'}
            </Typography>
            <Typography variant="body2">
              <strong>Sort Order:</strong> {formData.sort_order} | 
              <strong> Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}
            </Typography>
          </Alert>
        </Box>
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
          disabled={loading || imageUploading}
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
              {editingTag ? 'Updating...' : 'Creating...'}
            </Box>
          ) : (
            editingTag ? 'Update Tag' : 'Create Tag'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
