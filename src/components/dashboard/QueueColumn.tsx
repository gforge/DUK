import { Box, Link, Stack } from '@mui/material'
import type { KeyboardEvent } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, CaseCategory, Patient } from '@/api/schemas'
import { GridTableHeader, SectionCard } from '@/components/common'
import { useCategoryDescLabel, useCategoryLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

import CaseListItem, { QUEUE_COLUMNS, QUEUE_MIN_WIDTH } from './CaseListItem'

type RovingItemProps = {
  tabIndex: number
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  onClick: () => void
  'data-list-item': boolean
}

interface QueueColumnProps {
  readonly category: CaseCategory
  readonly cases: Case[]
  readonly waitingCases?: Case[]
  readonly closedCases?: Case[]
  readonly patients: Map<string, Patient>
  /** Show the between-phase rows (toggled by the user or forced by an active search). */
  readonly showWaiting: boolean
  /** Omitted while the rows are forced visible (active search), which hides the toggle. */
  readonly onToggleWaiting?: () => void
  readonly showClosed: boolean
  readonly onToggleClosed: () => void
  readonly open: boolean
  readonly onToggleOpen: () => void
  /** Roving tab index props for the n:th visible row of this section. */
  readonly getItemProps: (index: number) => RovingItemProps
}

const CATEGORY_MARKER: Record<CaseCategory, string> = {
  ACUTE: tokens.categoryAcute,
  SUBACUTE: tokens.categorySubacute,
  CONTROL: tokens.categoryControl,
}

function ToggleLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={onClick}
      sx={{ font: 'inherit', fontSize: 13, fontWeight: 500 }}
    >
      {children}
    </Link>
  )
}

const byClosedDesc = (a: Case, b: Case) =>
  new Date(b.closedAt ?? b.lastActivityAt).getTime() -
  new Date(a.closedAt ?? a.lastActivityAt).getTime()

/** One queue category (Akut / Subakut / Kontroll) rendered as a table section. */
export default function QueueColumn({
  category,
  cases,
  waitingCases = [],
  closedCases = [],
  patients,
  showWaiting,
  onToggleWaiting,
  showClosed,
  onToggleClosed,
  open,
  onToggleOpen,
  getItemProps,
}: QueueColumnProps) {
  const { t } = useTranslation()
  const getCategoryLabel = useCategoryLabel()
  const getCategoryDescLabel = useCategoryDescLabel()
  const categoryLabel = getCategoryLabel(category)

  const visibleWaiting = showWaiting ? waitingCases : []
  const visibleClosed = showClosed ? [...closedCases].sort(byClosedDesc) : []
  const canToggleWaiting = waitingCases.length > 0 && onToggleWaiting !== undefined
  const hasToggles = canToggleWaiting || closedCases.length > 0

  return (
    <SectionCard
      aria-label={categoryLabel}
      title={categoryLabel}
      description={getCategoryDescLabel(category)}
      count={t('dashboard.patientsCount', { count: cases.length })}
      markerColor={CATEGORY_MARKER[category]}
      open={open}
      onToggle={onToggleOpen}
      headerMinWidth={QUEUE_MIN_WIDTH}
    >
      <Box role="table" aria-label={t('dashboard.queueTable', { category: categoryLabel })}>
        <GridTableHeader columns={QUEUE_COLUMNS} minWidth={QUEUE_MIN_WIDTH}>
          <div role="columnheader">{t('dashboard.columns.patient')}</div>
          <div role="columnheader">{t('dashboard.columns.signals')}</div>
          <div role="columnheader">{t('dashboard.columns.warnings')}</div>
          <div role="columnheader">{t('dashboard.columns.waited')}</div>
          <div role="columnheader">{t('dashboard.lastActivity')}</div>
          <div role="columnheader">{t('dashboard.columns.status')}</div>
        </GridTableHeader>

        {cases.length === 0 && (
          <Box
            role="row"
            sx={{
              minWidth: QUEUE_MIN_WIDTH,
              px: 2,
              py: 1.5,
              color: tokens.textSecondary,
              borderBottom: `1px solid ${tokens.rowDivider}`,
            }}
          >
            <span role="cell">{t('dashboard.noResults')}</span>
          </Box>
        )}

        {cases.map((c, idx) => (
          <CaseListItem
            key={c.id}
            caseData={c}
            patient={patients.get(c.patientId)}
            {...getItemProps(idx)}
          />
        ))}

        {visibleWaiting.map((c, idx) => (
          <CaseListItem
            key={c.id}
            caseData={c}
            patient={patients.get(c.patientId)}
            muted
            {...getItemProps(cases.length + idx)}
          />
        ))}

        {visibleClosed.map((c, idx) => (
          <CaseListItem
            key={c.id}
            caseData={c}
            patient={patients.get(c.patientId)}
            muted
            {...getItemProps(cases.length + visibleWaiting.length + idx)}
          />
        ))}
      </Box>

      {hasToggles && (
        <Stack direction="row" sx={{ gap: 2.5, px: 2, py: 1.25, alignItems: 'center' }}>
          {canToggleWaiting && (
            <ToggleLink onClick={onToggleWaiting}>
              {showWaiting
                ? t('dashboard.hideWaiting')
                : t('dashboard.showWaiting', { count: waitingCases.length })}
            </ToggleLink>
          )}
          {closedCases.length > 0 && (
            <ToggleLink onClick={onToggleClosed}>
              {showClosed
                ? t('dashboard.hideClosed')
                : t('dashboard.showClosed', { count: closedCases.length })}
            </ToggleLink>
          )}
        </Stack>
      )}
    </SectionCard>
  )
}
