import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import type { JourneyTemplate, JourneyTemplateInstruction } from '@/api/schemas'
import { useOffsetFormat } from '@/hooks/useOffsetFormat'
import { JourneyIcon } from '@/utils/journeyIcons'

interface Props {
  jt: JourneyTemplate
  instr: JourneyTemplateInstruction
  instrName: string
  instrContent: string
  setTemplateInstructionsTarget: (jt: JourneyTemplate) => void
  handleDeleteInstruction: (template: JourneyTemplate, instrId: string) => void
}

export function InstructionRow({
  jt,
  instr,
  instrName,
  instrContent,
  setTemplateInstructionsTarget,
  handleDeleteInstruction,
}: Props) {
  const { t } = useTranslation()
  const formatOffset = useOffsetFormat()
  const [isExpanded, setIsExpanded] = useState(false)

  const instrLabel = instr.label ?? instrName
  const startF = formatOffset(instr.startDayOffset)
  const endF = instr.endDayOffset !== undefined ? formatOffset(instr.endDayOffset) : null

  return (
    <React.Fragment>
      <TableRow
        hover
        sx={{ bgcolor: 'action.hover', cursor: 'pointer' }}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <TableCell sx={{ minWidth: 120 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <ExpandMoreIcon
              fontSize="small"
              color="action"
              sx={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s',
                flexShrink: 0,
              }}
            />
            <JourneyIcon icon={instr.icon} fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {instrLabel}
            </Typography>
          </Stack>
          <Chip
            label={t('journey.editor.tabInstructions').replace(/s$/, '')}
            size="small"
            variant="outlined"
            color="info"
            sx={{ fontSize: 10, height: 18, mt: 0.5, ml: 3 }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 160 }}>
          <Stack>
            <Tooltip title={startF.tooltip || ''}>
              <Typography variant="body2" fontWeight={600}>
                {startF.label}
              </Typography>
            </Tooltip>
            {endF && (
              <Typography variant="caption" color="text.secondary">
                → {endF.label}
              </Typography>
            )}
          </Stack>
        </TableCell>
        <TableCell />
        <TableCell />
        <TableCell sx={{ width: 80 }}>
          <Stack
            direction="row"
            gap={0.5}
            justifyContent="flex-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => setTemplateInstructionsTarget(jt)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteInstruction(jt, instr.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
          <Collapse in={isExpanded} unmountOnExit>
            <Box
              sx={{
                py: 1.5,
                px: 2,
                ml: 3,
                borderLeft: 2,
                borderColor: 'info.light',
                '& p': { my: 0.5, typography: 'body2' },
                '& ul, & ol': { my: 0.5, pl: 2.5 },
                '& li': { my: 0.25 },
              }}
            >
              {instrContent ? (
                <ReactMarkdown>{instrContent}</ReactMarkdown>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  {t('journey.instructionFallback')}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}
