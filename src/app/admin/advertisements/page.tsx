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
  Switch,
  FormControlLabel,
  Badge,
  Tabs,
  Tab,
  Box as MuiBox,
  Divider,
  CircularProgress
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material'
import { Sidebar } from '../../../components/Sidebar'
import { supabase } from '../../../lib/supabase'
import { uploadToImageKit } from '../../../lib/imagekit'
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

interface Advertisement {
  ad_id: string
  title: string
  description?: string
  image_url: string
  link_url?: string
  sort_order: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const AdvertisementsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('advertisements')
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null)
  const [openAdForm, setOpenAdForm] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [filterStatus, setFilterStatus] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    start_date: '',
    end_date: '',
    is_active: true
  })
  const [imageInputMethod, setImageInputMethod] = useState<'url' | 'upload'>('url')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchAdvertisements()
  }, [])

  const fetchAdvertisements = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error

      setAdvertisements(data || [])
    } catch (error) {
      console.error('Error fetching advertisements:', error)
      setSnackbar({ open: true, message: 'Error fetching advertisements', severity: 'error' })
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
    } else if (itemId === 'products') {
      window.location.href = '/admin/products'
    } else if (itemId === 'categories') {
      window.location.href = '/admin/categories'
    }
  }

  const handleDeleteAd = async () => {
    if (!adToDelete) return

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('ad_id', adToDelete.ad_id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Advertisement deleted successfully', severity: 'success' })
      setDeleteConfirmOpen(false)
      setAdToDelete(null)
      fetchAdvertisements()
    } catch (error) {
      console.error('Error deleting advertisement:', error)
      setSnackbar({ open: true, message: 'Error deleting advertisement', severity: 'error' })
    }
  }

  const toggleAdStatus = async (ad: Advertisement) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          is_active: !ad.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('ad_id', ad.ad_id)

      if (error) throw error

      setSnackbar({ 
        open: true, 
        message: `Advertisement ${!ad.is_active ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      })
      fetchAdvertisements()
    } catch (error) {
      console.error('Error updating advertisement status:', error)
      setSnackbar({ open: true, message: 'Error updating advertisement status', severity: 'error' })
    }
  }

  const handleSaveAd = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setSnackbar({ open: true, message: 'Title is required', severity: 'error' })
        return
      }
      if (!formData.image_url.trim()) {
        setSnackbar({ open: true, message: 'Image URL is required', severity: 'error' })
        return
      }
      if (!formData.start_date) {
        setSnackbar({ open: true, message: 'Start date is required', severity: 'error' })
        return
      }
      if (!formData.end_date) {
        setSnackbar({ open: true, message: 'End date is required', severity: 'error' })
        return
      }

      if (editingAd) {
        // Update existing advertisement
        const { error } = await supabase
          .from('advertisements')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('ad_id', editingAd.ad_id)

        if (error) throw error
        setSnackbar({ open: true, message: 'Advertisement updated successfully', severity: 'success' })
      } else {
        // Create new advertisement
        const { error } = await supabase
          .from('advertisements')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        setSnackbar({ open: true, message: 'Advertisement created successfully', severity: 'success' })
      }

      setOpenAdForm(false)
      setEditingAd(null)
      resetForm()
      fetchAdvertisements()
    } catch (error) {
      console.error('Error saving advertisement:', error)
      setSnackbar({ open: true, message: 'Error saving advertisement', severity: 'error' })
    }
  }

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad)
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      sort_order: ad.sort_order,
      start_date: ad.start_date.split('T')[0], // Format for date input
      end_date: ad.end_date.split('T')[0], // Format for date input
      is_active: ad.is_active
    })
    // Set image input method based on existing image URL
    setImageInputMethod(ad.image_url ? 'url' : 'upload')
    setOpenAdForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      sort_order: 0,
      start_date: '',
      end_date: '',
      is_active: true
    })
    setImageInputMethod('url')
    setUploadingImage(false)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Please select a valid image file', severity: 'error' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' })
      return
    }

    try {
      setUploadingImage(true)
      
      // Upload to ImageKit
      const imageUrl = await uploadToImageKit(file, 'advertisements')

      setFormData({ ...formData, image_url: imageUrl })
      setSnackbar({ open: true, message: 'Image uploaded successfully to ImageKit', severity: 'success' })
    } catch (error) {
      console.error('Error uploading image:', error)
      setSnackbar({ open: true, message: 'Error uploading image. Please try again.', severity: 'error' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleOpenNewAdForm = () => {
    setEditingAd(null)
    resetForm()
    setOpenAdForm(true)
  }

  // Filter advertisements based on search and filters
  const filteredAds = advertisements.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && ad.is_active) ||
                         (filterStatus === 'inactive' && !ad.is_active) ||
                         (filterStatus === 'current' && isCurrentlyActive(ad)) ||
                         (filterStatus === 'upcoming' && isUpcoming(ad)) ||
                         (filterStatus === 'expired' && isExpired(ad))

    return matchesSearch && matchesStatus
  })

  const paginatedAds = filteredAds.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const isCurrentlyActive = (ad: Advertisement) => {
    const now = new Date()
    const startDate = new Date(ad.start_date)
    const endDate = new Date(ad.end_date)
    return ad.is_active && now >= startDate && now <= endDate
  }

  const isUpcoming = (ad: Advertisement) => {
    const now = new Date()
    const startDate = new Date(ad.start_date)
    return ad.is_active && now < startDate
  }

  const isExpired = (ad: Advertisement) => {
    const now = new Date()
    const endDate = new Date(ad.end_date)
    return now > endDate
  }

  const getAdStatusChip = (ad: Advertisement) => {
    if (!ad.is_active) {
      return <Chip label="Inactive" color="default" size="small" />
    }
    if (isCurrentlyActive(ad)) {
      return <Chip label="Live" color="success" size="small" />
    }
    if (isUpcoming(ad)) {
      return <Chip label="Upcoming" color="info" size="small" />
    }
    if (isExpired(ad)) {
      return <Chip label="Expired" color="error" size="small" />
    }
    return <Chip label="Unknown" color="default" size="small" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
            <CampaignIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Advertisements Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage promotional banners and advertisements
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNewAdForm}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Add New Advertisement
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <CampaignIcon sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                      {advertisements.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Ads
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {advertisements.filter(ad => isCurrentlyActive(ad)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live Ads
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ color: 'info.main', mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                      {advertisements.filter(ad => isUpcoming(ad)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ color: 'error.main', mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {advertisements.filter(ad => isExpired(ad)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expired
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: THEME_COLORS.rentPrimary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                Search & Filters
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  placeholder="Search advertisements by title or description..."
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
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{
                      minWidth: 160,
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
                    <MenuItem value="current">Live</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={1}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '56px',
                    backgroundColor: THEME_COLORS.tint,
                    borderRadius: 1,
                    border: `1px solid ${THEME_COLORS.primary}`,
                    px: 2
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: THEME_COLORS.rentPrimary,
                      textAlign: 'center'
                    }}
                  >
                    {filteredAds.length} items
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterStatus) && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm('')
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

          {/* Advertisements Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Advertisement</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Sort Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        Loading advertisements...
                      </TableCell>
                    </TableRow>
                  ) : paginatedAds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        No advertisements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAds.map((ad) => (
                      <TableRow key={ad.ad_id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 2, position: 'relative' }}>
                              <Image
                                src={ad.image_url}
                                alt={ad.title}
                                width={80}
                                height={60}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {ad.title}
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
                                {ad.description || 'No description'}
                              </Typography>
                              {ad.link_url && (
                                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                                  <LinkIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography 
                                    variant="caption" 
                                    color="primary"
                                    sx={{ 
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    onClick={() => window.open(ad.link_url, '_blank')}
                                  >
                                    {ad.link_url}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatDate(ad.start_date)} - {formatDate(ad.end_date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.ceil((new Date(ad.end_date).getTime() - new Date(ad.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: THEME_COLORS.rentPrimary }}>
                            {ad.sort_order}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {getAdStatusChip(ad)}
                            <Switch
                              checked={ad.is_active}
                              onChange={() => toggleAdStatus(ad)}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Image">
                              <IconButton
                                size="small"
                                onClick={() => window.open(ad.image_url, '_blank')}
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Advertisement">
                              <IconButton
                                size="small"
                                onClick={() => handleEditAd(ad)}
                                sx={{ color: THEME_COLORS.rentPrimary }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Advertisement">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setAdToDelete(ad)
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredAds.length}
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
            Are you sure you want to delete advertisement "{adToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAd}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advertisement Form Dialog */}
      <Dialog 
        open={openAdForm} 
        onClose={() => setOpenAdForm(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <CampaignIcon sx={{ mr: 2 }} />
          {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              {/* Left Column - Basic Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Advertisement Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      variant="outlined"
                      helperText="Enter a catchy title for your advertisement"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      multiline
                      rows={4}
                      variant="outlined"
                      helperText="Provide a detailed description of the advertisement"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Redirect URL (Optional)"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      variant="outlined"
                      helperText="URL to redirect when advertisement is clicked"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column - Image & Settings */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: THEME_COLORS.rentPrimary, fontWeight: 'bold' }}>
                  Image & Settings
                </Typography>
                
                {/* Image Input Method Tabs */}
                <Box sx={{ mb: 2 }}>
                  <Tabs 
                    value={imageInputMethod} 
                    onChange={(e, newValue) => setImageInputMethod(newValue)}
                    sx={{
                      '& .MuiTabs-indicator': {
                        backgroundColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <Tab 
                      label="Image URL" 
                      value="url" 
                      sx={{ 
                        '&.Mui-selected': { color: THEME_COLORS.rentPrimary } 
                      }} 
                    />
                    <Tab 
                      label="Upload Image" 
                      value="upload" 
                      sx={{ 
                        '&.Mui-selected': { color: THEME_COLORS.rentPrimary } 
                      }} 
                    />
                  </Tabs>
                </Box>

                {/* Image Input Based on Selected Method */}
                {imageInputMethod === 'url' ? (
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                    variant="outlined"
                    helperText="Enter the URL of the advertisement image"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        startIcon={uploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                        disabled={uploadingImage}
                        sx={{
                          py: 2,
                          borderColor: THEME_COLORS.rentPrimary,
                          color: THEME_COLORS.rentPrimary,
                          '&:hover': {
                            borderColor: THEME_COLORS.rentPrimaryDark,
                            backgroundColor: THEME_COLORS.tint,
                          },
                        }}
                      >
                        {uploadingImage ? 'Uploading...' : 'Choose Image File'}
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Supported formats: JPG, PNG, GIF (Max 5MB)
                    </Typography>
                  </Box>
                )}

                {/* Image Preview */}
                {formData.image_url && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Preview:
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed #e0e0e0',
                        borderRadius: 2,
                        p: 1,
                        textAlign: 'center',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <Image
                        src={formData.image_url}
                        alt="Advertisement Preview"
                        width={300}
                        height={150}
                        style={{
                          objectFit: 'cover',
                          borderRadius: '8px',
                          maxWidth: '100%',
                          height: 'auto'
                        }}
                      />
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Settings */}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sort Order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      variant="outlined"
                      helperText="Lower numbers appear first (0 = highest priority)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Active (Advertisement will be visible when active and within date range)"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Button 
            onClick={() => setOpenAdForm(false)}
            variant="outlined"
            sx={{
              color: THEME_COLORS.rentPrimary,
              borderColor: THEME_COLORS.rentPrimary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAd}
            disabled={uploadingImage}
            sx={{
              background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
              px: 4,
            }}
          >
            {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdvertisementsPage
