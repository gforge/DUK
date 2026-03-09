import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Paper,
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

  if (!expanded) {
    return (
      <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2, p: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              {t('worklist.completedSectionTitle')}
            </Typography>
            <Chip label={count} size="small" />
          </Stack>
          <Button size="small" onClick={() => onToggle(true)}>
            {t('worklist.showCompleted')}
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Accordion
      expanded
      onChange={() => onToggle(false)}
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
          <Button size="small" onClick={() => onToggle(false)}>
            {t('worklist.hideCompleted')}
          </Button>
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
