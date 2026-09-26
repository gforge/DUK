import AssignmentIcon from '@mui/icons-material/Assignment'
import BuildIcon from '@mui/icons-material/Build'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PolicyIcon from '@mui/icons-material/GppMaybe'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import {
  Box,
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
import { useLocation, useNavigate } from 'react-router-dom'

import { useNavItems } from '@/hooks/useNavItems'
import { useRole } from '@/store/roleContext'
import { tokens } from '@/theme'

import { version } from '../../../package.json'
import { TOPBAR_HEIGHT } from './layoutConstants'

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
      <Toolbar sx={{ minHeight: `${TOPBAR_HEIGHT}px !important` }} />
      <List
        component="nav"
        aria-label={t('common.mainNavigation')}
        sx={{ px: 1, py: 1.5, display: 'flex', flexDirection: 'column', gap: '2px' }}
      >
        {navItems.map((item) => {
          const visible = item.roles.some((r) => isRole(r))
          if (!visible) return null
          const active =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`)) ||
            (item.path === '/dashboard' && location.pathname.startsWith('/cases/'))
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                aria-current={active ? 'page' : undefined}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 1.125,
                  gap: 1.5,
                  color: active ? tokens.primaryDark : tokens.text2,
                  bgcolor: active ? tokens.selectedBg : 'transparent',
                  '&:hover': { bgcolor: active ? tokens.selectedBg : tokens.greyFill },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: 'inherit', '& svg': { fontSize: 20 } }}>
                  {pathIcons[item.path]}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{ my: 0 }}
                  slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 400 } } }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ mt: 'auto', p: 1.5, px: 2.5 }}>
        <Typography variant="caption" sx={{ color: tokens.textMuted }}>
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
            borderRight: `1px solid ${tokens.border}`,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
