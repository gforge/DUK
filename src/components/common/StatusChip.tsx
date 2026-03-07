import React from 'react'
import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import FiberNewIcon from '@mui/icons-material/FiberNew'
import ErrorIcon from '@mui/icons-material/Error'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useOptionalRole } from '@/store/roleContext'
import { useStatusLabel } from '@/hooks/labels'
import type { CaseStatus } from '@/api/schemas'

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
