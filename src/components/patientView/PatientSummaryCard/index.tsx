import { Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Patient } from '@/api/schemas'
import PersonalNumberCopy from '@/components/common/PersonalNumberCopy'

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
            <PersonalNumberCopy personalNumber={patient.personalNumber} labelFormat="long" />
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
