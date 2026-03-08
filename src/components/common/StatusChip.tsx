import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import FiberNewIcon from '@mui/icons-material/FiberNew'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import type { ChipProps } from '@mui/material'
import { Chip } from '@mui/material'
import React from 'react'

import type { CaseStatus } from '@/api/schemas'
import { useStatusLabel } from '@/hooks/labels'
import { useOptionalRole } from '@/store/roleContext'

const STATUS_COLORS: Record<CaseStatus, ChipProps['color']> = {
  NEW: 'default',
  NEEDS_REVIEW: 'error',
  TRIAGED: 'info',
  FOLLOWING_UP: 'secondary',
  CLOSED: 'success',
}

const STATUS_ICONS: Record<CaseStatus, React.ReactElement> = {
  NEW: <FiberNewIcon fontSize="inherit" />,
  NEEDS_REVIEW: <ErrorIcon fontSize="inherit" />,
  TRIAGED: <TaskAltIcon fontSize="inherit" />,
  FOLLOWING_UP: <ScheduleIcon fontSize="inherit" />,
  CLOSED: <CheckCircleIcon fontSize="inherit" />,
}

interface StatusChipProps {
  status: CaseStatus
  size?: ChipProps['size']
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const getStatusLabel = useStatusLabel()
  // role context may not exist in isolated tests
  let isPatientView = false
  const roleCtx = useOptionalRole()
  if (roleCtx && roleCtx.currentUser.role === 'PATIENT') {
    isPatientView = true
  }
  const label = getStatusLabel(status, isPatientView)

  return (
    <Chip
      icon={STATUS_ICONS[status]}
      label={label}
      color={STATUS_COLORS[status]}
      size={size}
      variant="filled"
      aria-label={label}
    />
  )
}
