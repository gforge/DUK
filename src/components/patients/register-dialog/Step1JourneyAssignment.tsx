import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate } from '@/api/schemas'

interface Props {
  journeyTemplateId: string
  setJourneyTemplateId: (v: string) => void
  startDate: string
  setStartDate: (v: string) => void
  journeyTemplates: JourneyTemplate[] | null
}

export function Step1JourneyAssignment({
  journeyTemplateId,
  setJourneyTemplateId,
  startDate,
  setStartDate,
  journeyTemplates,
}: Props) {
  const { t } = useTranslation()
  const selectedTemplate = journeyTemplates?.find((jt) => jt.id === journeyTemplateId)

  return (
    <Stack gap={2}>
      <FormControl size="small" fullWidth required>
        <InputLabel>{t('patients.register.selectTemplate')}</InputLabel>
        <Select
          value={journeyTemplateId}
          onChange={(e) => setJourneyTemplateId(e.target.value)}
          label={t('patients.register.selectTemplate')}
        >
          {journeyTemplates?.map((jt) => (
            <MenuItem key={jt.id} value={jt.id}>
              <Stack>
                <span>{jt.name}</span>
                {jt.description && (
                  <Typography variant="caption" color="text.secondary">
                    {jt.description}
                  </Typography>
                )}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label={selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate')}
        helperText={t('patients.register.referenceDateHint', {
          label: selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate'),
        })}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        size="small"
        type="date"
        fullWidth
        required
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  )
}
