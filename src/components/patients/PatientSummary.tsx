import PersonIcon from '@mui/icons-material/Person'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'

interface PatientSummaryProps {
  patient: Patient
}

export default function PatientSummary({ patient }: PatientSummaryProps) {
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
        <PersonIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          {patient.displayName}
        </Typography>
      </Stack>
      <Stack direction="row" gap={4} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">
            {t('patients.personalNumber')}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatPersonnummer(patient.personalNumber)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {t('patients.dateOfBirth')}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {patient.dateOfBirth}
          </Typography>
        </Box>
        {patient.lastOpenedAt && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('patient.lastOpened')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {format(new Date(patient.lastOpenedAt), 'dd MMM yyyy HH:mm')}
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">
            {t('patientDetail.registered')}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {format(new Date(patient.createdAt), 'dd MMM yyyy')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
