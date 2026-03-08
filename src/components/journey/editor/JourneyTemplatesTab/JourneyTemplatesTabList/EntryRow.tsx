import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import RepeatIcon from '@mui/icons-material/Repeat'
import { Chip, IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, JourneyTemplateEntry } from '@/api/schemas'
import { useOffsetFormat } from '@/hooks/useOffsetFormat'
import { JourneyIcon } from '@/utils/journeyIcons'

interface Props {
  jt: JourneyTemplate
  entry: JourneyTemplateEntry
  setEntryEditState: React.Dispatch<
    React.SetStateAction<{ template: JourneyTemplate; entry?: JourneyTemplateEntry } | null>
  >
  handleDeleteEntry: (template: JourneyTemplate, entryId: string) => void
}

export function EntryRow({ jt, entry, setEntryEditState, handleDeleteEntry }: Props) {
  const { t } = useTranslation()
  const formatOffset = useOffsetFormat()
  const f = formatOffset(entry.offsetDays)

  return (
    <TableRow hover>
      <TableCell sx={{ minWidth: 120 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <JourneyIcon icon={entry.icon} fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600}>
            {entry.label}
          </Typography>
        </Stack>
        {entry.stepKey && (
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block', mt: 0.25 }}
          >
            {entry.stepKey}
          </Typography>
        )}
        {entry.recurrenceIntervalDays !== undefined && (
          <Chip
            icon={<RepeatIcon />}
            label={t('journey.template.recurrenceUnit', { count: entry.recurrenceIntervalDays })}
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ fontSize: 10, height: 18, mt: 0.5 }}
          />
        )}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 160 }}>
        <Stack>
          <Tooltip title={f.tooltip || ''}>
            <Typography variant="body2" fontWeight={600}>
              {f.label}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            {entry.windowDays !== undefined ? `±${entry.windowDays}d` : ''}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="caption">{entry.templateId}</Typography>
      </TableCell>
      <TableCell />
      <TableCell sx={{ width: 80 }}>
        <Stack direction="row" gap={0.5} justifyContent="flex-end">
          <Tooltip title={t('common.edit')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setEntryEditState({ template: jt, entry })
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteEntry(jt, entry.id)
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
