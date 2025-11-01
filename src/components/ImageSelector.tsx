'use client'

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Fade
} from '@mui/material'
import { 
  Delete as DeleteIcon,
  Link as LinkIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon
} from '@mui/icons-material'

export interface SelectedImage {
  id: string
  url: string
  file?: File
  name: string
  type: 'url' | 'file'
}

export interface ImageSelectorProps {
  // Basic configuration
  maxImages?: number
  acceptedFormats?: string[]
  maxSizeInMB?: number
  folder?: string
  tags?: string[]
  disabled?: boolean
  
  // UI customization
  label?: string
  helperText?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'compact' | 'full'
  
  // Form integration
  name?: string // For form field name
  value?: string[] // For controlled component (array of URLs)
  onChange?: (urls: string[]) => void // For controlled component
  onImagesChange?: (images: SelectedImage[]) => void // For uncontrolled
  
  // Upload behavior
  autoUpload?: boolean // Upload immediately when images are selected
  onUploadStart?: () => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
  
  // Validation
  required?: boolean
  error?: string
}

export interface ImageSelectorRef {
  getSelectedImages: () => SelectedImage[]
  getUploadedUrls: () => string[]
  clearImages: () => void
  uploadToImageKit: () => Promise<string[]>
  addImageUrl: (url: string) => void
  removeImage: (id: string) => void
}

const ImageSelector = forwardRef<ImageSelectorRef, ImageSelectorProps>(({
  // Basic configuration
  maxImages = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSizeInMB = 5,
  folder = 'uploads',
  tags = [],
  disabled = false,
  
  // UI customization
  label = 'Select Images',
  helperText,
  size = 'medium',
  variant = 'full',
  
  // Form integration
  name,
  value,
  onChange,
  onImagesChange,
  
  // Upload behavior
  autoUpload = false,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  
  // Validation
  required = false,
  error
}, ref) => {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(value || [])
  const [imageUrl, setImageUrl] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with controlled component value
  React.useEffect(() => {
    if (value !== undefined) {
      setUploadedUrls(value)
    }
  }, [value])

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getSelectedImages: () => selectedImages,
    getUploadedUrls: () => uploadedUrls,
    clearImages: () => {
      setSelectedImages([]);
      setUploadedUrls([]);
      if (onImagesChange) onImagesChange([]);
      if (onChange) onChange([]);
    },
    uploadToImageKit: async () => {
      return await uploadImagesToImageKit();
    },
    addImageUrl: (url: string) => {
      const newUrls = [...uploadedUrls, url];
      setUploadedUrls(newUrls);
      if (onChange) onChange(newUrls);
    },
    removeImage: (id: string) => {
      removeSelectedImage(id);
    }
  }));

  // Add image from URL
  const addImageFromUrl = async () => {
    if (!imageUrl.trim() || (selectedImages.length + uploadedUrls.length) >= maxImages) return;
    
    if (autoUpload) {
      // For auto-upload, add directly to uploaded URLs
      const newUrls = [...uploadedUrls, imageUrl.trim()];
      setUploadedUrls(newUrls);
      setImageUrl('');
      if (onChange) onChange(newUrls);
      if (onUploadComplete) onUploadComplete(newUrls);
    } else {
      // For manual upload, add to selected images
      const newImage: SelectedImage = {
        id: Date.now().toString(),
        url: imageUrl.trim(),
        name: `URL Image ${selectedImages.length + 1}`,
        type: 'url'
      };
      
      const updatedImages = [...selectedImages, newImage];
      setSelectedImages(updatedImages);
      setImageUrl('');
      if (onImagesChange) onImagesChange(updatedImages);
    }
  };

  // Add image from file
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const availableSlots = maxImages - (selectedImages.length + uploadedUrls.length);
    const filesToAdd = Array.from(files).slice(0, availableSlots);
    
    if (autoUpload) {
      // Auto-upload files immediately
      if (onUploadStart) onUploadStart();
      setUploading(true);
      
      try {
        const newUrls: string[] = [];
        
        for (let i = 0; i < filesToAdd.length; i++) {
          const file = filesToAdd[i];
          
          // Validate file
          if (!acceptedFormats.includes(file.type)) {
            console.warn(`File ${file.name} has invalid type: ${file.type}`);
            continue;
          }
          
          if (file.size > maxSizeInMB * 1024 * 1024) {
            console.warn(`File ${file.name} is too large: ${file.size} bytes`);
            continue;
          }

          try {
            const urls = await uploadSingleFile(file);
            newUrls.push(...urls);
            
            const progress = Math.round(((i + 1) / filesToAdd.length) * 100);
            setUploadProgress(progress);
            if (onUploadProgress) onUploadProgress(progress);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
          }
        }
        
        const allUrls = [...uploadedUrls, ...newUrls];
        setUploadedUrls(allUrls);
        if (onChange) onChange(allUrls);
        if (onUploadComplete) onUploadComplete(allUrls);
        
      } catch (error) {
        if (onUploadError) onUploadError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      // Add to selected images for manual upload
      filesToAdd.forEach(file => {
        // Validate file
        if (!acceptedFormats.includes(file.type)) {
          console.warn(`File ${file.name} has invalid type: ${file.type}`);
          return;
        }
        
        if (file.size > maxSizeInMB * 1024 * 1024) {
          console.warn(`File ${file.name} is too large: ${file.size} bytes`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: SelectedImage = {
            id: Date.now().toString() + Math.random(),
            url: e.target?.result as string,
            file: file,
            name: file.name,
            type: 'file'
          };
          
          setSelectedImages(prev => {
            const updated = [...prev, newImage];
            if (onImagesChange) onImagesChange(updated);
            return updated;
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload single file helper
  const uploadSingleFile = async (file: File): Promise<string[]> => {
    try {
      // Get fresh authentication parameters
      const authResponse = await fetch('/api/imagekit/auth');
      if (!authResponse.ok) {
        throw new Error('Failed to get authentication parameters');
      }
      const authData = await authResponse.json();

      // Prepare form data
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
      const form = new FormData();
      form.append('file', file);
      form.append('fileName', uniqueFileName);
      form.append('publicKey', publicKey!);
      form.append('signature', authData.signature);
      form.append('expire', authData.expire.toString());
      form.append('token', authData.token);
      form.append('useUniqueFileName', 'true');
      form.append('tags', [...tags, 'component-upload'].join(','));
      form.append('folder', `/${folder}`);
      form.append('isPrivateFile', 'false');

      // Upload to ImageKit
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return [result.url];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Remove selected image
  const removeSelectedImage = (id: string) => {
    const updatedImages = selectedImages.filter(img => img.id !== id);
    setSelectedImages(updatedImages);
    if (onImagesChange) onImagesChange(updatedImages);
  };

  // Remove uploaded image
  const removeUploadedImage = (url: string) => {
    const updatedUrls = uploadedUrls.filter(u => u !== url);
    setUploadedUrls(updatedUrls);
    if (onChange) onChange(updatedUrls);
  };

  // Upload images to ImageKit (called by parent)
  const uploadImagesToImageKit = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    try {
      // Upload images sequentially
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        try {
          // Get fresh authentication parameters
          const authResponse = await fetch('/api/imagekit/auth');
          if (!authResponse.ok) {
            throw new Error('Failed to get authentication parameters');
          }
          const authData = await authResponse.json();

          let fileToUpload: File;

          if (image.type === 'url') {
            // Convert URL to file
            const response = await fetch(image.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch image from URL: ${response.status}`);
            }
            const blob = await response.blob();
            fileToUpload = new File([blob], image.name, { type: blob.type || 'image/jpeg' });
          } else {
            fileToUpload = image.file!;
          }

          // Prepare form data
          const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${image.name}`;
          const form = new FormData();
          form.append('file', fileToUpload);
          form.append('fileName', uniqueFileName);
          form.append('publicKey', publicKey!);
          form.append('signature', authData.signature);
          form.append('expire', authData.expire.toString());
          form.append('token', authData.token);
          form.append('useUniqueFileName', 'true');
          form.append('tags', [...tags, 'component-upload'].join(','));
          form.append('folder', `/${folder}`);
          form.append('isPrivateFile', 'false');

          // Upload to ImageKit
          const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: form,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed for ${image.name}: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          uploadedUrls.push(result.url);
          
          // Small delay between uploads
          if (i < selectedImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (error) {
          console.error(`Error uploading ${image.name}:`, error);
          // Continue with other uploads even if one fails
        }
      }
      
      return uploadedUrls;

    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  // Get size configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { tabHeight: 32, imageSize: 60, maxHeight: 120 };
      case 'large':
        return { tabHeight: 48, imageSize: 100, maxHeight: 300 };
      default:
        return { tabHeight: 40, imageSize: 80, maxHeight: 200 };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <Box>
      {label && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'subtitle1'} 
          sx={{ 
            mb: variant === 'compact' ? 1 : 2, 
            fontWeight: 'bold',
            color: error ? 'error.main' : 'inherit'
          }}
        >
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Typography>
      )}

      {/* Tabs for Image Selection */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              minWidth: 120
            },
            '& .Mui-selected': {
              color: '#9A2143',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#9A2143',
            }
          }}
        >
          <Tab 
            icon={<LinkIcon />} 
            label="URL" 
            iconPosition="start"
            disabled={disabled}
          />
          <Tab 
            icon={<PhotoCameraIcon />} 
            label="Files" 
            iconPosition="start"
            disabled={disabled}
          />
        </Tabs>

        {/* URL Tab */}
        {activeTab === 0 && (
          <Fade in={activeTab === 0}>
            <Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageFromUrl();
                  }
                }}
                disabled={disabled || selectedImages.length >= maxImages}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ color: '#9A2143' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        onClick={addImageFromUrl} 
                        size="small"
                        disabled={!imageUrl.trim() || disabled || selectedImages.length >= maxImages}
                        variant="contained"
                        sx={{
                          backgroundColor: '#9A2143',
                          '&:hover': {
                            backgroundColor: '#7a1a35',
                          }
                        }}
                      >
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Fade>
        )}

        {/* File Upload Tab */}
        {activeTab === 1 && (
          <Fade in={activeTab === 1}>
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                multiple
                onChange={handleFileSelect}
                disabled={disabled}
                style={{ display: 'none' }}
              />
              <Box
                onClick={handleFileButtonClick}
                sx={{
                  border: '2px dashed #9A2143',
                  borderRadius: 2,
                  p: 3,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  backgroundColor: disabled ? '#f5f5f5' : 'white',
                  textAlign: 'center',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': {
                    borderColor: disabled ? '#9A2143' : '#FBA800',
                    backgroundColor: disabled ? '#f5f5f5' : '#fafafa',
                  }
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 32, color: '#9A2143', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Click to select files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max {maxImages} files, {maxSizeInMB}MB each
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Images Preview */}
      {(selectedImages.length > 0 || uploadedUrls.length > 0) && (
        <Box>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
            {autoUpload ? 'Uploaded Images' : 'Selected Images'} ({selectedImages.length + uploadedUrls.length}/{maxImages})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(auto-fill, minmax(${sizeConfig.imageSize}px, 1fr))`, 
            gap: 1,
            maxHeight: sizeConfig.maxHeight,
            overflowY: 'auto',
            p: 1,
            border: error ? '1px solid red' : '1px solid #e0e0e0',
            borderRadius: 1,
            backgroundColor: error ? '#ffeaea' : 'transparent'
          }}>
            {/* Show uploaded images */}
            {uploadedUrls.map((url, index) => (
              <Box 
                key={`uploaded-${index}`}
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '2px solid #4caf50',
                  '&:hover .delete-button': {
                    opacity: 1,
                  }
                }}
              >
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Delete button */}
                <IconButton
                  className="delete-button"
                  onClick={() => removeUploadedImage(url)}
                  disabled={disabled}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    }
                  }}
                  size="small"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
                
                {/* Uploaded indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 2,
                    backgroundColor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.6rem'
                  }}
                >
                  ✓ UPLOADED
                </Box>
              </Box>
            ))}

            {/* Show selected images (for manual upload) */}
            {selectedImages.map((image) => (
              <Box 
                key={image.id}
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                  '&:hover .delete-button': {
                    opacity: 1,
                  }
                }}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Delete button */}
                <IconButton
                  className="delete-button"
                  onClick={() => removeSelectedImage(image.id)}
                  disabled={disabled}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    }
                  }}
                  size="small"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
                
                {/* Type indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.6rem'
                  }}
                >
                  {image.type === 'url' ? 'URL' : 'FILE'}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
});

ImageSelector.displayName = 'ImageSelector';

export default ImageSelector;
