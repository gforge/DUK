import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CssBaseline,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RoleProvider, useRole } from './store/roleContext'
import { SnackProvider } from './store/snackContext'
import AppRouter from './router'
import MigrationErrorOverlay from './components/common/MigrationErrorOverlay'
import LanguageSwitcher from './components/common/LanguageSwitcher'
import type { MigrationResultErr } from './api/migrations'

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

function LoginScreen({ onLogin }: { onLogin: (path: string) => void }) {
  const { t } = useTranslation()
  const { availableUsers, setCurrentUser } = useRole()

  const loginAs = (user: (typeof availableUsers)[number]) => {
    onLogin(user.role === 'PATIENT' ? '/patient' : '/dashboard')
    setCurrentUser(user)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: 3 }}>
        <Stack
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          direction="row"
        >
          <Stack sx={{ alignItems: 'center', gap: 1 }} direction="row">
            <Typography sx={{ fontWeight: 700 }} variant="h5">
              DUK
            </Typography>
            <Chip label="DEMO" color="warning" size="small" variant="outlined" />
          </Stack>
          <LanguageSwitcher />
        </Stack>

        <Typography sx={{ fontWeight: 600 }} variant="subtitle1">
          {t('role.loginTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {t('role.loginHint')}
        </Typography>

        <Stack sx={{ gap: 1 }}>
          {availableUsers.map((user) => (
            <Button
              key={user.id}
              variant="outlined"
              color="inherit"
              onClick={() => loginAs(user)}
              sx={{ justifyContent: 'space-between', textAlign: 'left', py: 1 }}
            >
              <span>{user.name}</span>
              <Typography component="span" variant="caption" color="text.secondary">
                {t(`role.${user.role}`)}
              </Typography>
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}

function AuthenticatedApp() {
  const { isLoggedIn } = useRole()
  const [loginRedirectPath, setLoginRedirectPath] = useState<string>()

  return isLoggedIn ? (
    <AppRouter loginRedirectPath={loginRedirectPath} />
  ) : (
    <LoginScreen onLogin={setLoginRedirectPath} />
  )
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
            <AuthenticatedApp />
          </SnackProvider>
        </RoleProvider>
      )}
    </ThemeProvider>
  )
}
