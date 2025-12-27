'use client'

import React from 'react'
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Divider
} from '@mui/material'
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  BookOnline as BookingIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Logout as LogoutIcon,
  Campaign as CampaignIcon,
  LocalOffer as CouponIcon,
  Label as TagIcon,
  Notifications as NotificationsIcon,
  DeliveryDining as DeliveryIcon,
  CalendarToday as TodayIcon,
  History as HistoryIcon
} from '@mui/icons-material'
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

interface SidebarProps {
  userRole: 'admin' | 'vendor' | 'delivery_partner'
  activeItem?: string
  onItemClick?: (item: string) => void
  onLogout?: () => void
}

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'vendors', label: 'Vendors', icon: StoreIcon },
  { id: 'delivery-partners', label: 'Delivery Partners', icon: DeliveryIcon },
  { id: 'products', label: 'Products', icon: InventoryIcon },
  { id: 'categories', label: 'Categories', icon: CategoryIcon },
  { id: 'tags', label: 'Tags', icon: TagIcon },
  { id: 'coupons', label: 'Coupons', icon: CouponIcon },
  { id: 'orders', label: 'Orders', icon: BookingIcon },
  { id: 'advertisements', label: 'Advertisements', icon: CampaignIcon },
  { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
  { id: 'users', label: 'Users', icon: PeopleIcon },
  { id: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const vendorMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'my-products', label: 'My Products', icon: InventoryIcon },
  { id: 'add-product', label: 'Add Product', icon: AddIcon },
  { id: 'orders', label: 'Orders', icon: BookingIcon },
  { id: 'analytics', label: 'Analytics', icon: ViewIcon },
  { id: 'profile', label: 'Profile', icon: SettingsIcon },
]

const deliveryPartnerMenuItems = [
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'all-deliveries', label: 'All Deliveries', icon: HistoryIcon },
  { id: 'profile', label: 'Profile', icon: SettingsIcon },
]

export const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, 
  activeItem = 'dashboard', 
  onItemClick,
  onLogout
}) => {
  const menuItems = 
    userRole === 'admin' ? adminMenuItems : 
    userRole === 'vendor' ? vendorMenuItems : 
    deliveryPartnerMenuItems

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId)
    }
    
    // Handle navigation for admin routes
    if (userRole === 'admin') {
      switch (itemId) {
        case 'dashboard':
          window.location.href = '/admin/dashboard'
          break
        case 'vendors':
          window.location.href = '/admin/vendors'
          break
        case 'delivery-partners':
          window.location.href = '/admin/delivery-partners'
          break
        case 'products':
          window.location.href = '/admin/products'
          break
        case 'categories':
          window.location.href = '/admin/categories'
          break
        case 'advertisements':
          window.location.href = '/admin/advertisements'
          break
        case 'coupons':
          window.location.href = '/admin/coupons'
          break
        case 'tags':
          window.location.href = '/admin/tags'
          break
        case 'notifications':
          window.location.href = '/admin/notifications'
          break
        case 'orders':
          window.location.href = '/admin/orders'
          break
        // Add more routes as needed
        default:
          break
      }
    }
    
    // Handle navigation for vendor routes
    if (userRole === 'vendor') {
      switch (itemId) {
        case 'dashboard':
          window.location.href = '/vendor/dashboard'
          break
        case 'my-products':
          window.location.href = '/vendor/products'
          break
        case 'add-product':
          window.location.href = '/vendor/add-product'
          break
        case 'orders':
          window.location.href = '/vendor/orders'
          break
        // Add more routes as needed
        default:
          break
      }
    }
    
    // Handle navigation for delivery partner routes
    if (userRole === 'delivery_partner') {
      switch (itemId) {
        case 'today':
        case 'all-deliveries':
          // These are handled within the dashboard page
          if (onItemClick) {
            onItemClick(itemId)
          }
          break
        case 'profile':
          window.location.href = '/delivery/profile'
          break
        default:
          if (onItemClick) {
            onItemClick(itemId)
          }
          break
      }
    }
  }

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
        }}
      >
        <Image
          src="/logo-transparent-white.png"
          alt="RentOK Logo"
          width={40}
          height={40}
          style={{ marginRight: '12px' }}
        />
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'white',
              lineHeight: 1.2
            }}
          >
            RentOK
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            {userRole} Panel
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => handleItemClick(item.id)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    backgroundColor: isActive ? THEME_COLORS.tint : 'transparent',
                    borderRight: isActive ? `3px solid ${THEME_COLORS.rentPrimary}` : 'none',
                    '&:hover': {
                      backgroundColor: isActive ? THEME_COLORS.tint : '#f5f5f5',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon 
                      sx={{ 
                        color: isActive ? THEME_COLORS.rentPrimary : '#666',
                        fontSize: 22
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? THEME_COLORS.rentPrimary : '#333'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Logout Button */}
      {onLogout && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <ListItemButton
            onClick={onLogout}
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: '#ffebee',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon sx={{ color: '#d32f2f', fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout"
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#d32f2f'
              }}
            />
          </ListItemButton>
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: onLogout ? 'none' : '1px solid #e0e0e0',
          backgroundColor: '#f9f9f9'
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#666',
            display: 'block',
            textAlign: 'center'
          }}
        >
          © 2024 RentOK
        </Typography>
      </Box>
    </Box>
  )
}
