import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import React, { useState } from 'react'

import SideNav from './SideNav'
import TopBar from './TopBar'

const DRAWER_WIDTH = 220

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar onMenuClick={() => setMobileOpen((o) => !o)} />
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
          '@media print': { ml: 0, width: '100%', p: 2 },
        }}
      >
        <Toolbar sx={{ displayPrint: 'none' }} />
        {children}
      </Box>
    </Box>
  )
}
