import MenuIcon from '@mui/icons-material/Menu'
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { RoleSwitcher } from '@/components/common'
import GlobalSearch from '@/components/layout/GlobalSearch'
import { tokens } from '@/theme'

import { TOPBAR_HEIGHT } from './layoutConstants'
interface TopBarProps {
  onMenuClick: () => void
}
export default function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation()
  return (
    <AppBar
      elevation={0}
      color="inherit"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: '100%',
        displayPrint: 'none',
        position: 'fixed',
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <Toolbar
        sx={{ gap: 2, minHeight: `${TOPBAR_HEIGHT}px !important`, px: { xs: 1.5, sm: 2.5 } }}
      >
        <IconButton
          aria-label={t('common.openNavigationMenu')}
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          noWrap
          component="div"
          sx={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.5, color: 'primary.main' }}
        >
          DUK
        </Typography>

        <Tooltip title={t('app.disclaimer')}>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: tokens.clinicalFg,
              bgcolor: tokens.clinicalBg,
              px: 1,
              py: '3px',
              borderRadius: 1,
              cursor: 'default',
            }}
          >
            DEMO
          </Box>
        </Tooltip>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <GlobalSearch />
        </Box>

        <RoleSwitcher />
      </Toolbar>
    </AppBar>
  )
}
