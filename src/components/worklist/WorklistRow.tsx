import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Case, NextStep, Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'
import { DeadlineLabel, StatusChip } from '@/components/common'
import { useRoleLabel } from '@/hooks/labels'

/** Steps that require scheduling an appointment */
const BOOKABLE_STEPS: NextStep[] = ['DOCTOR_VISIT', 'NURSE_VISIT', 'PHYSIO_VISIT', 'PHONE_CALL']

interface WorklistRowProps {
  caseData: Case
  patient: Patient | undefined
  onBook: (caseId: string, scheduledAt?: string) => void
  onMarkInProgress: (caseId: string) => void
  onMarkDone: (caseId: string) => void
}

export default function WorklistRow({
  caseData,
  patient,
  onBook,
  onMarkInProgress,
  onMarkDone,
}: WorklistRowProps) {
  const { t } = useTranslation()
  const getRoleLabel = useRoleLabel()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [scheduledAt, setScheduledAt] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  const isBookable = caseData.nextStep ? BOOKABLE_STEPS.includes(caseData.nextStep) : false
  const isTriaged = caseData.status === 'TRIAGED'
  const isFollowingUp = caseData.status === 'FOLLOWING_UP'

  function handleCopyPnr() {
    if (patient?.personalNumber) {
      navigator.clipboard.writeText(patient.personalNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleConfirmBooking() {
    const iso = scheduledAt ? new Date(scheduledAt).toISOString() : undefined
    onBook(caseData.id, iso)
    setDialogOpen(false)
    setScheduledAt('')
  }

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '2fr 1.5fr 1fr auto' },
        gap: 1,
        alignItems: 'center',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Patient + status */}
      <Stack gap={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {patient?.displayName ?? caseData.patientId}
        </Typography>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <StatusChip status={caseData.status} size="small" />
          {caseData.assignedRole && (
            <Chip
              label={getRoleLabel(caseData.assignedRole)}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
        </Stack>
      </Stack>

      {/* Deadline */}
      <Box>
        {caseData.deadline ? (
          <DeadlineLabel deadline={caseData.deadline} />
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
        {/* TRIAGED + bookable → Boka dialog */}
        {isTriaged && isBookable && (
          <Button
            size="small"
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {t('worklist.book')}
          </Button>
        )}

        {/* TRIAGED + non-bookable (DIGITAL_CONTROL) → Påbörja → FOLLOWING_UP */}
        {isTriaged && !isBookable && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => onMarkInProgress(caseData.id)}
            sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {t('worklist.markInProgress')}
          </Button>
        )}

        {/* FOLLOWING_UP → Avklarad → CLOSED */}
        {isFollowingUp && (
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => onMarkDone(caseData.id)}
            sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {t('worklist.markDone')}
          </Button>
        )}

        <Tooltip title={t('worklist.openCase')}>
          <IconButton size="small" onClick={() => navigate(`/cases/${caseData.id}`)}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Booking dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {t('worklist.bookDialogTitle', { name: patient?.displayName ?? caseData.patientId })}
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            {patient?.personalNumber && (
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                  {t('worklist.pnr')}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                  {formatPersonnummer(patient.personalNumber)}
                </Typography>
                <Tooltip title={copied ? t('worklist.copiedPnr') : t('worklist.copyPnr')}>
                  <IconButton size="small" onClick={handleCopyPnr}>
                    <ContentCopyIcon fontSize="small" color={copied ? 'success' : 'inherit'} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
            {caseData.internalNote && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {caseData.internalNote}
              </Typography>
            )}
            <TextField
              label={t('worklist.scheduledAt')}
              type="datetime-local"
              size="small"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleConfirmBooking}>
            {t('worklist.confirmBooking')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
