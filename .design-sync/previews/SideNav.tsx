import { Box, SideNav } from 'duk-clinical-triage-demo'

// The permanent drawer is position: fixed; the transformed box contains it.
export const Desktop = () => (
  <Box sx={{ position: 'relative', height: 480, width: 240, transform: 'translateZ(0)', overflow: 'hidden' }}>
    <SideNav drawerWidth={220} mobileOpen={false} onClose={() => {}} isMobile={false} />
  </Box>
)
