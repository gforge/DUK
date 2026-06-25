import React, { useState } from 'react'
import { Divider, IconButton, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../store/roleContext'

export default function AccountMenu() {
  const { t } = useTranslation()
  const { currentUser, logout } = useRole()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = () => {
    logout()
    setAnchorEl(null)
    navigate('/dashboard', { replace: true })
  }

  return (
    <>
      <Tooltip title={t('role.accountMenu')}>
        <IconButton
          color="inherit"
          aria-label={t('role.accountMenu')}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <AccountCircleIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', opacity: 0.6 }}>
          {t('role.signedInAs')}
        </Typography>
        <MenuItem disabled>
          <ListItemText
            primary={currentUser.name}
            secondary={t(`role.${currentUser.role}`)}
            slotProps={{ secondary: { sx: { fontSize: 11 } } }}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
          <ListItemText primary={t('role.logout')} />
        </MenuItem>
      </Menu>
    </>
  )
}
