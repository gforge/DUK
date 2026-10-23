import { Box, TopBar } from 'duk-clinical-triage-demo'

// TopBar is position: fixed; the transformed box contains it inside the card.
export const Default = () => (
  <Box sx={{ position: 'relative', height: 64, transform: 'translateZ(0)' }}>
    <TopBar onMenuClick={() => {}} />
  </Box>
)
