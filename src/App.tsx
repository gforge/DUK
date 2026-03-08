import { createTheme, CssBaseline,ThemeProvider } from '@mui/material'
import React from 'react'

import type { MigrationResultErr } from './api/migrations'
import MigrationErrorOverlay from './components/common/MigrationErrorOverlay'
import { AppRouter } from './router'
import { RoleProvider } from './store/roleContext'
import { SnackProvider } from './store/snackContext'

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

interface AppProps {
  migrationError?: MigrationResultErr
}

export default function App({ migrationError }: AppProps = {}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {migrationError ? (
        <MigrationErrorOverlay error={migrationError} />
      ) : (
        <RoleProvider>
          <SnackProvider>
            <AppRouter />
          </SnackProvider>
        </RoleProvider>
      )}
    </ThemeProvider>
  )
}
