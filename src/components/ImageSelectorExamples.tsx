// Examples of how to use ImageSelector in different scenarios

import React, { useState, useRef } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import ImageSelector, { ImageSelectorRef } from './ImageSelector';

// Example 1: Simple form integration (manual upload)
export const CategoryFormExample = () => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<ImageSelectorRef>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload images when form is submitted
      const imageUrls = await imageRef.current?.uploadToImageKit() || [];
      
      // Create category with images
      const categoryData = {
        name: categoryName,
        images: imageUrls
      };
      
      console.log('Creating category:', categoryData);
      // Call your API here
      
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Category Form</Typography>
      
      <TextField
        fullWidth
        label="Category Name"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        sx={{ mb: 3 }}
      />
      
      <ImageSelector
        ref={imageRef}
        maxImages={3}
        folder="categories"
        tags={['category']}
        label="Category Images"
        helperText="Select up to 3 images for this category"
        required
      />
      
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Creating...' : 'Create Category'}
      </Button>
    </Box>
  );
};

// Example 2: Controlled component with auto-upload
export const ProductFormExample = () => {
  const [productName, setProductName] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    // Images are already uploaded, just use the URLs
    const productData = {
      name: productName,
      images: productImages
    };
    
    console.log('Creating product:', productData);
    // Call your API here
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Product Form (Auto-upload)</Typography>
      
      <TextField
        fullWidth
        label="Product Name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        sx={{ mb: 3 }}
      />
      
      <ImageSelector
        maxImages={5}
        folder="products"
        tags={['product']}
        label="Product Images"
        helperText="Images will upload automatically"
        autoUpload={true}
        value={productImages}
        onChange={setProductImages}
        onUploadStart={() => setUploading(true)}
        onUploadComplete={() => setUploading(false)}
        onUploadError={(error) => {
          setUploading(false);
          console.error('Upload failed:', error);
        }}
        disabled={uploading}
      />
      
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={uploading || !productName}
        sx={{ mt: 2 }}
      >
        Create Product
      </Button>
    </Box>
  );
};

// Example 3: Compact variant for inline use
export const VendorAvatarExample = () => {
  const [avatar, setAvatar] = useState<string[]>([]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Vendor Avatar</Typography>
      
      <ImageSelector
        maxImages={1}
        folder="avatars"
        tags={['avatar', 'vendor']}
        label="Profile Picture"
        size="small"
        variant="compact"
        autoUpload={true}
        value={avatar}
        onChange={setAvatar}
      />
    </Box>
  );
};

// Example 4: Integration with existing form state
export const ExistingFormIntegration = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[]
  });

  const updateImages = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Existing Form Integration</Typography>
      
      <TextField
        fullWidth
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        sx={{ mb: 3 }}
      />
      
      <ImageSelector
        maxImages={4}
        folder="content"
        label="Content Images"
        autoUpload={true}
        value={formData.images}
        onChange={updateImages}
      />
      
      <Typography variant="body2" sx={{ mt: 2 }}>
        Form Data: {JSON.stringify(formData, null, 2)}
      </Typography>
    </Box>
  );
};

// Usage patterns for different scenarios:
/*

1. MANUAL UPLOAD (for existing forms):
   - Use ref to call uploadToImageKit() when form submits
   - Good for forms that need validation before upload

2. AUTO UPLOAD (for real-time updates):
   - Set autoUpload={true}
   - Use value/onChange for controlled component
   - Images upload immediately when selected

3. FORM INTEGRATION:
   - Use name prop for form field identification
   - Use onChange to update parent state
   - Use error prop to show validation errors

4. DIFFERENT SIZES:
   - size="small" for compact spaces
   - size="medium" (default) for normal forms
   - size="large" for prominent image selection

5. VARIANTS:
   - variant="full" (default) shows tabs and full UI
   - variant="compact" shows minimal UI

*/
