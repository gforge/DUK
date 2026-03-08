import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
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
import ReactMarkdown from 'react-markdown'

import type { ResolvedInstruction } from '@/api/service'

interface Props {
  instructions: ResolvedInstruction[]
}

export function InstructionTimeline({ instructions }: Readonly<Props>) {
  const { t } = useTranslation()
  const getStatusLabel = (status: ResolvedInstruction['status']): string => {
    switch (status) {
      case 'ACTIVE':
        return t('journey.journeyStatus.ACTIVE')
      case 'ACKNOWLEDGED':
        return t('review.completed')
      case 'COMPLETED':
        return t('journey.journeyStatus.COMPLETED')
      case 'CANCELLED':
        return t('journey.modType.CANCEL')
      default:
        return status
    }
  }

  if (instructions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('journey.noInstructions')}
      </Typography>
    )
  }

  return (
    <Stack gap={1}>
      {instructions.map((instruction) => {
        const statusColor =
          instruction.status === 'COMPLETED'
            ? 'success'
            : instruction.status === 'CANCELLED'
              ? 'default'
              : instruction.status === 'ACKNOWLEDGED'
                ? 'info'
                : 'primary'

        return (
          <Accordion key={instruction.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" width="100%">
                <InfoOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={600}>
                  {instruction.label ||
                    instruction.templateName ||
                    t('journey.instructionFallback')}
                </Typography>
                <Chip
                  size="small"
                  color={statusColor as 'success' | 'default' | 'info' | 'primary'}
                  label={getStatusLabel(instruction.status)}
                />
                {instruction.isActiveNow && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={t('journey.activeNow')}
                  />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', pr: 1 }}>
                  {t('journey.instructionRange', {
                    start: instruction.startAt.slice(0, 10),
                    end: instruction.endAt ? instruction.endAt.slice(0, 10) : t('journey.ongoing'),
                  })}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  '& p': { my: 0.5, typography: 'body2' },
                  '& ul, & ol': { my: 0.5, pl: 2.5 },
                  '& li': { my: 0.25 },
                }}
              >
                <ReactMarkdown>{instruction.content}</ReactMarkdown>
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Stack>
  )
}
