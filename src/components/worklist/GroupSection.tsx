import React from 'react'
import { Paper, Stack, Typography, Chip, Box, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNextStepLabel } from '@/hooks/labels'
import type { Case, Patient, NextStep } from '@/api/schemas'
import WorklistRow from './WorklistRow'

interface GroupSectionProps {
  nextStep: NextStep
  cases: Case[]
  patientMap: Map<string, Patient>
  onBook: (caseId: string, scheduledAt?: string) => void
  onMarkInProgress: (caseId: string) => void
  onMarkDone: (caseId: string) => void
}

export default function GroupSection({
  nextStep,
  cases,
  patientMap,
  onBook,
  onMarkInProgress,
  onMarkDone,
}: GroupSectionProps) {
  const { t } = useTranslation()
  const getNextStepLabel = useNextStepLabel()

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
          {getNextStepLabel(nextStep)}
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
              onBook={onBook}
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
