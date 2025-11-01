'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Link as LinkIcon
} from '@mui/icons-material'
import { uploadToImageKit } from '@/lib/imagekit'

interface ImageKitUploaderProps {
  onImageUploaded: (imageUrl: string) => void
  folder?: string
  maxFiles?: number
  acceptedFormats?: string[]
  maxSizeInMB?: number
  disabled?: boolean
  showUrlInput?: boolean
  themeColors?: {
    primary: string
    secondary: string
    tint: string
  }
}

const DEFAULT_THEME_COLORS = {
  primary: '#FBA800',
  secondary: '#9A2143',
  tint: '#FCF5E9'
}

export const ImageKitUploader: React.FC<ImageKitUploaderProps> = ({
  onImageUploaded,
  folder = 'products',
  maxFiles = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSizeInMB = 5,
  disabled = false,
  showUrlInput = true,
  themeColors = DEFAULT_THEME_COLORS
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadTab, setUploadTab] = useState(0) // 0 for URL, 1 for file upload
  const [newImageUrl, setNewImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`
    }

    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxSizeInMB}MB`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setError(null)

      // Upload with real progress tracking using official SDK
      const imageUrl = await uploadToImageKit(
        file, 
        folder, 
        undefined, // Let the function generate filename
        (progress) => {
          // Real progress from ImageKit SDK
          const percentComplete = Math.round((progress.loaded / progress.total) * 100)
          setUploadProgress(percentComplete)
        }
      )
      
      onImageUploaded(imageUrl)
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)

    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error instanceof Error ? error.message : 'Error uploading file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        await uploadFile(files[i])
      }
    }
    // Reset input
    event.target.value = ''
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        await uploadFile(files[i])
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      onImageUploaded(newImageUrl.trim())
      setNewImageUrl('')
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Uploading to ImageKit... {uploadProgress}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress}
            sx={{ 
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                backgroundColor: themeColors.secondary,
              }
            }} 
          />
        </Box>
      )}

      {/* Upload Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={uploadTab} 
          onChange={(e, newValue) => setUploadTab(newValue)}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
            },
            '& .Mui-selected': {
              color: themeColors.secondary,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: themeColors.secondary,
            }
          }}
        >
          {showUrlInput && (
            <Tab 
              icon={<LinkIcon />} 
              label="Image URL" 
              iconPosition="start"
            />
          )}
          <Tab 
            icon={<PhotoCameraIcon />} 
            label="Upload Files" 
            iconPosition="start"
          />
        </Tabs>

        {/* URL Input Tab */}
        {showUrlInput && uploadTab === 0 && (
          <TextField
            fullWidth
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addImageUrl()
              }
            }}
            disabled={disabled}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '&:hover fieldset': {
                  borderColor: themeColors.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.secondary,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: themeColors.secondary }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    onClick={addImageUrl} 
                    size="small"
                    disabled={!newImageUrl.trim() || disabled}
                    sx={{
                      color: themeColors.secondary,
                      '&:hover': {
                        backgroundColor: themeColors.tint,
                      }
                    }}
                  >
                    Add URL
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* File Upload Tab */}
        {uploadTab === (showUrlInput ? 1 : 0) && (
          <Box>
            {/* Drag & Drop Area */}
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={{
                border: `2px dashed ${dragOver ? themeColors.secondary : '#ddd'}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: dragOver ? themeColors.tint : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: disabled ? '#ddd' : themeColors.primary,
                  backgroundColor: disabled ? 'white' : themeColors.tint,
                }
              }}
              onClick={() => !disabled && document.getElementById('imagekit-file-input')?.click()}
            >
              <PhotoCameraIcon 
                sx={{ 
                  fontSize: 48, 
                  color: dragOver ? themeColors.secondary : '#999',
                  mb: 2 
                }} 
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                {dragOver ? 'Drop images here' : 'Upload to ImageKit'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Drag & drop images here, or click to select files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} (Max {maxSizeInMB}MB each)
              </Typography>
              
              <input
                id="imagekit-file-input"
                type="file"
                multiple
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                disabled={disabled}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Upload Button */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => document.getElementById('imagekit-file-input')?.click()}
                disabled={uploading || disabled}
                sx={{
                  borderColor: themeColors.secondary,
                  color: themeColors.secondary,
                  '&:hover': {
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.tint,
                  }
                }}
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
