import { CssBaseline, ThemeProvider } from '@mui/material'
import React from 'react'

import type { MigrationResultErr } from './api/migrations'
import MigrationErrorOverlay from './components/common/MigrationErrorOverlay'
import { AppRouter } from './router'
import { RoleProvider } from './store/roleContext'
import { SnackProvider } from './store/snackContext'
import { theme } from './theme'

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
