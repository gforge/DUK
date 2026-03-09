import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, Patient, WorkCategory } from '@/api/schemas'
import { CONTACT_MODE_UI } from '@/components/case/triage/Step1/actions'
import { useWorkCategoryLabel } from '@/hooks/labels'

import WorklistRow from './WorklistRow'

interface GroupSectionProps {
  workCategory: WorkCategory
  cases: Case[]
  patientMap: Map<string, Patient>
  userMap: Map<string, string>
  highlightedCaseIds: Set<string>
  defaultExpanded?: boolean
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
  patientMap,
  userMap,
  highlightedCaseIds,
  defaultExpanded = true,
  onClaim,
  onMarkDone,
}: GroupSectionProps) {
  const { t } = useTranslation()
  const getWorkCategoryLabel = useWorkCategoryLabel()
  const groupUi = CONTACT_MODE_UI[workCategory]
  const GroupIcon = groupUi.icon
  const accentColor =
    workCategory === 'DIGITAL'
      ? 'info.main'
      : workCategory === 'PHONE'
        ? 'warning.main'
        : 'success.main'

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Accordion
        defaultExpanded={defaultExpanded}
        disableGutters
        sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 2,
            minHeight: 44,
            bgcolor: 'background.paper',
            borderLeft: 4,
            borderLeftColor: accentColor,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 24,
                height: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                color: groupUi.iconColor,
                bgcolor: groupUi.bgColor,
                border: 1,
                borderColor: groupUi.borderColor,
              }}
            >
              <GroupIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {getWorkCategoryLabel(workCategory)}
            </Typography>
            <Chip label={cases.length} size="small" color="default" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
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
                  assignedUserName={
                    c.assignedUserId
                      ? (userMap.get(c.assignedUserId) ?? c.assignedUserId)
                      : undefined
                  }
                  highlighted={highlightedCaseIds.has(c.id)}
                  onClaim={onClaim}
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
