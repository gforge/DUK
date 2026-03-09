import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  expanded: boolean
  count: number
  onToggle: (expanded: boolean) => void
  children: React.ReactNode
}

export default function CompletedSection({ expanded, count, onToggle, children }: Props) {
  const { t } = useTranslation()

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onToggle(isExpanded)}
      disableGutters
      variant="outlined"
      sx={{
        mt: 2,
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="subtitle2" fontWeight={700}>
            {t('worklist.completedSectionTitle')}
          </Typography>
          <Chip label={count} size="small" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('worklist.completedSectionHint')}
          </Typography>
        </Box>
        {children}
      </AccordionDetails>
    </Accordion>
  )
}
