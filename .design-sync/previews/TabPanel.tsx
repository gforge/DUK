import { Box, Tab, TabPanel, Tabs, Typography } from 'duk-clinical-triage-demo'
import React, { useState } from 'react'

function CaseTabs({ initial }: { initial: number }) {
  const [tab, setTab] = useState(initial)
  return (
    <Box sx={{ width: 480 }}>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Triage" />
        <Tab label="Formulärsvar" />
        <Tab label="Journal" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        <Typography variant="body2">
          Smärta NRS 8 dag 5 efter knäprotes. Förslag: telefonkontakt med sjuksköterska inom 24 h.
        </Typography>
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <Typography variant="body2">OKS 18/48 · EQ-5D 0,54 · Besvarad 24 sep 2026</Typography>
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <Typography variant="body2">Inga journalanteckningar ännu.</Typography>
      </TabPanel>
    </Box>
  )
}

export const FirstTab = () => <CaseTabs initial={0} />
export const SecondTab = () => <CaseTabs initial={1} />
