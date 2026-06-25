import BadgeIcon from '@mui/icons-material/Badge'
import { FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface PhysicianOption {
  id: string
  name: string
}

interface Props {
  patientResponsiblePhysicianUserId?: string
  physicianOptions: PhysicianOption[]
  onChange: (responsiblePhysicianUserId?: string) => void
}

export default function PatientResponsibilityCard({
  patientResponsiblePhysicianUserId,
  physicianOptions,
  onChange,
}: Props) {
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <BadgeIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patientDetail.responsiblePhysicianTitle')}
        </Typography>
      </Stack>

      <FormControl size="small" sx={{ minWidth: 320, maxWidth: '100%' }}>
        <InputLabel id="patient-responsible-physician-label">
          {t('patientDetail.patientResponsiblePhysician')}
        </InputLabel>
        <Select
          labelId="patient-responsible-physician-label"
          label={t('patientDetail.patientResponsiblePhysician')}
          value={patientResponsiblePhysicianUserId ?? ''}
          onChange={(e) => onChange(e.target.value ? String(e.target.value) : undefined)}
        >
          <MenuItem value="">
            <em>{t('common.notSet')}</em>
          </MenuItem>
          {physicianOptions.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  )
}
