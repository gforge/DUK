import React from 'react'
import { Stack, Chip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { parseDeadlineInput } from './parseDeadlineInput'

const QUICK_OPTIONS = ['1d', '3d', '1v', '2v'] as const

interface Props {
  onSelect: (isoDate: string) => void
}

export default function DeadlineQuickChips({ onSelect }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
        {t('triage.quickDeadline')}:
      </Typography>
      {QUICK_OPTIONS.map((opt) => {
        const iso = parseDeadlineInput(opt)!
        const label = new Date(iso + 'T12:00:00').toLocaleDateString(
          i18n.language === 'sv' ? 'sv-SE' : 'en-GB',
          { day: 'numeric', month: 'short' },
        )
        return (
          <Chip
            key={opt}
            label={`${opt} — ${label}`}
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
