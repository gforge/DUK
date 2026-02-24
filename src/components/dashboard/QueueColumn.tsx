import React from 'react'
import { Box, Typography, Paper, Badge, Chip, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Case, CaseCategory, Patient } from '../../api/schemas'
import CaseListItem from './CaseListItem'
import { useRovingTabIndex } from '../../hooks/useRovingTabIndex'

interface QueueColumnProps {
  category: CaseCategory
  cases: Case[]
  patients: Map<string, Patient>
  onRefresh: () => void
}

const CATEGORY_COLORS: Record<CaseCategory, string> = {
  ACUTE: '#fff0f0',
  SUBACUTE: '#fffff0',
  CONTROL: '#f0f0ff',
}

const CATEGORY_BORDER: Record<CaseCategory, string> = {
  ACUTE: '#e57373',
  SUBACUTE: '#ffd54f',
  CONTROL: '#64b5f6',
}

export default function QueueColumn({ category, cases, patients, onRefresh }: QueueColumnProps) {
  const { t } = useTranslation()
  const { getItemProps } = useRovingTabIndex(cases.length)

  const needsAttention = cases.filter(
    (c) => c.status === 'NEEDS_REVIEW' || c.triggers.length > 0,
  ).length

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: { xs: '100%', lg: 280 },
        backgroundColor: CATEGORY_COLORS[category],
        borderColor: CATEGORY_BORDER[category],
        borderWidth: 2,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: CATEGORY_BORDER[category],
          backgroundColor: CATEGORY_BORDER[category] + '33',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t(`category.${category}`)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(`category.${category}_desc`)}
            </Typography>
          </Box>
          <Badge badgeContent={needsAttention} color="error" showZero={false}>
            <Chip
              label={t('dashboard.patientsCount', { count: cases.length })}
              size="small"
              variant="outlined"
            />
          </Badge>
        </Stack>
      </Box>

      {/* Case list */}
      <Box role="list" aria-label={`${t(`category.${category}`)} queue`}>
        {cases.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.noResults')}
            </Typography>
          </Box>
        ) : (
          cases.map((c, idx) => (
            <CaseListItem
              key={c.id}
              caseData={c}
              patient={patients.get(c.patientId)}
              onRefresh={onRefresh}
              {...getItemProps(idx)}
            />
          ))
        )}
      </Box>
    </Paper>
  )
}
