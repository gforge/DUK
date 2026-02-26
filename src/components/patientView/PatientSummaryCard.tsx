import React from 'react'
import { Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import type { Patient } from '../../api/schemas'

interface Props {
  patient: Patient | null | undefined
  loading: boolean
}

export default function PatientSummaryCard({ patient, loading }: Props) {
  const { t } = useTranslation()

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        {loading ? (
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
  )
}
