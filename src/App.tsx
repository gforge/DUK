import React from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { RoleProvider } from './store/roleContext'
import { SnackProvider } from './store/snackContext'
import AppRouter from './router'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#6a1b9a',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
    },
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RoleProvider>
        <SnackProvider>
          <AppRouter />
        </SnackProvider>
      </RoleProvider>
    </ThemeProvider>
  )
}
