import React, { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Divider,
  Typography,
} from '@mui/material'
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount'
import CheckIcon from '@mui/icons-material/Check'
import { useTranslation } from 'react-i18next'
import { useRole } from '@/store/roleContext'
import type { User } from '@/api/schemas'

export default function RoleSwitcher() {
  const { t } = useTranslation()
  const { currentUser, setCurrentUser, availableUsers } = useRole()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <>
      <Tooltip title={t('role.switchRole')}>
        <IconButton
          color="inherit"
          aria-label={t('role.switchRole')}
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
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', opacity: 0.6 }}>
          {t('role.switchRole')}
        </Typography>
        <Divider />
        {availableUsers.map((user: User) => (
          <MenuItem
            key={user.id}
            selected={user.id === currentUser.id}
            onClick={() => {
              setCurrentUser(user)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon>
              {user.id === currentUser.id ? <CheckIcon fontSize="small" /> : null}
            </ListItemIcon>
            <ListItemText
              primary={user.name}
              secondary={t(`role.${user.role}`)}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
