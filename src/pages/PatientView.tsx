import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useRole } from '../store/roleContext'
import { useSnack } from '../store/snackContext'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import * as client from '../api/client'
import StatusChip from '../components/common/StatusChip'

export default function PatientView() {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const navigate = useNavigate()
  const [openConfirm, setOpenConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!isRole('PATIENT')) navigate('/dashboard', { replace: true })
  }, [isRole, navigate])

  const {
    data: cases,
    loading,
    error,
    refetch,
  } = useApi(() => client.getCasesByPatient(currentUser.id), [currentUser.id])

  const { data: patient, loading: patientLoading } = useApi(
    () => client.getPatient(currentUser.id),
    [currentUser.id],
  )

  if (!isRole('PATIENT')) return null

  async function handleOpenApp() {
    setActionLoading(true)
    try {
      await client.patientOpenedApp(currentUser.id)
      await refetch()
      showSnack(t('patient.appOpenedSuccess'), 'success')
    } catch (e) {
      showSnack(t('common.error'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSeekContact() {
    if (!cases?.[0]) return
    setActionLoading(true)
    try {
      await client.seekContact(currentUser.id, cases[0].id)
      await refetch()
      showSnack(t('patient.contactRequested'), 'success')
    } catch (e) {
      showSnack(t('common.error'), 'error')
    } finally {
      setActionLoading(false)
      setOpenConfirm(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('patient.myPage')}
      </Typography>

      {/* Patient summary */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          {patientLoading ? (
            <CircularProgress size={24} />
          ) : patient ? (
            <Stack spacing={1}>
              <Typography variant="h6">{patient.displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('patient.personalNumber')}: {patient.personalNumber}
              </Typography>
              {patient.lastOpenedAt && (
                <Typography variant="body2" color="text.secondary">
                  {t('patient.lastOpened')}:{' '}
                  {format(new Date(patient.lastOpenedAt), 'dd MMM yyyy HH:mm')}
                </Typography>
              )}
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<SmartphoneIcon />}
          onClick={handleOpenApp}
          disabled={actionLoading}
        >
          {t('patient.openApp')}
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ContactPhoneIcon />}
          onClick={() => setOpenConfirm(true)}
          disabled={actionLoading || !cases?.length}
        >
          {t('patient.seekContact')}
        </Button>
      </Stack>

      {/* Cases */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('patient.myCases')}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !cases?.length ? (
        <Alert severity="info">{t('patient.noCases')}</Alert>
      ) : (
        <Stack spacing={1}>
          {cases.map((c) => (
            <Accordion key={c.id} variant="outlined" disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                  <StatusChip status={c.status} />
                  <Chip label={t(`category.${c.category}`)} size="small" variant="outlined" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', pr: 1 }}>
                    {format(new Date(c.createdAt), 'dd MMM yyyy')}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={1}>
                  {c.triggers.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('patient.triggers')}:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {c.triggers.map((tr) => (
                          <Chip
                            key={tr}
                            label={t(`trigger.${tr}`)}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {c.patientMessage && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('patient.messageFromCare')}:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {c.patientMessage}
                      </Typography>
                    </Box>
                  )}
                  {!c.patientMessage && (
                    <Typography variant="body2" color="text.secondary">
                      {t('patient.noMessage')}
                    </Typography>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Seek contact confirmation */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{t('patient.seekContactTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('patient.seekContactConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSeekContact}
            disabled={actionLoading}
          >
            {t('patient.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
