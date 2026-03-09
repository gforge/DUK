import CallIcon from '@mui/icons-material/Call'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import React from 'react'

import type { ContactMode } from '@/api/schemas'

const CONTACT_MODES: ContactMode[] = ['DIGITAL', 'PHONE', 'VISIT', 'CLOSE']

const CONTACT_MODE_ICONS: Record<ContactMode, React.ReactNode> = {
  DIGITAL: <MonitorHeartIcon fontSize="small" color="action" />,
  PHONE: <CallIcon fontSize="small" color="action" />,
  VISIT: <EventIcon fontSize="small" color="action" />,
  CLOSE: <CheckCircleIcon fontSize="small" color="action" />,
}

interface Props {
  contactMode: ContactMode | null
  tr: (key: string) => string
  onSelect: (mode: ContactMode) => void
}

export default function TriageContactModeStep({ contactMode, tr, onSelect }: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {tr('triage.step1Title')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25} flexWrap="wrap">
        {CONTACT_MODES.map((mode) => (
          <Card
            key={mode}
            variant="outlined"
            sx={{
              minWidth: 180,
              flex: 1,
              borderColor: contactMode === mode ? 'primary.main' : undefined,
              backgroundColor: contactMode === mode ? 'action.selected' : undefined,
            }}
          >
            <CardActionArea onClick={() => onSelect(mode)}>
              <CardContent>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.25 }}>
                  {CONTACT_MODE_ICONS[mode]}
                  <Typography variant="body1" fontWeight={700}>
                    {tr(`triage.contactMode.${mode}`)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {tr(`triage.contactModeHelp.${mode}`)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
