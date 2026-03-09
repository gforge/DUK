import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, Patient, WorkCategory } from '@/api/schemas'

import WorklistRow from './WorklistRow'

interface GroupSectionProps {
  workCategory: WorkCategory
  cases: Case[]
  patientMap: Map<string, Patient>
  highlightedCaseIds: Set<string>
  onBook: (caseId: string, scheduledAt?: string) => void
  onClaim: (caseId: string) => void
  onMarkInProgress: (caseId: string) => void
  onMarkDone: (caseId: string) => void
}

export default function GroupSection({
  workCategory,
  cases,
  patientMap,
  highlightedCaseIds,
  onBook,
  onClaim,
  onMarkInProgress,
  onMarkDone,
}: GroupSectionProps) {
  const { t } = useTranslation()

  const labelKeyByCategory: Record<WorkCategory, string> = {
    VISIT: 'worklist.category.VISIT',
    PHONE: 'worklist.category.PHONE',
    DIGITAL: 'worklist.category.DIGITAL',
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      {/* Group header */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        px={2}
        py={1}
        sx={{ bgcolor: 'action.selected' }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {t(labelKeyByCategory[workCategory] as never)}
        </Typography>
        <Chip label={cases.length} size="small" color="default" />
      </Stack>

      {cases.length === 0 ? (
        <Box px={2} py={1.5}>
          <Typography variant="body2" color="text.secondary">
            {t('worklist.emptyGroup')}
          </Typography>
        </Box>
      ) : (
        cases.map((c, idx) => (
          <React.Fragment key={c.id}>
            <WorklistRow
              caseData={c}
              patient={patientMap.get(c.patientId)}
              highlighted={highlightedCaseIds.has(c.id)}
              onBook={onBook}
              onClaim={onClaim}
              onMarkInProgress={onMarkInProgress}
              onMarkDone={onMarkDone}
            />
            {idx < cases.length - 1 && <Divider />}
          </React.Fragment>
        ))
      )}
    </Paper>
  )
}
