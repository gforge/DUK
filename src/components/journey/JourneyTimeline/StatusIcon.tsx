import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { useTheme } from '@mui/material'
import React from 'react'

import { StepStatus } from './types'

export const StatusIcon = ({ status }: { status: StepStatus }) => {
  const theme = useTheme()
  const statusColor: Record<StepStatus, string> = {
    SUBMITTED: theme.palette.success.main,
    UPCOMING: theme.palette.primary.main,
    OVERDUE: theme.palette.error.main,
  }
  if (status === 'SUBMITTED') return <CheckCircleIcon sx={{ color: statusColor.SUBMITTED }} />
  if (status === 'OVERDUE') return <ErrorIcon sx={{ color: statusColor.OVERDUE }} />
  return <RadioButtonUncheckedIcon sx={{ color: statusColor.UPCOMING }} />
}
