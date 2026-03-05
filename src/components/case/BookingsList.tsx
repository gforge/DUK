import React, { useState } from 'react'
import {
  Box,
  Stack,
  Typography,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslation } from 'react-i18next'
import type { Case, NextStep } from '@/api/schemas'
import * as client from '@/api/client'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'
import ConfirmDialog from '../common/ConfirmDialog'

interface Props {
  caseData: Case
  onChange?: () => void
}

export default function BookingsList({ caseData, onChange }: Props) {
  const { t } = useTranslation()
  const { currentUser } = useRole()
  const { showSnack } = useSnack()

  const [editing, setEditing] = useState<null | {
    id: string
    scheduledAt: string
    role?: string
    note?: string
  }>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  async function handleCancel(bookingId: string) {
    setCancelTarget(null)
    try {
      await client.cancelBooking(caseData.id, bookingId, currentUser.id, currentUser.role)
      showSnack(t('triage.bookingCancelSuccess'), 'success')
      onChange?.()
    } catch (err) {
      showSnack(String(err), 'error')
    }
  }

  function toGoogleCalendarLink(b: { scheduledAt: string; type: string; note?: string }) {
    const start = new Date(b.scheduledAt)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').split('.')[0] + 'Z'
    const text = encodeURIComponent(t(`nextStep.${b.type as NextStep}`) ?? b.type)
    const dates = `${fmt(start)}/${fmt(end)}`
    const details = encodeURIComponent(b.note ?? '')
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
  }

  function downloadICal(b: { id: string; scheduledAt: string; type: string; note?: string }) {
    const start = new Date(b.scheduledAt)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').split('.')[0] + 'Z'
    const uid = `${b.id}@duk.local`
    const summary = t(`nextStep.${b.type as NextStep}`) ?? b.type
    const description = b.note ?? ''
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//duk//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${b.id}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleSave() {
    if (!editing) return
    try {
      await client.updateBooking(
        caseData.id,
        editing.id,
        { scheduledAt: editing.scheduledAt, role: editing.role as any, note: editing.note },
        currentUser.id,
        currentUser.role,
      )
      showSnack(t('triage.bookingUpdated'), 'success')
      setEditing(null)
      onChange?.()
    } catch (err) {
      showSnack(String(err), 'error')
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('triage.bookings')}
      </Typography>
      <Stack gap={1}>
        {(caseData.bookings ?? []).map((b) => (
          <Paper key={b.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">
                {t(`nextStep.${b.type as NextStep}`) ?? b.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(b.scheduledAt).toLocaleString()} —{' '}
                {b.role ? t(`role.${b.role}`) : t('common.notSet')}
              </Typography>
              {b.note && (
                <Typography variant="caption" display="block">
                  {b.note}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={() =>
                setEditing({ id: b.id, scheduledAt: b.scheduledAt, role: b.role, note: b.note })
              }
              aria-label={t('common.edit')}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => downloadICal(b as any)}
              aria-label={t('triage.exportIcal')}
            >
              <EventAvailableIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              component="a"
              href={toGoogleCalendarLink(b as any)}
              target="_blank"
              rel="noreferrer"
              aria-label={t('triage.addToGoogle')}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setCancelTarget(b.id)}
              aria-label={t('common.delete')}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>{t('triage.editBooking')}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label={t('triage.bookingTime')}
              type="datetime-local"
              value={editing?.scheduledAt ?? ''}
              onChange={(e) => setEditing((s) => (s ? { ...s, scheduledAt: e.target.value } : s))}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <FormControl size="small">
              <InputLabel id="booking-role-label">{t('triage.assignRole')}</InputLabel>
              <Select
                labelId="booking-role-label"
                value={editing?.role ?? ''}
                onChange={(e) => setEditing((s) => (s ? { ...s, role: e.target.value } : s))}
                label={t('triage.assignRole')}
              >
                <MenuItem value="">
                  <em>{t('common.notSet')}</em>
                </MenuItem>
                <MenuItem value="NURSE">{t('role.NURSE')}</MenuItem>
                <MenuItem value="DOCTOR">{t('role.DOCTOR')}</MenuItem>
                <MenuItem value="PAL">{t('role.PAL')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('triage.bookingNote')}
              value={editing?.note ?? ''}
              onChange={(e) => setEditing((s) => (s ? { ...s, note: e.target.value } : s))}
              multiline
              minRows={2}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!cancelTarget}
        title={t('triage.bookingCancelTitle')}
        message={t('triage.bookingCancelConfirm')}
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />
    </Box>
  )
}
