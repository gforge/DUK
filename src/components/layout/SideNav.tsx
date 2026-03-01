import React, { useEffect, useMemo } from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PolicyIcon from '@mui/icons-material/GppMaybe'
import BuildIcon from '@mui/icons-material/Build'
import PersonIcon from '@mui/icons-material/Person'
import PeopleIcon from '@mui/icons-material/People'
import RouteIcon from '@mui/icons-material/Route'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRole } from '../../store/roleContext'

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
  const navItems = useMemo(
    () => [
      {
        label: t('nav.dashboard'),
        icon: <DashboardIcon />,
        path: '/dashboard',
        roles: ['NURSE', 'DOCTOR', 'PAL'] as const,
      },
      {
        label: t('patient.title'),
        icon: <PersonIcon />,
        path: '/patient',
        roles: ['PATIENT'] as const,
      },
      {
        label: t('nav.worklist'),
        icon: <AssignmentIcon />,
        path: '/worklist',
        roles: ['NURSE', 'DOCTOR', 'PAL'] as const,
      },
      {
        label: t('nav.policy'),
        icon: <PolicyIcon />,
        path: '/policy',
        roles: ['NURSE', 'DOCTOR', 'PAL'] as const,
      },
      {
        label: t('nav.patients'),
        icon: <PeopleIcon />,
        path: '/patients',
        roles: ['NURSE', 'DOCTOR', 'PAL'] as const,
      },
      {
        label: t('nav.journeys'),
        icon: <RouteIcon />,
        path: '/journeys',
        roles: ['NURSE', 'DOCTOR', 'PAL'] as const,
      },
      {
        label: t('nav.demoTools'),
        icon: <BuildIcon />,
        path: '/demo-tools',
        roles: ['NURSE', 'DOCTOR', 'PAL', 'PATIENT'] as const,
      },
    ],
    [t],
  )

  const accessiblePaths = useMemo(
    () =>
      navItems.filter((item) => item.roles.some((role) => isRole(role))).map((item) => item.path),
    [navItems, isRole],
  )
  const handleNav = (path: string) => {
    navigate(path)
    if (isMobile) onClose()
  }

  const drawerContent = (
    <Box>
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
                  {item.icon}
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
    </Box>
  )

  useEffect(() => {
    if (!accessiblePaths.length) return
    const allowed = accessiblePaths.includes(location.pathname)
    if (!allowed) {
      navigate(accessiblePaths[0], { replace: true })
    }
  }, [accessiblePaths, location.pathname, navigate])

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
