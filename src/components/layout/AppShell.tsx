import { Box, useMediaQuery, useTheme } from '@mui/material'
import React, { useState } from 'react'

import { TOPBAR_HEIGHT } from './layoutConstants'
import SideNav from './SideNav'
import TopBar from './TopBar'

const DRAWER_WIDTH = 212

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
          minWidth: 0,
          pt: { xs: `${TOPBAR_HEIGHT + 16}px`, md: `${TOPBAR_HEIGHT + 24}px` },
          px: { xs: 2, md: 3.5 },
          pb: 6,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          '@media print': { ml: 0, width: '100%', p: 2 },
        }}
      >
        <Box sx={{ maxWidth: 1320, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  )
}
