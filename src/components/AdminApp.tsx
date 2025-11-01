'use client'

import React from 'react'
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { authProvider } from '../lib/authProvider'
import { dataProvider } from '../lib/dataProvider'
import { LoginPage } from './LoginPage'

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

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: THEME_COLORS.primary,
      dark: '#e6970a',
      light: '#fdb933',
    },
    secondary: {
      main: THEME_COLORS.secondary,
      dark: THEME_COLORS.rentPrimaryDark,
      light: '#b8456b',
    },
    background: THEME_COLORS.background,
    info: {
      main: THEME_COLORS.rentPrimary,
    },
  },
  typography: {
    fontFamily: '"Geist", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.rentPrimary,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #e6970a 0%, ${THEME_COLORS.rentPrimaryDark} 100%)`,
          },
        },
      },
    },
  },
})

export const AdminApp = () => {
  return (
    <ThemeProvider theme={theme}>
      <Admin
        authProvider={authProvider}
        dataProvider={dataProvider}
        loginPage={LoginPage}
        title="RentOK Admin Panel"
        theme={theme}
      >
        {/* Sample resources - you can replace these with your actual resources */}
        <Resource 
          name="users" 
          list={ListGuesser} 
          edit={EditGuesser} 
          show={ShowGuesser} 
        />
        <Resource 
          name="properties" 
          list={ListGuesser} 
          edit={EditGuesser} 
          show={ShowGuesser} 
        />
        <Resource 
          name="bookings" 
          list={ListGuesser} 
          edit={EditGuesser} 
          show={ShowGuesser} 
        />
      </Admin>
    </ThemeProvider>
  )
}
