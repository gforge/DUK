import ScienceIcon from '@mui/icons-material/Science'
import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, ResearchModule, TransitionTriggerType } from '@/api/schemas'
import TriggerEventSelect from '@/components/journey/TriggerEventSelect'
interface Props {
  readonly journeyTemplateId: string
  readonly eventType: TransitionTriggerType | ''
  readonly startDate: string
  readonly selectedModuleIds: string[]
  readonly journeyTemplates: JourneyTemplate[] | undefined
  readonly researchModules: ResearchModule[] | undefined
  readonly onTemplateChange: (id: string) => void
  readonly onEventTypeChange: (type: TransitionTriggerType | '') => void
  readonly onDateChange: (date: string) => void
  readonly onModulesChange: (ids: string[]) => void
}
export default function WizardStep0({
  journeyTemplateId,
  eventType,
  startDate,
  selectedModuleIds,
  journeyTemplates,
  researchModules,
  onTemplateChange,
  onEventTypeChange,
  onDateChange,
  onModulesChange,
}: Props) {
  const { t } = useTranslation()
  const selectedTemplate = journeyTemplates?.find((jt) => jt.id === journeyTemplateId)
  const handleModuleToggle = (id: string, checked: boolean) => {
    onModulesChange(
      checked ? [...selectedModuleIds, id] : selectedModuleIds.filter((m) => m !== id),
    )
  }
  return (
    <Stack sx={{ gap: 2 }}>
      <FormControl size="small" fullWidth required>
        <InputLabel>{t('patients.register.selectTemplate')}</InputLabel>
        <Select
          value={journeyTemplateId}
          onChange={(e) => onTemplateChange(e.target.value)}
          label={t('patients.register.selectTemplate')}
        >
          {journeyTemplates?.map((jt) => (
            <MenuItem key={jt.id} value={jt.id}>
              {jt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TriggerEventSelect
        label={t('patients.register.eventType')}
        helperText={t('patients.register.eventTypeHint')}
        value={eventType}
        onChange={onEventTypeChange}
        required
      />
      <TextField
        label={selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate')}
        helperText={t('patients.register.referenceDateHint', {
          label: selectedTemplate?.referenceDateLabel ?? t('patients.register.referenceDate'),
        })}
        value={startDate}
        onChange={(e) => onDateChange(e.target.value)}
        size="small"
        type="date"
        fullWidth
        required
        slotProps={{ inputLabel: { shrink: true } }}
      />
      {researchModules && researchModules.length > 0 && (
        <>
          <Divider />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('patients.register.stepStudies')}
          </Typography>
          <FormGroup>
            {researchModules.map((rm) => (
              <FormControlLabel
                key={rm.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedModuleIds.includes(rm.id)}
                    onChange={(e) => handleModuleToggle(rm.id, e.target.checked)}
                  />
                }
                label={
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                    <ScienceIcon color="secondary" fontSize="small" />
                    <Typography variant="body2">{rm.studyName}</Typography>
                  </Stack>
                }
              />
            ))}
          </FormGroup>
        </>
      )}
    </Stack>
  )
}
