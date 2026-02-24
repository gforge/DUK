import React from 'react'
import { AppBar, Toolbar, Typography, IconButton, Box, Chip, Tooltip } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import RoleSwitcher from '../common/RoleSwitcher'
import LanguageSwitcher from '../common/LanguageSwitcher'
import { useRole } from '../../store/roleContext'

interface TopBarProps {
  drawerWidth: number
  onMenuClick: () => void
}

export default function TopBar({ drawerWidth, onMenuClick }: TopBarProps) {
  const { t } = useTranslation()
  const { currentUser } = useRole()

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%' }}
      elevation={1}
    >
      <Toolbar sx={{ gap: 1, minHeight: 56 }}>
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
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
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', cursor: 'default' }}
          />
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

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
