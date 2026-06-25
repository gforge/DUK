import MenuIcon from '@mui/icons-material/Menu'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { AppBar, Box, Chip, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher, RoleSwitcher } from '@/components/common'
import GlobalSearch from '@/components/layout/GlobalSearch'
import { useRole } from '@/store/roleContext'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation()
  const { currentUser } = useRole()

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%', displayPrint: 'none' }}
      elevation={1}
    >
      <Toolbar sx={{ gap: 1, minHeight: 56 }}>
        <IconButton
          color="inherit"
          aria-label={t('common.openNavigationMenu')}
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: 700, letterSpacing: 0.5, mr: 2, display: { xs: 'none', sm: 'block' } }}
        >
          DUK
        </Typography>

        {/* Disclaimer chip */}
        <Tooltip title={t('app.disclaimer')}>
          <Chip
            icon={<WarningAmberIcon fontSize="small" />}
            label="DEMO"
            color="warning"
            size="small"
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              cursor: 'default',
              padding: '0 6px',
            }}
          />
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {/* Global patient search (clinicians only) */}
        <GlobalSearch />

        {/* Current user badge */}
        <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: 'none', sm: 'block' } }}>
          {currentUser.name}
        </Typography>

        <RoleSwitcher />
        <LanguageSwitcher />
      </Toolbar>
    </AppBar>
  )
}
