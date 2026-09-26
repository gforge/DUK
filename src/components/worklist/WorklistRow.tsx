import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { Box, Button, Typography } from '@mui/material'
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import { enUS, sv } from 'date-fns/locale'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { CareTeam, Case, Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'
import { CareRoleIcon, GridTableRow, StatusChip } from '@/components/common'
import { useAssignmentModeLabel, useCareRoleLabel } from '@/hooks/labels'
import { getCompletedAt, getCompletedByUserId, resolveCaseCareRole } from '@/hooks/useWorklistQueue'
import { tokens } from '@/theme'

import CompletionDialog from './CompletionDialog'

export const WORKLIST_COLUMNS = 'minmax(170px,1.2fr) 150px 120px 150px minmax(200px,2fr) 210px'
export const WORKLIST_MIN_WIDTH = 1040

/** Due within this many days (or overdue) is shown as a clinical (amber) signal. */
const DUE_SOON_DAYS = 7
/** Overdue by at least this many days is shown in red. */
const LONG_OVERDUE_DAYS = 30

export type WorklistRowMode = 'active' | 'monitoring' | 'completed'

interface WorklistRowProps {
  caseData: Case
  patient: Patient | undefined
  mode: WorklistRowMode
  userMap: Map<string, string>
  teamMap: Map<string, CareTeam>
  highlighted?: boolean
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

function useRelativeDays() {
  const { t } = useTranslation()
  return (days: number): string => {
    if (days < 0) return t('deadline.overdueDays', { count: Math.abs(days) })
    if (days === 0) return t('deadline.today')
    if (days < 7) return t('deadline.inDays', { count: days })
    if (days < 28) return t('deadline.inWeeks', { count: Math.floor(days / 7) })
    return t('deadline.inMonths', { count: Math.floor(days / 30) })
  }
}

/** Recipient label + icon: claimed person, several named people, team(s), PAL or VSH. */
function useRecipient(
  caseData: Case,
  patient: Patient | undefined,
  userMap: Map<string, string>,
  teamMap: Map<string, CareTeam>,
): { label: string; title?: string; Icon: React.ElementType } {
  const getAssignmentModeLabel = useAssignmentModeLabel()
  const td = caseData.triageDecision
  if (caseData.assignedUserId) {
    return {
      label: userMap.get(caseData.assignedUserId) ?? caseData.assignedUserId,
      Icon: PersonIcon,
    }
  }
  if (td?.assignmentMode === 'TEAM' && td.assignedTeamIds?.length) {
    const names = td.assignedTeamIds.map((id) => teamMap.get(id)?.name ?? id).join(', ')
    return { label: names, Icon: PeopleIcon }
  }
  if (td?.assignedUserIds?.length) {
    const names = td.assignedUserIds.map((id) => userMap.get(id) ?? id).join(', ')
    return { label: names, Icon: td.assignedUserIds.length > 1 ? PeopleIcon : PersonIcon }
  }
  if (td?.assignmentMode === 'PAL') {
    const palName = patient?.palId ? userMap.get(patient.palId) : undefined
    return { label: getAssignmentModeLabel('PAL'), title: palName, Icon: MedicalServicesIcon }
  }
  return { label: getAssignmentModeLabel('ANY'), Icon: LocalHospitalIcon }
}

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

export default function WorklistRow({
  caseData,
  patient,
  mode,
  userMap,
  teamMap,
  highlighted = false,
  onClaim,
  onMarkDone,
}: WorklistRowProps) {
  const { t, i18n } = useTranslation()
  const getCareRoleLabel = useCareRoleLabel()
  const relativeDays = useRelativeDays()
  const navigate = useNavigate()
  const [completionDialogOpen, setCompletionDialogOpen] = React.useState(false)
  const [followUpDate, setFollowUpDate] = React.useState<Date | null>(null)
  const [completionComment, setCompletionComment] = React.useState('')
  const [isCompleting, setIsCompleting] = React.useState(false)
  const isCompleted = mode === 'completed'
  const isActive = caseData.status === 'TRIAGED' || caseData.status === 'FOLLOWING_UP'
  const careRole = resolveCaseCareRole(caseData)
  const recipient = useRecipient(caseData, patient, userMap, teamMap)
  const patientName = patient?.displayName ?? caseData.patientId
  const dateLocale = (i18n.resolvedLanguage ?? i18n.language ?? 'sv').startsWith('en') ? enUS : sv
  const formatDate = (iso: string) => format(parseISO(iso), 'd MMM yyyy', { locale: dateLocale })

  const completionBooking = React.useMemo(() => {
    const bookings = [...(caseData.bookings ?? [])].reverse()
    return (
      bookings.find((booking) => booking.status === 'SCHEDULED') ??
      bookings.find((booking) => booking.status === 'PENDING') ??
      bookings.find((booking) => booking.status !== 'CANCELLED')
    )
  }, [caseData.bookings])

  function handleDone() {
    setIsCompleting(true)
    setTimeout(() => {
      void onMarkDone(caseData.id, {
        bookingId: completionBooking?.id,
        followUpDate: followUpDate ? followUpDate.toISOString() : undefined,
        completionComment: completionComment.trim() ? completionComment.trim() : undefined,
      })
      setCompletionDialogOpen(false)
      setFollowUpDate(null)
      setCompletionComment('')
    }, 220)
  }

  function renderDateCell() {
    if (isCompleted) {
      const completedAt = getCompletedAt(caseData)
      const completedById = getCompletedByUserId(caseData) ?? caseData.assignedUserId
      const completedBy = completedById ? (userMap.get(completedById) ?? completedById) : undefined
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', color: tokens.text2 }}>
          <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit' }}>
            {completedAt ? formatDate(completedAt) : '–'}
          </Typography>
          {completedBy && (
            <Typography component="span" sx={{ fontSize: 12, color: tokens.textSecondary }}>
              {t('worklist.completedBy', { name: completedBy })}
            </Typography>
          )}
        </Box>
      )
    }
    if (!caseData.deadline) {
      return (
        <Typography component="span" sx={{ fontSize: 12, color: tokens.textMuted }}>
          {t('worklist.noDeadline')}
        </Typography>
      )
    }
    const days = differenceInCalendarDays(
      startOfDay(parseISO(caseData.deadline)),
      startOfDay(new Date()),
    )
    const soon = days <= DUE_SOON_DAYS
    const longOverdue = days <= -LONG_OVERDUE_DAYS
    const color = longOverdue ? tokens.danger : soon ? tokens.clinicalFg : tokens.text2
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', color }}>
        <Box
          component="span"
          sx={{ fontWeight: soon ? 600 : 500, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {soon && <ScheduleIcon sx={{ fontSize: 14 }} />}
          {formatDate(caseData.deadline)}
        </Box>
        <Box component="span" sx={{ fontSize: 12, color: soon ? color : tokens.textSecondary }}>
          {relativeDays(days)}
        </Box>
      </Box>
    )
  }

  const RecipientIcon = recipient.Icon

  return (
    <GridTableRow
      columns={WORKLIST_COLUMNS}
      minWidth={WORKLIST_MIN_WIDTH}
      onClick={() => navigate(`/cases/${caseData.id}`)}
      aria-label={t('worklist.openCaseFor', { name: patientName })}
      sx={{
        boxShadow: highlighted ? `inset 2px 0 0 ${tokens.primary}` : 'none',
        transition:
          'background-color 220ms ease-in-out, transform 220ms ease-in, opacity 220ms ease-in',
        transform: isCompleting ? 'translateX(16px)' : 'translateX(0)',
        opacity: isCompleting ? 0.12 : 1,
      }}
    >
      {/* Patient */}
      <Box role="cell" sx={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit' }} noWrap>
            {patientName}
          </Typography>
          {caseData.status === 'FOLLOWING_UP' && (
            <StatusChip status={caseData.status} size="small" />
          )}
        </Box>
        {patient?.personalNumber && (
          <Typography component="span" sx={{ fontSize: 12, color: tokens.textSecondary }}>
            {formatPersonnummer(patient.personalNumber)}
          </Typography>
        )}
      </Box>

      {/* Kompetens */}
      <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        {careRole ? (
          <>
            <Box
              component="span"
              sx={{ display: 'inline-flex', color: tokens.textSecondary, fontSize: 16 }}
            >
              <CareRoleIcon role={careRole} fontSize="inherit" />
            </Box>
            {getCareRoleLabel(careRole)}
          </>
        ) : (
          <Typography component="span" sx={{ color: tokens.textMuted }}>
            –
          </Typography>
        )}
      </Box>

      {/* Mottagare */}
      <Box
        role="cell"
        title={recipient.title ?? recipient.label}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: tokens.text2, minWidth: 0 }}
      >
        <RecipientIcon sx={{ fontSize: 16, color: tokens.textSecondary, flexShrink: 0 }} />
        <Box
          component="span"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {recipient.label}
        </Box>
      </Box>

      {/* Förfaller / Avklarad */}
      <Box role="cell">{renderDateCell()}</Box>

      {/* Anteckning */}
      <Box
        role="cell"
        sx={{
          color: tokens.text2,
          fontSize: 13,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {caseData.internalNote}
      </Box>

      {/* Actions – events stop here so buttons and the dialog don't open the case */}
      <Box
        role="cell"
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
        sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', alignItems: 'center' }}
      >
        {isCompleted ? (
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: tokens.successFg,
              fontWeight: 500,
            }}
          >
            <TaskAltIcon sx={{ fontSize: 16 }} />
            {t('worklist.completedStatus')}
          </Box>
        ) : (
          isActive && (
            <>
              {!caseData.assignedUserId && (
                <Button
                  size="small"
                  startIcon={<PersonAddAltIcon />}
                  onClick={() => onClaim(caseData.id)}
                  sx={{
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    px: 1.25,
                    '& .MuiButton-startIcon': { mr: 0.5, '& svg': { fontSize: 16 } },
                  }}
                >
                  {t('worklist.claim')}
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<PlayArrowIcon />}
                onClick={() => setCompletionDialogOpen(true)}
                disabled={isCompleting}
                sx={{
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  px: 1.5,
                  '& .MuiButton-startIcon': { mr: 0.5, '& svg': { fontSize: 16 } },
                }}
              >
                {t('worklist.initiate')}
              </Button>
            </>
          )
        )}

        <CompletionDialog
          open={completionDialogOpen}
          patientLabel={patientName}
          personalNumber={patient?.personalNumber ?? null}
          followUpDate={followUpDate}
          completionComment={completionComment}
          isCompleting={isCompleting}
          requireFollowUpDate={caseData.triageDecision?.contactMode === 'VISIT'}
          onClose={() => setCompletionDialogOpen(false)}
          onFollowUpDateChange={setFollowUpDate}
          onCompletionCommentChange={setCompletionComment}
          onConfirm={handleDone}
        />
      </Box>
    </GridTableRow>
  )
}
