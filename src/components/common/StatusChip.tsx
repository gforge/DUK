import React from 'react'
import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { CaseStatus } from '../../api/schemas'

const STATUS_COLORS: Record<CaseStatus, ChipProps['color']> = {
  NEW: 'default',
  NEEDS_REVIEW: 'warning',
  TRIAGED: 'info',
  FOLLOWING_UP: 'secondary',
  CLOSED: 'success',
}

interface StatusChipProps {
  status: CaseStatus
  size?: ChipProps['size']
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const { t } = useTranslation()
  return (
    <Chip
      label={t(`status.${status}`)}
      color={STATUS_COLORS[status]}
      size={size}
      variant="filled"
    />
  )
}
