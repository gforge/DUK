import LoginIcon from '@mui/icons-material/Login'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAuthProvider } from '@/auth'
import { useRoleLabel } from '@/hooks/labels'
import { useOptionalRole } from '@/store/roleContext'
const authProvider = getAuthProvider()
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const roleCtx = useOptionalRole()
  const getRoleLabel = useRoleLabel()
  const from =
    (
      location.state as {
        from?: string
      } | null
    )?.from ?? '/dashboard'
  const handleLogin = async (userId: string) => {
    if (roleCtx) {
      await roleCtx.loginAs(userId)
    } else {
      await authProvider.loginAs(userId)
    }
    navigate(from, { replace: true })
  }
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: { xs: 3, md: 8 } }}>
      <Container sx={{ maxWidth: 'md' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              DUK
            </Typography>
            <Typography color="text.secondary">
              Fake login for production-style authentication flow.
            </Typography>
          </Box>

          <Alert severity="info">
            This local provider is intentionally replaceable. A production deployment should plug in
            GrandID, SITHS, OIDC or SAML behind the same session contract.
          </Alert>

          <Stack spacing={2}>
            {authProvider.getLoginOptions().map(({ user, description }) => (
              <Card key={user.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: 'stretch', sm: 'center' },
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <Typography variant="h6">{user.name}</Typography>
                        <Chip size="small" label={getRoleLabel(user.role)} />
                        <Chip
                          size="small"
                          label={user.authMethod.toUpperCase()}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {description}
                      </Typography>
                      {user.careUnitName ? (
                        <Typography variant="caption" color="text.secondary">
                          {user.careUnitName}
                        </Typography>
                      ) : null}
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<LoginIcon />}
                      onClick={() => void handleLogin(user.id)}
                    >
                      Log in
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
