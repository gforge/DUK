import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Case, Patient } from '@/api/schemas'
import { CareRoleIcon, DeadlineLabel, StatusChip } from '@/components/common'
import { useAssignmentModeLabel, useCareRoleLabel } from '@/hooks/labels'

import CompletionDialog from './CompletionDialog'

interface WorklistRowProps {
  caseData: Case
  patient: Patient | undefined
  assignedUserName?: string
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

export default function WorklistRow({
  caseData,
  patient,
  assignedUserName,
  highlighted = false,
  onClaim,
  onMarkDone,
}: WorklistRowProps) {
  const { t } = useTranslation()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssignmentModeLabel = useAssignmentModeLabel()
  const navigate = useNavigate()
  const [completionDialogOpen, setCompletionDialogOpen] = React.useState(false)
  const [followUpDate, setFollowUpDate] = React.useState<Date | null>(null)
  const [completionComment, setCompletionComment] = React.useState('')
  const [isCompleting, setIsCompleting] = React.useState(false)

  const isTriaged = caseData.status === 'TRIAGED'
  const isFollowingUp = caseData.status === 'FOLLOWING_UP'
  const careRole = caseData.triageDecision?.careRole

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

  return (
    <Box
      sx={{
        px: 2,
        py: 0.875,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '2fr 1.5fr 1fr auto' },
        gap: 0.75,
        alignItems: 'center',
        borderLeft: (theme) =>
          highlighted
            ? `2px solid ${alpha(theme.palette.primary.main, 0.4)}`
            : '2px solid transparent',
        transition:
          'background-color 220ms ease-in-out, transform 220ms ease-in, opacity 220ms ease-in',
        transform: isCompleting ? 'translateX(16px)' : 'translateX(0)',
        opacity: isCompleting ? 0.12 : 1,
        '&:hover': {
          bgcolor: (theme) =>
            highlighted ? alpha(theme.palette.primary.main, 0.03) : theme.palette.action.hover,
        },
      }}
    >
      {/* Patient + status */}
      <Stack gap={0.25}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
          {patient?.displayName ?? caseData.patientId}
        </Typography>
        <Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap">
          {caseData.status !== 'TRIAGED' && <StatusChip status={caseData.status} size="small" />}
          {careRole && (
            <Chip
              icon={<CareRoleIcon role={careRole} />}
              label={getCareRoleLabel(careRole)}
              size="small"
              sx={{ height: 18, fontSize: 11, color: 'text.secondary' }}
            />
          )}
          {caseData.triageDecision?.assignmentMode && (
            <Tooltip
              title={
                caseData.triageDecision.assignmentMode === 'ANY'
                  ? t('worklist.assignmentModeAnyTooltip', { defaultValue: 'Vem som helst' })
                  : ''
              }
            >
              <Chip
                label={getAssignmentModeLabel(caseData.triageDecision.assignmentMode)}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: 11, color: 'text.secondary' }}
              />
            </Tooltip>
          )}
          {assignedUserName && (
            <Chip
              label={`${t('case.assignedTo')}: ${assignedUserName}`}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: 11, color: 'text.secondary' }}
            />
          )}
        </Stack>
      </Stack>

      {/* Deadline */}
      <Box>
        {caseData.deadline ? (
          <DeadlineLabel deadline={caseData.deadline} tone="queue" />
        ) : (
          <Typography variant="caption" color="text.disabled">
            {t('worklist.noDeadline')}
          </Typography>
        )}
      </Box>

      {/* Internal note excerpt */}
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        {caseData.internalNote ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {caseData.internalNote}
          </Typography>
        ) : null}
      </Box>

      {/* Actions */}
      <Stack direction="row" gap={0.5} justifyContent="flex-end" alignItems="center">
        {/* Primary actions */}
        {(isTriaged || isFollowingUp) && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => setCompletionDialogOpen(true)}
            disabled={isCompleting}
            sx={{ fontSize: 12, whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            {t('worklist.initiate')}
          </Button>
        )}

        {/* Secondary action */}
        {!caseData.assignedUserId && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AssignmentIndIcon />}
            onClick={() => onClaim(caseData.id)}
            sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {t('worklist.claim')}
          </Button>
        )}

        {/* Tertiary action */}
        <Tooltip title={t('worklist.openCase')}>
          <IconButton size="small" onClick={() => navigate(`/cases/${caseData.id}`)}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <CompletionDialog
        open={completionDialogOpen}
        patientLabel={patient?.displayName ?? caseData.patientId}
        personalNumber={patient?.personalNumber ?? null}
        followUpDate={followUpDate}
        completionComment={completionComment}
        isCompleting={isCompleting}
        onClose={() => setCompletionDialogOpen(false)}
        onFollowUpDateChange={setFollowUpDate}
        onCompletionCommentChange={setCompletionComment}
        onConfirm={handleDone}
      />
    </Box>
  )
}
