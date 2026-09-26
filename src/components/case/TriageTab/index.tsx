import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import { Alert, Box, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { Case, ContactMode } from '@/api/schemas'
import ClinicalReviewPanel from '@/components/case/ClinicalReviewPanel'
import ColleagueReviews from '@/components/case/ColleagueReviews'
import {
  useAssigneeLabel,
  useCareRoleLabel,
  useContactModeLabel,
  useRoleLabel,
} from '@/hooks/labels'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'
import { tokens } from '@/theme'

import { AsideTitle, DecisionRows, TriageLayout } from '../triage/layout'
import { contactModeToRouteSegment } from '../triage/routeContactMode'
import { cardSx } from '../triage/styles'
import type { TriageSubmitData } from '../triage/TriageForm'
import TriageForm from '../triage/TriageForm'
import { useDateLocale, useTriageDirectory } from '../triage/useTriageDirectory'

interface TriageTabProps {
  readonly caseData: Case
  readonly onTriaged: () => void
  readonly routeContactMode: ContactMode | null
}

function NoteBlock({ label, text }: { readonly label: string; readonly text: string }) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>{label}</Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{text}</Typography>
    </Stack>
  )
}

/** Read-only decision summary for triaged cases, in the same look as the "Beslut" aside. */
function TriageDecisionSummary({ caseData, info }: { caseData: Case; info: string }) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const getContactModeLabel = useContactModeLabel()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssigneeLabel = useAssigneeLabel()
  const { users, teams } = useTriageDirectory()
  const td = caseData.triageDecision
  if (!td) return null
  const triagedBy = caseData.triagedByUserId
    ? users.find((u) => u.id === caseData.triagedByUserId)?.name
    : undefined
  return (
    <Stack sx={{ ...cardSx, p: 3, gap: 2 }}>
      <AsideTitle>{t('triage.decisionSummary')}</AsideTitle>
      <DecisionRows
        rows={[
          {
            key: 'mode',
            label: t('triage.contactModeLabel'),
            value: getContactModeLabel(td.contactMode),
          },
          {
            key: 'role',
            label: t('triage.careRole'),
            value: td.careRole ? getCareRoleLabel(td.careRole) : null,
          },
          {
            key: 'who',
            label: t('triage.responsible'),
            value: getAssigneeLabel(td, users, teams),
          },
          {
            key: 'due',
            label: t('triage.dueShort'),
            value: td.dueAt ? format(new Date(td.dueAt), 'd MMM yyyy', { locale }) : null,
          },
        ]}
      />
      {/* the internal note is shown in the case header; only repeat it when it differs */}
      {td.note && td.note !== caseData.internalNote && (
        <NoteBlock label={t('triage.note')} text={td.note} />
      )}
      {caseData.patientMessage && (
        <NoteBlock label={t('triage.patientMessage')} text={caseData.patientMessage} />
      )}
      <Stack
        direction="row"
        sx={{
          gap: 1,
          alignItems: 'center',
          bgcolor: tokens.successBg,
          color: tokens.successFg,
          borderRadius: 2,
          p: 1.5,
        }}
      >
        <CheckCircleOutlineIcon fontSize="small" />
        <Typography sx={{ fontSize: 14 }}>
          {info}
          {triagedBy && ` · ${triagedBy}`}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default function TriageTab({ caseData, onTriaged, routeContactMode }: TriageTabProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const getRoleLabel = useRoleLabel()
  const canTriage = isRole('NURSE', 'DOCTOR')
  const isOpen = caseData.status === 'NEW' || caseData.status === 'NEEDS_REVIEW'
  // determine if any lab/xray reviews are pending for this case
  const hasPendingReviews = React.useMemo(
    () => (caseData.reviews ?? []).some((r) => r.reviewedAt === null),
    [caseData.reviews],
  )
  async function onSubmit(data: TriageSubmitData) {
    try {
      await client.triageCase(caseData.id, data, currentUser.id, currentUser.role)
      showSnack(t('triage.success'), 'success')
      onTriaged()
    } catch (err) {
      console.error('Error triaging case:', err)
      showSnack(`${t('triage.error')}: ${String(err)}`, 'error')
    }
  }
  if (!canTriage) {
    return (
      <Alert severity="info">
        {t('role.currentRole')}: {getRoleLabel(currentUser.role)}. {t('triage.requiresClinician')}
      </Alert>
    )
  }

  const colleagueReviews = (divided: boolean) => (
    <ColleagueReviews
      caseData={caseData}
      onChange={onTriaged}
      canRequest={isOpen}
      divided={divided}
    />
  )

  if (isOpen) {
    return (
      <Stack sx={{ gap: 2.5 }}>
        <ClinicalReviewPanel caseData={caseData} onRefetch={onTriaged} />
        {hasPendingReviews ? (
          <TriageLayout
            main={<Alert severity="warning">{t('triage.pendingReviews')}</Alert>}
            aside={colleagueReviews(false)}
          />
        ) : (
          <TriageForm
            caseData={caseData}
            onSubmit={onSubmit}
            contactModeFromRoute={routeContactMode}
            onContactModeRouteChange={(mode) => {
              if (!mode) {
                navigate(`/cases/${caseData.id}`)
                return
              }
              navigate(`/cases/${caseData.id}/${contactModeToRouteSegment(mode)}`)
            }}
            asideFooter={colleagueReviews(true)}
          />
        )}
      </Stack>
    )
  }

  const hasColleagueReviews = (caseData.colleagueReviews ?? []).length > 0

  if (caseData.status === 'TRIAGED' || caseData.status === 'FOLLOWING_UP') {
    const info =
      caseData.status === 'TRIAGED'
        ? t('triage.handledInWorklist')
        : t('triage.followingUpInWorklist')
    const summary = <TriageDecisionSummary caseData={caseData} info={info} />
    if (!caseData.triageDecision) {
      return <Alert severity="info">{info}</Alert>
    }
    return hasColleagueReviews ? (
      <TriageLayout main={summary} aside={colleagueReviews(false)} />
    ) : (
      <Box sx={{ maxWidth: 720 }}>{summary}</Box>
    )
  }

  // CLOSED
  return (
    <Stack sx={{ gap: 2.5 }}>
      <Alert severity="success">{t('status.CLOSED')}</Alert>
      {hasColleagueReviews && <Box sx={{ ...cardSx, p: 2.5 }}>{colleagueReviews(false)}</Box>}
    </Stack>
  )
}
