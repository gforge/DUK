import { Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { getDeadlineInfo } from '@/utils'

interface Props {
  deadline: string
  tone?: 'default' | 'queue'
}

/**
 * Renders a deadline as "14 mar 2026 · om 5 dagar" (or "Försenad 2 dagar" in red).
 */
export default function DeadlineLabel({ deadline, tone = 'default' }: Props) {
  const { t } = useTranslation()
  const { dateLabel, days, isOverdue } = getDeadlineInfo(deadline)

  let relativeLabel: string
  if (isOverdue) {
    relativeLabel = t('deadline.overdueDays', { count: Math.abs(days) })
  } else if (days === 0) {
    relativeLabel = t('deadline.today')
  } else if (days < 7) {
    relativeLabel = t('deadline.inDays', { count: days })
  } else if (days < 28) {
    relativeLabel = t('deadline.inWeeks', { count: Math.floor(days / 7) })
  } else {
    relativeLabel = t('deadline.inMonths', { count: Math.floor(days / 30) })
  }

  const isSoon = !isOverdue && days <= 3
  const color =
    tone === 'queue'
      ? isOverdue
        ? 'error.main'
        : isSoon
          ? 'warning.dark'
          : 'text.secondary'
      : isOverdue
        ? 'error.main'
        : 'warning.dark'
  const fontWeight = tone === 'queue' ? (isOverdue ? 700 : isSoon ? 600 : 500) : 500

  return (
    <Typography component="span" variant="caption" sx={{ color, fontWeight }}>
      ⏱ {dateLabel} · {relativeLabel}
    </Typography>
  )
}
