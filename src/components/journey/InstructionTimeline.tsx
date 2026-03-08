import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import type { ResolvedInstruction } from '@/api/service'
import { JourneyIcon } from '@/utils/journeyIcons'

interface Props {
  instructions: ResolvedInstruction[]
  /** Called when the edit (tab=0) or cancel (tab=1) button is clicked. */
  onModify?: (instruction: ResolvedInstruction, initialTab: number) => void
  onAdd?: () => void
}

export function InstructionTimeline({ instructions, onModify, onAdd }: Readonly<Props>) {
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

  if (instructions.length === 0 && !onAdd) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('journey.noInstructions')}
      </Typography>
    )
  }

  if (instructions.length === 0 && onAdd) {
    return (
      <Stack gap={1}>
        <Typography variant="body2" color="text.secondary">
          {t('journey.noInstructions')}
        </Typography>
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAdd}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('journey.instructionModify.addAction')}
        </Button>
      </Stack>
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
                <JourneyIcon icon={instruction.icon} fontSize="small" color="action" />
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
                {onModify && instruction.status !== 'CANCELLED' && (
                  <Tooltip title={t('journey.instructionModify.rescheduleTab')}>
                    <IconButton
                      size="small"
                      aria-label={t('journey.instructionModify.rescheduleTab')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onModify(instruction, 0)
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onModify && instruction.status !== 'CANCELLED' && (
                  <Tooltip title={t('journey.instructionModify.cancelTab')}>
                    <IconButton
                      size="small"
                      aria-label={t('journey.instructionModify.cancelTab')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onModify(instruction, 1)
                      }}
                    >
                      <CancelOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
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
      {onAdd && (
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAdd}
          sx={{ alignSelf: 'flex-start', mt: 0.5 }}
        >
          {t('journey.instructionModify.addAction')}
        </Button>
      )}
    </Stack>
  )
}
