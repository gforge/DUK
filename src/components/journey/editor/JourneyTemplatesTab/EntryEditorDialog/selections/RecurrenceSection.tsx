import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  recurringEnabled: boolean
  setRecurringEnabled: (value: boolean) => void
  recurrenceIntervalDays: number | ''
  setRecurrenceIntervalDays: (value: number | '') => void
}

export function RecurrenceSection({
  recurringEnabled,
  setRecurringEnabled,
  recurrenceIntervalDays,
  setRecurrenceIntervalDays,
}: Props) {
  const { t } = useTranslation()

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={recurringEnabled}
            onChange={(e) => setRecurringEnabled(e.target.checked)}
          />
        }
        label={t('journey.entry.recurring' as any) as string}
      />

      {recurringEnabled && (
        <TextField
          label={t('journey.entry.recurrenceIntervalDays' as any) as string}
          type="number"
          value={recurrenceIntervalDays}
          onChange={(e) =>
            setRecurrenceIntervalDays(e.target.value === '' ? '' : Number(e.target.value))
          }
          size="small"
          sx={{ width: 120 }}
        />
      )}
    </Box>
  )
}
