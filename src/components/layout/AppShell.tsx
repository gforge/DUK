import React, { useState } from 'react'
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import TopBar from './TopBar'
import SideNav from './SideNav'

const DRAWER_WIDTH = 220

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar drawerWidth={DRAWER_WIDTH} onMenuClick={() => setMobileOpen((o) => !o)} />
      <SideNav
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
