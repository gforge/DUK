import CheckIcon from '@mui/icons-material/Check'
import LogoutIcon from '@mui/icons-material/Logout'
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount'
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useRoleLabel } from '@/hooks/labels'
import { useRole } from '@/store/roleContext'

export default function RoleSwitcher() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getRoleLabel = useRoleLabel()
  const { currentUser, loginAs, logout, availableUsers, authProviderName, session } = useRole()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    await logout()
    setAnchorEl(null)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Tooltip title={t('role.accountMenu', { defaultValue: 'Account' })}>
        <IconButton
          color="inherit"
          aria-label={t('role.accountMenu', { defaultValue: 'Account' })}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <SwitchAccountIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
          {currentUser.name}
        </Typography>
        <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block', opacity: 0.65 }}>
          {getRoleLabel(currentUser.role)} · {authProviderName}
        </Typography>
        <Divider />
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', opacity: 0.65 }}>
          Session expires {new Date(session.expiresAt).toLocaleTimeString()}
        </Typography>
        <Divider />
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', opacity: 0.65 }}>
          {t('role.fakeSwitch', { defaultValue: 'Fake login personas' })}
        </Typography>
        {availableUsers.map((user) => (
          <MenuItem
            key={user.id}
            selected={user.id === currentUser.id}
            onClick={() => {
              void loginAs(user.id)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon>
              {user.id === currentUser.id ? <CheckIcon fontSize="small" /> : null}
            </ListItemIcon>
            <ListItemText
              primary={user.name}
              secondary={getRoleLabel(user.role)}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => void handleLogout()}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('role.logout', { defaultValue: 'Log out' })} />
        </MenuItem>
      </Menu>
    </>
  )
}
