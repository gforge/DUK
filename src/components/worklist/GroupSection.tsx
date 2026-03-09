import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, Patient, WorkCategory } from '@/api/schemas'
import { useWorkCategoryLabel } from '@/hooks/labels'

import WorklistRow from './WorklistRow'

interface GroupSectionProps {
  workCategory: WorkCategory
  cases: Case[]
  patientMap: Map<string, Patient>
  highlightedCaseIds: Set<string>
  defaultExpanded?: boolean
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
  defaultExpanded = true,
  onBook,
  onClaim,
  onMarkInProgress,
  onMarkDone,
}: GroupSectionProps) {
  const { t } = useTranslation()
  const getWorkCategoryLabel = useWorkCategoryLabel()

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      <Accordion
        defaultExpanded={defaultExpanded}
        disableGutters
        sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ px: 2, minHeight: 44, bgcolor: 'action.selected' }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              {getWorkCategoryLabel(workCategory)}
            </Typography>
            <Chip label={cases.length} size="small" color="default" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
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
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}
