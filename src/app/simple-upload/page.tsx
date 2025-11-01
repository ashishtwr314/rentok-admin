"use client"
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Card,
  CardContent
} from '@mui/material'
import { 
  Add as AddIcon,
  Category as CategoryIcon,
  ShoppingBag as ProductIcon
} from '@mui/icons-material'
import ImageSelector, { ImageSelectorRef } from '@/components/ImageSelector'

interface CreatedItem {
  id: string
  name: string
  description: string
  images: string[]
  type: 'category' | 'product'
  createdAt: Date
}

function App() {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdItems, setCreatedItems] = useState<CreatedItem[]>([])
  
  const categoryImageRef = useRef<ImageSelectorRef>(null)
  const productImageRef = useRef<ImageSelectorRef>(null)

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images to ImageKit
      const imageUrls = await categoryImageRef.current?.uploadToImageKit() || [];
      
      // Simulate creating category (replace with actual API call)
      const newCategory: CreatedItem = {
        id: Date.now().toString(),
        name: categoryName,
        description: categoryDescription,
        images: imageUrls,
        type: 'category',
        createdAt: new Date()
      };

      setCreatedItems(prev => [newCategory, ...prev]);
      
      // Clear form
      setCategoryName('');
      setCategoryDescription('');
      categoryImageRef.current?.clearImages();
      
      setSuccess(`Category "${categoryName}" created successfully with ${imageUrls.length} images!`);
      
    } catch (err: any) {
      setError(`Failed to create category: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images to ImageKit
      const imageUrls = await productImageRef.current?.uploadToImageKit() || [];
      
      // Simulate creating product (replace with actual API call)
      const newProduct: CreatedItem = {
        id: Date.now().toString(),
        name: productName,
        description: productDescription,
        images: imageUrls,
        type: 'product',
        createdAt: new Date()
      };

      setCreatedItems(prev => [newProduct, ...prev]);
      
      // Clear form
      setProductName('');
      setProductDescription('');
      productImageRef.current?.clearImages();
      
      setSuccess(`Product "${productName}" created successfully with ${imageUrls.length} images!`);
      
    } catch (err: any) {
      setError(`Failed to create product: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        ImageSelector Component Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Reusable component for selecting images that uploads when form is submitted
      </Typography>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {/* Create Category Form */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CategoryIcon sx={{ mr: 2, color: '#9A2143' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Create Category
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              sx={{ mb: 2 }}
              disabled={uploading}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              sx={{ mb: 3 }}
              disabled={uploading}
            />

            <ImageSelector
              ref={categoryImageRef}
              maxImages={3}
              folder="categories"
              tags={['category']}
              label="Category Images"
              helperText="Select up to 3 images for this category"
              disabled={uploading}
            />

            <Button
              fullWidth
              variant="contained"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              onClick={handleCreateCategory}
              disabled={uploading || !categoryName.trim()}
              sx={{
                mt: 3,
                backgroundColor: '#9A2143',
                '&:hover': {
                  backgroundColor: '#7a1a35',
                },
                py: 1.5
              }}
            >
              {uploading ? 'Creating Category...' : 'Create Category'}
            </Button>
          </Paper>
        </Box>

        {/* Create Product Form */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <ProductIcon sx={{ mr: 2, color: '#9A2143' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Create Product
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              sx={{ mb: 2 }}
              disabled={uploading}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              sx={{ mb: 3 }}
              disabled={uploading}
            />

            <ImageSelector
              ref={productImageRef}
              maxImages={5}
              folder="products"
              tags={['product']}
              label="Product Images"
              helperText="Select up to 5 images for this product"
              disabled={uploading}
            />

            <Button
              fullWidth
              variant="contained"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              onClick={handleCreateProduct}
              disabled={uploading || !productName.trim()}
              sx={{
                mt: 3,
                backgroundColor: '#9A2143',
                '&:hover': {
                  backgroundColor: '#7a1a35',
                },
                py: 1.5
              }}
            >
              {uploading ? 'Creating Product...' : 'Create Product'}
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Created Items */}
      {createdItems.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Created Items ({createdItems.length})
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {createdItems.map((item) => (
              <Box key={item.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {item.type === 'category' ? (
                        <CategoryIcon sx={{ mr: 1, color: '#9A2143' }} />
                      ) : (
                        <ProductIcon sx={{ mr: 1, color: '#9A2143' }} />
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {item.type}
                      </Typography>
                    </Box>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {item.name}
                    </Typography>
                    
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      {item.images.length} images • {item.createdAt.toLocaleString()}
                    </Typography>
                    
                    {/* Image previews */}
                    {item.images.length > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mt: 2, 
                        flexWrap: 'wrap' 
                      }}>
                        {item.images.slice(0, 3).map((url, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid #ddd'
                            }}
                          >
                            <img
                              src={url}
                              alt={`${item.name} ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </Box>
                        ))}
                        {item.images.length > 3 && (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              border: '1px solid #ddd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5'
                            }}
                          >
                            <Typography variant="caption">
                              +{item.images.length - 3}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default App;
