import React from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import HomeIcon from '@mui/icons-material/Home'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
    >
      <Stack sx={{ alignItems: 'center' }} spacing={2}>
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography sx={{ fontWeight: 700 }} variant="h5">
          {t('notFound.title')}
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          {t('notFound.message')}
        </Alert>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          disableElevation
          onClick={() => navigate('/dashboard', { replace: true })}
        >
          {t('notFound.goHome')}
        </Button>
      </Stack>
    </Box>
  )
}
