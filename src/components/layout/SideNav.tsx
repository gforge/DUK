import AssignmentIcon from '@mui/icons-material/Assignment'
import BuildIcon from '@mui/icons-material/Build'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PolicyIcon from '@mui/icons-material/GppMaybe'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation,useNavigate } from 'react-router-dom'

import { useNavItems } from '@/hooks/useNavItems'
import { useRole } from '@/store/roleContext'

import { version } from '../../../package.json'

interface SideNavProps {
  drawerWidth: number
  mobileOpen: boolean
  onClose: () => void
  isMobile: boolean
}

export default function SideNav({
  drawerWidth,
  mobileOpen,
  onClose,
  isMobile,
}: Readonly<SideNavProps>) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isRole } = useRole()
  const { navItems } = useNavItems()

  const pathIcons: Record<string, React.ReactNode> = {
    '/dashboard': <DashboardIcon />,
    '/patient': <PersonIcon />,
    '/worklist': <AssignmentIcon />,
    '/policy': <PolicyIcon />,
    '/patients': <PeopleIcon />,
    '/journeys': <RouteIcon />,
    '/demo-tools': <BuildIcon />,
  }

  const handleNav = (path: string) => {
    navigate(path)
    if (isMobile) onClose()
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ minHeight: 56 }} />
      <Divider />
      <List component="nav" aria-label={t('common.mainNavigation')}>
        {navItems.map((item) => {
          const visible = item.roles.some((r) => isRole(r))
          if (!visible) return null
          const active = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => handleNav(item.path)}
                aria-current={active ? 'page' : undefined}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'inherit' }}>
                  {pathIcons[item.path]}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ mt: 'auto', px: 2, py: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          v{version}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ displayPrint: 'none' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
