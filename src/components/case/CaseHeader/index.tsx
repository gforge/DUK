import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { differenceInDays, differenceInYears, format, parseISO } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Case, Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'
import { useDateLocale, useTriageDirectory } from '@/components/case/triage/useTriageDirectory'
import { StatusChip, Tag, TriggerChips } from '@/components/common'
import { useAssigneeLabel, useCareRoleLabel, useCategoryLabel, useRoleLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

interface Props {
  readonly caseData: Case
  readonly patient: Patient | null | undefined
}

const OVERDUE_DAYS = 30

function MetaCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontWeight: 600, color: color ?? tokens.text }}>{value}</Typography>
    </Box>
  )
}

/** Case header card: patient, status, key facts, signals, auto-warnings and the internal note. */
export default function CaseHeader({ caseData, patient }: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const getCategoryLabel = useCategoryLabel()
  const getCareRoleLabel = useCareRoleLabel()
  const getRoleLabel = useRoleLabel()
  const getAssigneeLabel = useAssigneeLabel()
  const { users, teams } = useTriageDirectory()
  const [warningsOpen, setWarningsOpen] = React.useState(false)
  const [now] = React.useState(() => new Date())

  const td = caseData.triageDecision
  const assignee = (() => {
    if (td && td.contactMode !== 'CLOSE') {
      const who = getAssigneeLabel(td, users, teams)
      const role = td.careRole ? getCareRoleLabel(td.careRole) : null
      const text = [who, role].filter(Boolean).join(' · ')
      if (text) return text
    }
    if (caseData.assignedRole) return getRoleLabel(caseData.assignedRole)
    return t('common.notSet')
  })()

  const waitedDays = Math.max(0, differenceInDays(now, parseISO(caseData.scheduledAt)))
  const age = patient ? differenceInYears(now, parseISO(patient.dateOfBirth)) : null
  const facts = patient
    ? [
        formatPersonnummer(patient.personalNumber),
        age !== null && !Number.isNaN(age) ? t('case.ageYears', { count: age }) : null,
        patient.lastOpenedAt
          ? t('case.headerLastOpened', {
              date: format(parseISO(patient.lastOpenedAt), 'd MMM yyyy HH:mm', { locale }),
            })
          : null,
      ].filter(Boolean)
    : []
  const warnings = caseData.policyWarnings
  const hasSignals = caseData.triggers.length > 0 || warnings.length > 0

  return (
    <Stack
      component="section"
      aria-label={patient?.displayName ?? t('case.title')}
      sx={{
        bgcolor: tokens.paper,
        border: `1px solid ${tokens.border}`,
        borderRadius: '12px',
        p: 2.5,
        gap: 1.75,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 240 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography component="h1" sx={{ m: 0, fontSize: 22, fontWeight: 700 }}>
              {patient?.displayName ?? caseData.patientId}
            </Typography>
            <StatusChip status={caseData.status} />
          </Box>
          {facts.length > 0 && (
            <Typography sx={{ color: tokens.text2 }}>{facts.join(' · ')}</Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            columnGap: 4,
            rowGap: 0.5,
          }}
        >
          <MetaCell label={t('case.category')} value={getCategoryLabel(caseData.category)} />
          <MetaCell label={t('case.assignedTo')} value={assignee} />
          <MetaCell
            label={t('case.waited')}
            value={t('case.waitedDays', { count: waitedDays })}
            color={waitedDays >= OVERDUE_DAYS ? tokens.danger : undefined}
          />
        </Box>
      </Box>

      {hasSignals && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <TriggerChips
            triggers={caseData.triggers}
            maxVisible={Math.max(caseData.triggers.length, 1)}
          />
          {warnings.length > 0 && (
            <ButtonBase
              onClick={() => setWarningsOpen((o) => !o)}
              aria-expanded={warningsOpen}
              aria-controls="case-warnings-panel"
              sx={{
                borderRadius: 1.5,
                '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 2 },
              }}
            >
              <Tag
                variant="warning"
                icon={<WarningAmberIcon fontSize="inherit" />}
                label={`${t('case.autoWarnings', { count: warnings.length })} ${warningsOpen ? '▴' : '▾'}`}
              />
            </ButtonBase>
          )}
        </Box>
      )}

      {warningsOpen && warnings.length > 0 && (
        <Stack
          id="case-warnings-panel"
          sx={{
            gap: 0.75,
            bgcolor: tokens.warningPanelBg,
            border: `1px solid ${tokens.warningBg}`,
            borderRadius: 2,
            px: 1.75,
            py: 1.5,
            color: tokens.text2,
          }}
        >
          {warnings.map((w) => {
            const values = Object.entries(w.triggeredValues)
              .map(([k, v]) => `${k} = ${v}`)
              .join(', ')
            return (
              <Box key={w.ruleId}>
                <Box component="strong" sx={{ fontWeight: 600 }}>
                  {w.ruleName}
                </Box>
                {' — '}
                {values && `${values} · `}
                <Box component="code" sx={{ fontSize: 12, color: tokens.textSecondary }}>
                  {w.expression}
                </Box>
              </Box>
            )
          })}
        </Stack>
      )}

      {caseData.internalNote && (
        <Stack sx={{ borderTop: `1px solid ${tokens.rowDivider}`, pt: 1.5, gap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
            {t('case.internalNote')}
          </Typography>
          <Typography sx={{ maxWidth: '75ch', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {caseData.internalNote}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
