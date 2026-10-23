import { Box, Stack, Typography } from '@mui/material'
import React from 'react'

interface PageHeaderProps {
  readonly title: React.ReactNode
  readonly subtitle?: React.ReactNode
  /** Rendered right-aligned next to the title block (e.g. a primary action button). */
  readonly actions?: React.ReactNode
}

/** Page title block used at the top of every clinician screen. */
export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 240, flex: 1 }}>
        <Typography
          component="h1"
          sx={{ m: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {title}
        </Typography>
        {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
      </Box>
      {actions}
    </Stack>
  )
}
