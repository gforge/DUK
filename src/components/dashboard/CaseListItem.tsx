import { Box, Divider,Stack, Typography } from '@mui/material'
import { differenceInDays, format, parseISO } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Case, CaseStatus,Patient } from '@/api/schemas'
import { useStatusLabel } from '@/hooks/labels'
import { useFocusRestore } from '@/hooks/useFocusRestore'

import AutoWarningsBadge from '../common/AutoWarningsBadge'
import DeadlineLabel from '../common/DeadlineLabel'
import StatusChip from '../common/StatusChip'
import TriggerChips from '../common/TriggerChips'

interface CaseListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  caseData: Case
  patient?: Patient
  onRefresh: () => void
  'data-list-item'?: boolean
}

/** Left-border colour communicates urgency at a glance */
const STATUS_BORDER: Record<CaseStatus, string> = {
  NEW: '#9e9e9e',
  NEEDS_REVIEW: '#f44336',
  TRIAGED: '#42a5f5',
  FOLLOWING_UP: '#ab47bc',
  CLOSED: '#66bb6a',
}

function ScheduledLabel({ scheduledAt }: { scheduledAt: string }) {
  const { t } = useTranslation()
  const days = differenceInDays(new Date(), parseISO(scheduledAt))

  let label: string
  let color: string

  if (days > 14) {
    label = t('dashboard.scheduledDaysAgo', { count: days })
    color = 'error.main'
  } else if (days > 0) {
    label = t('dashboard.scheduledDaysAgo', { count: days })
    color = 'warning.main'
  } else if (days === 0) {
    label = t('dashboard.scheduledToday')
    color = 'success.main'
  } else {
    label = t('dashboard.scheduledInDays', { count: Math.abs(days) })
    color = 'text.secondary'
  }

  return (
    <Typography variant="caption" sx={{ color }}>
      {label}
    </Typography>
  )
}

export default function CaseListItem({
  caseData,
  patient,
  onRefresh: _onRefresh,
  ...props
}: CaseListItemProps) {
  const { t } = useTranslation()
  const getStatusLabel = useStatusLabel()
  const navigate = useNavigate()
  const { save } = useFocusRestore()

  const handleOpen = () => {
    save()
    navigate(`/cases/${caseData.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen()
    }
    props.onKeyDown?.(e as React.KeyboardEvent<HTMLDivElement>)
  }

  const lastActivity = caseData.lastActivityAt
    ? format(new Date(caseData.lastActivityAt), 'dd MMM HH:mm')
    : '—'

  const deadline = caseData.deadline ?? null

  return (
    <>
      <Box
        role="listitem"
        tabIndex={props.tabIndex ?? 0}
        sx={{
          pl: 1.5,
          pr: 2,
          py: 1.25,
          cursor: 'pointer',
          borderLeft: `4px solid ${STATUS_BORDER[caseData.status]}`,
          transition: 'box-shadow 0.15s',
          '&:hover': {
            bgcolor: 'action.hover',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
        }}
        aria-label={`${patient?.displayName ?? caseData.patientId} – ${getStatusLabel(caseData.status)}`}
        {...props}
        onClick={(e) => {
          props.onClick?.(e)
          handleOpen()
        }}
        onKeyDown={(e) => {
          handleKeyDown(e)
          props.onKeyDown?.(e)
        }}
      >
        {/* Row 1: Patient name + Status badge */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
            {patient?.displayName ?? caseData.patientId}
          </Typography>
          <StatusChip status={caseData.status} />
        </Stack>

        {/* Row 2: Trigger chips */}
        {caseData.triggers.length > 0 && (
          <Box mt={0.5}>
            <TriggerChips triggers={caseData.triggers} />
          </Box>
        )}

        {/* Row 3: Auto-warnings badge + meta */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mt={0.5}>
          <AutoWarningsBadge
            warnings={caseData.policyWarnings}
            lastActivityAt={caseData.lastActivityAt}
          />
          <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
            {caseData.scheduledAt && <ScheduledLabel scheduledAt={caseData.scheduledAt} />}
            <Typography variant="caption" color="text.secondary">
              {t('dashboard.lastActivity')}: {lastActivity}
            </Typography>
            {deadline && <DeadlineLabel deadline={deadline} />}
          </Stack>
        </Stack>
      </Box>
      <Divider />
    </>
  )
}
