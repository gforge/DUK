import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { DashboardCategory } from '../types'

interface Props {
  label: string
  setLabel: (value: string) => void
  stepKey: string
  setStepKey: (value: string) => void
  stepKeyLocked: boolean
  setStepKeyLocked: (value: boolean) => void
  offsetDays: number | ''
  setOffsetDays: (value: number | '') => void
  windowDays: number | ''
  setWindowDays: (value: number | '') => void
  windowDaysManuallySet: boolean
  setWindowDaysManuallySet: (value: boolean) => void
  dashboardCategory: string
  setDashboardCategory: (value: string) => void
  slugify: (value: string) => string
  suggestWindowDays: (offsetDays: number) => number
}

const dashboardCategories: DashboardCategory[] = ['CONTROL', 'ACUTE', 'SUBACUTE']

export function BasicFieldsSection({
  label,
  setLabel,
  stepKey,
  setStepKey,
  stepKeyLocked,
  setStepKeyLocked,
  offsetDays,
  setOffsetDays,
  windowDays,
  setWindowDays,
  windowDaysManuallySet,
  setWindowDaysManuallySet,
  dashboardCategory,
  setDashboardCategory,
  slugify,
  suggestWindowDays,
}: Props) {
  const { t } = useTranslation()

  const handleLabelChange = (value: string) => {
    setLabel(value)

    if (!stepKeyLocked) {
      setStepKey(slugify(value))
    }
  }

  const handleOffsetDaysChange = (raw: string) => {
    const value = raw === '' ? '' : Number(raw)
    setOffsetDays(value)

    if (!windowDaysManuallySet && value !== '') {
      setWindowDays(suggestWindowDays(value))
    }
  }

  const handleWindowDaysChange = (raw: string) => {
    const value = raw === '' ? '' : Number(raw)
    setWindowDays(value)
    setWindowDaysManuallySet(true)
  }

  const handleStepKeyChange = (value: string) => {
    setStepKey(value)
    setStepKeyLocked(true)
  }

  return (
    <Stack direction="row" gap={2}>
      <TextField
        label={t('journey.entry.label')}
        value={label}
        onChange={(e) => handleLabelChange(e.target.value)}
        size="small"
        fullWidth
        required
        autoFocus
      />

      <TextField
        label={t('journey.entry.offsetDays')}
        type="number"
        value={offsetDays}
        onChange={(e) => handleOffsetDaysChange(e.target.value)}
        size="small"
        sx={{ width: 120 }}
        required
      />

      <TextField
        label={t('journey.entry.windowDays')}
        type="number"
        value={windowDays}
        onChange={(e) => handleWindowDaysChange(e.target.value)}
        size="small"
        sx={{ width: 120 }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('journey.entry.dashboardCategory')}</InputLabel>
        <Select
          value={dashboardCategory}
          label={t('journey.entry.dashboardCategory')}
          onChange={(e) => setDashboardCategory(e.target.value)}
        >
          {dashboardCategories.map((category) => (
            <MenuItem key={category} value={category}>
              {t(`dashboardCategory.${category}` as any) as string}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label={t('journey.entry.stepKey')}
        value={stepKey}
        onChange={(e) => handleStepKeyChange(e.target.value)}
        size="small"
        sx={{ minWidth: 180 }}
        helperText={t('journey.entry.stepKeyHint')}
        placeholder={t('journey.entry.stepKeyPlaceholder')}
      />
    </Stack>
  )
}
