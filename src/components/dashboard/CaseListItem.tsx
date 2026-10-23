import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { format, parseISO } from 'date-fns'
import { enUS, sv } from 'date-fns/locale'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Case, Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'
import { AutoWarningsBadge, GridTableRow, StatusChip, Tag, TriggerChips } from '@/components/common'
import { useStatusLabel } from '@/hooks/labels'
import { useFocusRestore } from '@/hooks/useFocusRestore'
import { tokens } from '@/theme'

import { LONG_WAIT_DAYS, waitedDays } from './sortCases'

/** Shared grid template for the queue table header and rows. */
export const QUEUE_COLUMNS = 'minmax(170px,1.3fr) minmax(180px,2fr) 96px 84px 120px 140px'
export const QUEUE_MIN_WIDTH = 900

interface CaseListItemProps {
  readonly caseData: Case
  readonly patient?: Patient
  /** Rendered greyed out (between-phase and recently closed cases). */
  readonly muted?: boolean
  readonly tabIndex?: number
  readonly onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void
  readonly onClick?: () => void
  readonly 'data-list-item'?: boolean
}

function WaitedCell({ scheduledAt }: { readonly scheduledAt: string }) {
  const { t } = useTranslation()
  const days = waitedDays({ scheduledAt })
  const long = days >= LONG_WAIT_DAYS
  let label: string
  if (days === 0) label = t('dashboard.scheduledToday')
  else if (days > 0) label = t('dashboard.waitedDays', { count: days })
  else label = t('dashboard.waitInDays', { count: Math.abs(days) })
  return (
    <Box
      sx={{
        fontVariantNumeric: 'tabular-nums',
        color: long ? tokens.danger : days < 0 ? tokens.textSecondary : tokens.text2,
        fontWeight: long ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  )
}

/** One case as a row in the dashboard queue table. */
export default function CaseListItem({
  caseData,
  patient,
  muted = false,
  tabIndex,
  onKeyDown,
  onClick,
  'data-list-item': dataListItem,
}: CaseListItemProps) {
  const { t, i18n } = useTranslation()
  const getStatusLabel = useStatusLabel()
  const navigate = useNavigate()
  const { save } = useFocusRestore()

  const handleOpen = () => {
    onClick?.()
    save()
    navigate(`/cases/${caseData.id}`)
  }

  const dateLocale = (i18n.resolvedLanguage ?? i18n.language ?? 'sv').startsWith('en') ? enUS : sv
  const lastActivity = caseData.lastActivityAt
    ? format(parseISO(caseData.lastActivityAt), 'd MMM HH:mm', { locale: dateLocale })
    : '—'
  const name = patient?.displayName ?? caseData.patientId
  const reviewPending = caseData.colleagueReviews.some((r) => r.respondedAt === null)
  const isRecentlyTriaged = caseData.status === 'TRIAGED' && !muted

  return (
    <GridTableRow
      columns={QUEUE_COLUMNS}
      minWidth={QUEUE_MIN_WIDTH}
      muted={muted}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={handleOpen}
      data-list-item={dataListItem}
      aria-label={`${name} – ${getStatusLabel(caseData.status)}`}
      sx={
        isRecentlyTriaged
          ? {
              animation: 'recentlyTriaged 5s ease forwards',
              '@keyframes recentlyTriaged': {
                '0%, 80%': { backgroundColor: tokens.infoBg },
                '100%': { backgroundColor: 'transparent' },
              },
            }
          : undefined
      }
    >
      <Stack role="cell" sx={{ gap: 0.25, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontWeight: 600, color: muted ? tokens.textSecondary : tokens.text }}
        >
          {name}
        </Typography>
        {patient?.personalNumber && (
          <Typography noWrap sx={{ fontSize: 12, color: tokens.textSecondary }}>
            {formatPersonnummer(patient.personalNumber)}
          </Typography>
        )}
      </Stack>
      <Stack role="cell" direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, minWidth: 0 }}>
        {caseData.triggers.length > 0 && <TriggerChips triggers={caseData.triggers} />}
        {reviewPending && (
          <Tag
            variant="admin"
            icon={<RateReviewOutlinedIcon fontSize="inherit" />}
            label={t('dashboard.reviewRequested')}
          />
        )}
      </Stack>
      <Box role="cell">
        <AutoWarningsBadge
          warnings={caseData.policyWarnings}
          lastActivityAt={caseData.lastActivityAt}
          compact
        />
      </Box>
      <Box role="cell">
        <WaitedCell scheduledAt={caseData.scheduledAt} />
      </Box>
      <Box role="cell" sx={{ color: tokens.textSecondary, fontSize: 13, whiteSpace: 'nowrap' }}>
        {lastActivity}
      </Box>
      <Box role="cell">
        <StatusChip status={caseData.status} />
      </Box>
    </GridTableRow>
  )
}
