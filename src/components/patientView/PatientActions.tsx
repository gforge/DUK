import React, { useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import { useTranslation } from 'react-i18next'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import type { Case } from '../../api/schemas'

interface Props {
  userId: string
  cases: Case[] | null
  onRefetch: () => void
}

export default function PatientActions({ userId, cases, onRefetch }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleOpenApp() {
    setLoading(true)
    try {
      await client.patientOpenedApp(userId)
      await onRefetch()
      showSnack(t('patient.appOpenedSuccess'), 'success')
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSeekContact() {
    if (!cases?.[0]) return
    setLoading(true)
    try {
      await client.seekContact(userId, cases[0].id)
      await onRefetch()
      showSnack(t('patient.contactRequested'), 'success')
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SmartphoneIcon />}
          onClick={handleOpenApp}
          disabled={loading}
        >
          {t('patient.openApp')}
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ContactPhoneIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={loading || !cases?.length}
        >
          {t('patient.seekContact')}
        </Button>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('patient.seekContactTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('patient.seekContactConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSeekContact}
            disabled={loading}
          >
            {t('patient.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
