import React from 'react'
import { Box, Typography, Stack, Chip, Tooltip, IconButton, Divider } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HelpIcon from '@mui/icons-material/Help'
import ErrorIcon from '@mui/icons-material/Error'
import PhoneIcon from '@mui/icons-material/Phone'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import PolicyIcon from '@mui/icons-material/GppMaybe'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFocusRestore } from '../../hooks/useFocusRestore'
import StatusChip from '../common/StatusChip'
import type { Case, Patient, TriggerType } from '../../api/schemas'
import { format } from 'date-fns'

interface CaseListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  caseData: Case
  patient?: Patient
  onRefresh: () => void
  'data-list-item'?: boolean
}

function CaseStatusIcon({ caseData }: { caseData: Case }) {
  const hasPolicyWarning = caseData.policyWarnings.length > 0
  const hasHighSeverity = caseData.policyWarnings.some((w) => w.severity === 'HIGH')
  const needsReview = caseData.status === 'NEEDS_REVIEW'
  const isClosed = caseData.status === 'CLOSED'

  if (isClosed) return <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
  if (hasHighSeverity || (hasPolicyWarning && needsReview))
    return <ErrorIcon sx={{ color: 'error.main' }} fontSize="small" />
  if (needsReview) return <HelpIcon sx={{ color: 'warning.main' }} fontSize="small" />
  return <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
}

function TriggerBadge({ trigger }: { trigger: TriggerType }) {
  const { t } = useTranslation()
  const isNotOpened = trigger === 'NOT_OPENED'
  const isNoResponse = trigger === 'NO_RESPONSE'

  const icon = isNotOpened ? (
    <SmartphoneIcon fontSize="inherit" />
  ) : isNoResponse ? (
    <PhoneIcon fontSize="inherit" />
  ) : null

  return (
    <Chip
      icon={icon ?? undefined}
      label={t(`trigger.${trigger}`)}
      size="small"
      variant="outlined"
      color={
        trigger === 'HIGH_PAIN' || trigger === 'INFECTION_SUSPECTED'
          ? 'error'
          : trigger === 'NOT_OPENED' || trigger === 'NO_RESPONSE'
            ? 'warning'
            : 'default'
      }
      sx={{ fontSize: 10, height: 20 }}
    />
  )
}

export default function CaseListItem({
  caseData,
  patient,
  onRefresh,
  ...props
}: CaseListItemProps) {
  const { t } = useTranslation()
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

  const deadline = caseData.deadline ? format(new Date(caseData.deadline), 'dd MMM yyyy') : null

  return (
    <>
      <Box
        role="listitem"
        tabIndex={props.tabIndex ?? 0}
        sx={{
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
        }}
        aria-label={`${patient?.displayName ?? caseData.patientId} – ${t(`status.${caseData.status}`)}`}
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
        <Stack direction="row" alignItems="flex-start" gap={1}>
          <Box sx={{ pt: 0.3 }}>
            <CaseStatusIcon caseData={caseData} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 150 }}>
                {patient?.displayName ?? caseData.patientId}
              </Typography>
              <StatusChip status={caseData.status} />
            </Stack>

            {/* Triggers */}
            {caseData.triggers.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                {caseData.triggers.slice(0, 3).map((trigger) => (
                  <TriggerBadge key={trigger} trigger={trigger} />
                ))}
                {caseData.triggers.length > 3 && (
                  <Chip
                    label={`+${caseData.triggers.length - 3}`}
                    size="small"
                    sx={{ fontSize: 10, height: 20 }}
                  />
                )}
              </Stack>
            )}

            {/* Policy warnings */}
            {caseData.policyWarnings.length > 0 && (
              <Tooltip title={caseData.policyWarnings.map((w) => w.ruleName).join(', ')} arrow>
                <Chip
                  icon={<PolicyIcon fontSize="inherit" />}
                  label={`${caseData.policyWarnings.length} ${t('case.policyWarnings')}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ mt: 0.5, fontSize: 10, height: 20 }}
                />
              </Tooltip>
            )}

            {/* Meta */}
            <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                {t('dashboard.lastActivity')}: {lastActivity}
              </Typography>
              {deadline && (
                <Typography variant="caption" color="warning.dark">
                  ⏱ {deadline}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
      <Divider />
    </>
  )
}
