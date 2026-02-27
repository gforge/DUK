import React from 'react'
import { Stack, Chip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { parseDeadlineInput } from './parseDeadlineInput'

const QUICK_OPTIONS = [
  { shorthand: '2d', unit: 'day', count: 2 },
  { shorthand: '1v', unit: 'week', count: 1 },
  { shorthand: '2v', unit: 'week', count: 2 },
  { shorthand: '4v', unit: 'week', count: 4 },
] as const

interface Props {
  onSelect: (isoDate: string) => void
  label: string
}

export default function DeadlineQuickChips({ onSelect, label }: Props) {
  const { t } = useTranslation()

  return (
    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}:
      </Typography>
      {QUICK_OPTIONS.map(({ shorthand, unit, count }) => {
        const iso = parseDeadlineInput(shorthand)!
        const label = t(unit === 'day' ? 'triage.quickDay' : 'triage.quickWeek', { count })
        return (
          <Chip
            key={shorthand}
            label={label}
            size="small"
            variant="outlined"
            onClick={() => onSelect(iso)}
            clickable
            sx={{ cursor: 'pointer' }}
          />
        )
      })}
    </Stack>
  )
}
