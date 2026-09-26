import { Box } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CareTeam, Case, Patient, WorkCategory } from '@/api/schemas'
import { GridTableHeader, SectionCard } from '@/components/common'
import { useWorkCategoryLabel } from '@/hooks/labels'

import { WORK_CATEGORY_ICONS } from './workCategoryIcons'
import type { WorklistRowMode } from './WorklistRow'
import WorklistRow, { WORKLIST_COLUMNS, WORKLIST_MIN_WIDTH } from './WorklistRow'

interface GroupSectionProps {
  workCategory: WorkCategory
  cases: Case[]
  mode: WorklistRowMode
  patientMap: Map<string, Patient>
  userMap: Map<string, string>
  teamMap: Map<string, CareTeam>
  highlightedCaseIds: Set<string>
  open: boolean
  onToggleOpen: () => void
  onClaim: (caseId: string) => void
  onMarkDone: (
    caseId: string,
    options?: {
      bookingId?: string
      followUpDate?: string
      completionComment?: string
    },
  ) => Promise<void> | void
}

export default function GroupSection({
  workCategory,
  cases,
  mode,
  patientMap,
  userMap,
  teamMap,
  highlightedCaseIds,
  open,
  onToggleOpen,
  onClaim,
  onMarkDone,
}: GroupSectionProps) {
  const { t } = useTranslation()
  const getWorkCategoryLabel = useWorkCategoryLabel()
  const GroupIcon = WORK_CATEGORY_ICONS[workCategory]
  const title = getWorkCategoryLabel(workCategory)

  return (
    <SectionCard
      title={title}
      icon={<GroupIcon />}
      count={cases.length}
      aria-label={title}
      open={open}
      onToggle={onToggleOpen}
      headerMinWidth={WORKLIST_MIN_WIDTH}
    >
      <Box role="table" aria-label={title}>
        <GridTableHeader columns={WORKLIST_COLUMNS} minWidth={WORKLIST_MIN_WIDTH}>
          <div role="columnheader">{t('worklist.columns.patient')}</div>
          <div role="columnheader">{t('worklist.columns.competence')}</div>
          <div role="columnheader">{t('worklist.columns.recipient')}</div>
          <div role="columnheader">
            {mode === 'completed' ? t('worklist.columns.completed') : t('worklist.columns.due')}
          </div>
          <div role="columnheader">{t('worklist.columns.note')}</div>
          <div role="columnheader" aria-label={t('worklist.columns.actions')} />
        </GridTableHeader>
        {cases.map((c) => (
          <WorklistRow
            key={c.id}
            caseData={c}
            patient={patientMap.get(c.patientId)}
            mode={mode}
            userMap={userMap}
            teamMap={teamMap}
            highlighted={highlightedCaseIds.has(c.id)}
            onClaim={onClaim}
            onMarkDone={onMarkDone}
          />
        ))}
      </Box>
    </SectionCard>
  )
}
