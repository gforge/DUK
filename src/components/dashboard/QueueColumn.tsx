import BiotechIcon from '@mui/icons-material/Biotech'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ImageIcon from '@mui/icons-material/Image'
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, CaseCategory, Patient } from '@/api/schemas'
import { useCategoryDescLabel, useCategoryLabel } from '@/hooks/labels'
import { useRovingTabIndex } from '@/hooks/useRovingTabIndex'

import CaseListItem from './CaseListItem'
import type { SortMode } from './sortCases'

interface QueueColumnProps {
  readonly category: CaseCategory
  readonly cases: Case[]
  readonly waitingCases?: Case[]
  readonly closedCases?: Case[]
  readonly patients: Map<string, Patient>
  readonly onRefresh: () => void
  readonly expanded: boolean
  readonly onToggle: () => void
  readonly sortMode: SortMode
}

const CATEGORY_BORDER: Record<CaseCategory, string> = {
  ACUTE: '#e57373',
  SUBACUTE: '#ffd54f',
  CONTROL: '#64b5f6',
}

export default function QueueColumn({
  category,
  cases,
  waitingCases = [],
  closedCases = [],
  patients,
  onRefresh,
  expanded,
  onToggle,
}: QueueColumnProps) {
  const { t } = useTranslation()
  const getCategoryLabel = useCategoryLabel()
  const getCategoryDescLabel = useCategoryDescLabel()
  const categoryLabel = getCategoryLabel(category)
  const [showClosed, setShowClosed] = useState(false)
  const { getItemProps } = useRovingTabIndex(
    expanded ? cases.length + waitingCases.length + (showClosed ? closedCases.length : 0) : 0,
  )

  const warningCount = cases.filter((c) => c.policyWarnings.length > 0).length
  const contactCount = cases.filter(
    (c) => c.triggers.includes('NO_RESPONSE') || c.triggers.includes('NOT_OPENED'),
  ).length
  const labPendingCount = cases.filter((c) => c.triggers.includes('LAB_PENDING')).length
  const xrayPendingCount = cases.filter((c) => c.triggers.includes('XRAY_PENDING')).length

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      variant="outlined"
      sx={{
        borderLeft: `4px solid ${CATEGORY_BORDER[category]}`,
        borderRadius: '8px !important',
        '&:before': { display: 'none' }, // remove default MUI top divider
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 0.5,
          minHeight: 56,
          '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center', gap: 1.5 },
        }}
        aria-controls={`queue-${category}-content`}
        id={`queue-${category}-header`}
      >
        {/* Category title + desc */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} component="span">
            {getCategoryLabel(category)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {getCategoryDescLabel(category)}
          </Typography>
        </Box>

        {/* Stat chips — shown always so summary is informative when collapsed */}
        <Stack direction="row" gap={0.75} alignItems="center" onClick={(e) => e.stopPropagation()}>
          <Chip
            label={t('dashboard.patientsCount', { count: cases.length })}
            size="small"
            variant="outlined"
            aria-label={t('dashboard.patientsCount', { count: cases.length })}
          />
          {warningCount > 0 && (
            <Chip
              icon={<WarningAmberIcon fontSize="inherit" />}
              label={warningCount}
              size="small"
              color="warning"
              variant="outlined"
              aria-label={t('case.autoWarnings', { count: warningCount })}
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          {contactCount > 0 && (
            <Chip
              icon={<PhoneMissedIcon fontSize="inherit" />}
              label={contactCount}
              size="small"
              variant="outlined"
              aria-label={t('dashboard.contactCount', { count: contactCount })}
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          {labPendingCount > 0 && (
            <Chip
              icon={<BiotechIcon fontSize="inherit" />}
              label={labPendingCount}
              size="small"
              color="info"
              variant="outlined"
              aria-label={t('trigger.LAB_PENDING')}
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          {xrayPendingCount > 0 && (
            <Chip
              icon={<ImageIcon fontSize="inherit" />}
              label={xrayPendingCount}
              size="small"
              color="info"
              variant="outlined"
              aria-label={t('trigger.XRAY_PENDING')}
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          {waitingCases.length > 0 && (
            <Chip
              icon={<HourglassEmptyIcon fontSize="inherit" />}
              label={waitingCases.length}
              size="small"
              variant="outlined"
              color="default"
              aria-label={t('dashboard.waiting', { count: waitingCases.length })}
              sx={{ fontSize: 11, height: 22, opacity: 0.7 }}
            />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }} id={`queue-${category}-content`}>
        {/* Active case list */}
        <Box role="list" aria-label={`${categoryLabel} queue`}>
          {cases.length === 0 && waitingCases.length === 0 && closedCases.length === 0 ? (
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

        {/* Between-phase patients */}
        {waitingCases.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 0.75, bgcolor: 'action.hover' }}>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <HourglassEmptyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('dashboard.betweenPhase')} ({waitingCases.length})
                </Typography>
              </Stack>
            </Box>
            <Box
              role="list"
              aria-label={`${t('dashboard.betweenPhase')} – ${categoryLabel}`}
              sx={{ opacity: 0.65 }}
            >
              {waitingCases.map((c, idx) => (
                <CaseListItem
                  key={c.id}
                  caseData={c}
                  patient={patients.get(c.patientId)}
                  onRefresh={onRefresh}
                  {...getItemProps(cases.length + idx)}
                />
              ))}
            </Box>
          </>
        )}

        {/* Closed cases (last 7 days) */}
        {closedCases.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowClosed((v) => !v)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      fontSize: 16,
                      transition: 'transform 0.2s',
                      transform: showClosed ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                }
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 12,
                  p: 0,
                }}
              >
                {showClosed
                  ? t('dashboard.hideClosed')
                  : t('dashboard.showClosed', { count: closedCases.length })}
              </Button>
            </Box>
            {showClosed && (
              <Box
                role="list"
                aria-label={`${t('status.CLOSED')} – ${categoryLabel}`}
                sx={{ opacity: 0.65 }}
              >
                {[...closedCases]
                  .sort((a, b) => {
                    const aTs = new Date(a.closedAt ?? a.lastActivityAt).getTime()
                    const bTs = new Date(b.closedAt ?? b.lastActivityAt).getTime()
                    return bTs - aTs
                  })
                  .map((c, idx) => (
                    <CaseListItem
                      key={c.id}
                      caseData={c}
                      patient={patients.get(c.patientId)}
                      onRefresh={onRefresh}
                      {...getItemProps(cases.length + waitingCases.length + idx)}
                    />
                  ))}
              </Box>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
