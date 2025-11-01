'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Chip,
  IconButton,
  Paper,
  Divider
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { Image } from '@imagekit/next'
import { ImageKitUploader } from '@/components/ImageKitUploader'
import { deleteFromImageKit, extractFileIdFromUrl } from '@/lib/imagekit'
import Link from 'next/link'

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

interface UploadedImage {
  url: string
  uploadedAt: Date
  folder: string
  size?: number
  type?: string
}

export default function TestUploadPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('test-uploads')
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [authTest, setAuthTest] = useState<{
    loading: boolean
    result: any
  }>({ loading: false, result: null })

  const folders = [
    'test-uploads',
    'products',
    'categories', 
    'advertisements',
    'vendor-products'
  ]

  const handleImageUploaded = (imageUrl: string) => {
    const newImage: UploadedImage = {
      url: imageUrl,
      uploadedAt: new Date(),
      folder: selectedFolder
    }
    
    setUploadedImages(prev => [newImage, ...prev])
    setUploadStatus({
      type: 'success',
      message: `Image uploaded successfully to ${selectedFolder} folder!`
    })

    // Clear status after 5 seconds
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 5000)
  }

  const handleDeleteImage = async (index: number) => {
    const image = uploadedImages[index]
    
    try {
      // If it's an ImageKit URL, delete from ImageKit
      if (image.url.includes('imagekit.io')) {
        const fileId = extractFileIdFromUrl(image.url)
        if (fileId) {
          await deleteFromImageKit(fileId)
        }
      }

      // Remove from local state
      setUploadedImages(prev => prev.filter((_, i) => i !== index))
      setUploadStatus({
        type: 'success',
        message: 'Image deleted successfully!'
      })

      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: '' })
      }, 3000)

    } catch (error) {
      console.error('Error deleting image:', error)
      setUploadStatus({
        type: 'error',
        message: 'Failed to delete image. Please try again.'
      })
    }
  }

  const clearAllImages = () => {
    setUploadedImages([])
    setUploadStatus({
      type: 'info',
      message: 'All images cleared from test page (not deleted from ImageKit)'
    })

    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 3000)
  }

  const testAuthentication = async () => {
    setAuthTest({ loading: true, result: null })
    
    try {
      const response = await fetch('/api/imagekit/test-auth')
      const result = await response.json()
      
      setAuthTest({ loading: false, result })
      
      if (result.success) {
        setUploadStatus({
          type: 'success',
          message: 'ImageKit authentication test passed! ✅'
        })
      } else {
        setUploadStatus({
          type: 'error',
          message: `Authentication test failed: ${result.details}`
        })
      }
    } catch (error) {
      setAuthTest({ loading: false, result: { error: error instanceof Error ? error.message : 'Unknown error' } })
      setUploadStatus({
        type: 'error',
        message: 'Failed to test authentication'
      })
    }

    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 5000)
  }

  const runFullDebug = async () => {
    setAuthTest({ loading: true, result: null })
    
    try {
      const response = await fetch('/api/imagekit/debug')
      const result = await response.json()
      
      setAuthTest({ loading: false, result })
      
      if (result.success) {
        setUploadStatus({
          type: 'success',
          message: 'Full ImageKit debug completed! Check results below. ✅'
        })
      } else {
        setUploadStatus({
          type: 'error',
          message: `Debug failed: ${result.details}`
        })
      }
    } catch (error) {
      setAuthTest({ loading: false, result: { error: error instanceof Error ? error.message : 'Unknown error' } })
      setUploadStatus({
        type: 'error',
        message: 'Failed to run debug'
      })
    }

    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 8000)
  }

  const verifyEnvironment = async () => {
    setAuthTest({ loading: true, result: null })
    
    try {
      const response = await fetch('/api/imagekit/verify-env')
      const result = await response.json()
      
      setAuthTest({ loading: false, result })
      
      if (result.allValid) {
        setUploadStatus({
          type: 'success',
          message: 'Environment variables are valid! ✅'
        })
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Environment variables have issues. Check results below.'
        })
      }
    } catch (error) {
      setAuthTest({ loading: false, result: { error: error instanceof Error ? error.message : 'Unknown error' } })
      setUploadStatus({
        type: 'error',
        message: 'Failed to verify environment'
      })
    }

    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 5000)
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      py: 4
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          borderRadius: 3
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                🧪 ImageKit Upload Test
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Test the ImageKit integration with real file uploads
              </Typography>
            </Box>
            <Link href="/" passHref>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Back to Home
              </Button>
            </Link>
          </Box>
        </Paper>

        {/* Status Alert */}
        {uploadStatus.type && (
          <Alert 
            severity={uploadStatus.type} 
            sx={{ mb: 3, borderRadius: 2 }}
            icon={uploadStatus.type === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          >
            {uploadStatus.message}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: THEME_COLORS.rentPrimary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <CloudUploadIcon sx={{ mr: 2 }} />
                  Upload Test
                </Typography>

                {/* Folder Selection */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Select Upload Folder:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {folders.map((folder) => (
                      <Chip
                        key={folder}
                        label={folder}
                        onClick={() => setSelectedFolder(folder)}
                        color={selectedFolder === folder ? 'primary' : 'default'}
                        variant={selectedFolder === folder ? 'filled' : 'outlined'}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedFolder === folder 
                              ? THEME_COLORS.rentPrimaryDark 
                              : THEME_COLORS.tint
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* ImageKit Uploader */}
                <ImageKitUploader
                  onImageUploaded={handleImageUploaded}
                  folder={selectedFolder}
                  maxFiles={5}
                  maxSizeInMB={10}
                  showUrlInput={true}
                  themeColors={{
                    primary: THEME_COLORS.primary,
                    secondary: THEME_COLORS.rentPrimary,
                    tint: THEME_COLORS.tint
                  }}
                />

                {/* Authentication Test */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#1565c0' }}>
                    🔐 Authentication Test
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={verifyEnvironment}
                      disabled={authTest.loading}
                      size="small"
                      sx={{
                        color: '#2e7d32',
                        borderColor: '#2e7d32',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        }
                      }}
                    >
                      {authTest.loading ? 'Checking...' : 'Check Env Vars'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={testAuthentication}
                      disabled={authTest.loading}
                      size="small"
                      sx={{
                        color: '#1565c0',
                        borderColor: '#1565c0',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(21, 101, 192, 0.1)',
                        }
                      }}
                    >
                      {authTest.loading ? 'Testing...' : 'Quick Auth Test'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={runFullDebug}
                      disabled={authTest.loading}
                      size="small"
                      sx={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#b71c1c',
                        }
                      }}
                    >
                      {authTest.loading ? 'Debugging...' : 'Full Debug'}
                    </Button>
                  </Box>
                  
                  {authTest.result && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'white', borderRadius: 1, fontSize: '0.75rem' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(authTest.result, null, 2)}
                      </pre>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2, p: 2, backgroundColor: THEME_COLORS.tint, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Test Features:</strong>
                    <br />• Real-time progress tracking
                    <br />• Multiple file upload
                    <br />• Drag & drop support
                    <br />• URL input option
                    <br />• Error handling
                    <br />• File validation (type & size)
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc02' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                    🐛 Debug Info
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#bf360c' }}>
                    Check browser console for detailed upload logs when testing.
                    <br />Server logs will show authentication details.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold',
                    color: THEME_COLORS.rentPrimary,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    📸 Uploaded Images ({uploadedImages.length})
                  </Typography>
                  {uploadedImages.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={clearAllImages}
                      sx={{
                        color: THEME_COLORS.rentPrimary,
                        borderColor: THEME_COLORS.rentPrimary,
                        '&:hover': {
                          backgroundColor: THEME_COLORS.tint,
                        }
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </Box>

                {uploadedImages.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    color: 'text.secondary'
                  }}>
                    <CloudUploadIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No images uploaded yet
                    </Typography>
                    <Typography variant="body2">
                      Upload some images to see them here
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {uploadedImages.map((image, index) => (
                      <Grid item xs={6} key={index}>
                        <Card sx={{ 
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          '&:hover': {
                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                          }
                        }}>
                          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                            {image.url.includes('imagekit.io') ? (
                              <Image
                                src={image.url}
                                alt={`Uploaded image ${index + 1}`}
                                width={150}
                                height={150}
                                transformation={[{ 
                                  width: 150, 
                                  height: 150, 
                                  crop: 'maintain_ratio',
                                  quality: 80
                                }]}
                                style={{ 
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <img
                                src={image.url}
                                alt={`Uploaded image ${index + 1}`}
                                style={{ 
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            )}
                          </Box>
                          
                          {/* Image Info Overlay */}
                          <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white',
                            p: 1
                          }}>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {image.folder}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {image.uploadedAt.toLocaleTimeString()}
                            </Typography>
                          </Box>

                          {/* Delete Button */}
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
                            onClick={() => handleDeleteImage(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Instructions */}
        <Card sx={{ mt: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: THEME_COLORS.rentPrimary }}>
              🔧 Testing Instructions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  1. Select Folder
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose which ImageKit folder to upload to. Each folder represents a different content type.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  2. Upload Images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drag & drop files or click to select. You can also paste image URLs. Watch the progress bar!
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  3. Verify Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check that images appear correctly with ImageKit transformations and can be deleted.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
