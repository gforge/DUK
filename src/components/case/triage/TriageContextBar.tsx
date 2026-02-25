import React from 'react'
import { Box, Chip, Stack, Typography, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Case } from '../../../api/schemas'
import StatusChip from '../../common/StatusChip'
import TriggerChips from '../../common/TriggerChips'
import AutoWarningsBadge from '../../common/AutoWarningsBadge'

interface Props {
  caseData: Case
}

export default function TriageContextBar({ caseData }: Props) {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 1.5,
        mb: 2,
      }}
    >
      {/* Status + category row */}
      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" mb={1}>
        <StatusChip status={caseData.status} />
        <Chip label={t(`category.${caseData.category}`)} size="small" variant="outlined" />
        {caseData.policyWarnings?.length > 0 && (
          <AutoWarningsBadge warnings={caseData.policyWarnings} />
        )}
      </Stack>

      {/* Triggers */}
      {caseData.triggers.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary">
            {t('triage.contextWhy')}
          </Typography>
          <Box mt={0.5}>
            <TriggerChips triggers={caseData.triggers} />
          </Box>
        </>
      )}
    </Box>
  )
}
