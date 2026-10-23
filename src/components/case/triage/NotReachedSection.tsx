import { Box, Stack, TextField } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { NotReachedPlan } from '@/api/schemas'
import { OptionButton } from '@/components/common'
import { tokens } from '@/theme'

import { ChoiceCard } from './ChoiceCard'
import { TriageSection } from './layout'
import { type RetryPreset, retryPresetToIso } from './retryTime'
import { useDateLocale } from './useTriageDirectory'

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

interface Props {
  readonly number: number
  readonly value: NotReachedPlan | null
  readonly onChange: (plan: NotReachedPlan) => void
  /** CALL_AGAIN: the retry time, kept in the form's dueAtInput as ISO. */
  readonly retryAt: string
  readonly onRetryAtChange: (iso: string) => void
  readonly retryPreset: RetryPreset | null
  readonly setRetryPreset: (preset: RetryPreset) => void
}

/** "Hur går du vidare?" after a call that did not get through. */
export function NotReachedSection({
  number,
  value,
  onChange,
  retryAt,
  onRetryAtChange,
  retryPreset,
  setRetryPreset,
}: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  // Fixed when the section mounts: whether "today 17:00" is still ahead of us.
  const [{ todayLate, todayLateIsPast }] = React.useState(() => {
    const iso = retryPresetToIso('todayLate')
    return { todayLate: iso, todayLateIsPast: new Date(iso).getTime() < Date.now() }
  })

  return (
    <TriageSection number={number} title={t('triage.notReached.title')} required id="triage-plan">
      <Stack role="radiogroup" aria-labelledby="triage-plan" sx={{ gap: 1.25 }}>
        <ChoiceCard
          name="triage-plan"
          value="CALL_AGAIN"
          checked={value === 'CALL_AGAIN'}
          onSelect={() => onChange('CALL_AGAIN')}
          label={t('triage.notReached.CALL_AGAIN')}
          hint={t('triage.notReached.CALL_AGAIN_hint')}
        >
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.75 }}>
            <OptionButton
              variant="chip"
              selected={retryPreset === 'todayLate'}
              disabled={todayLateIsPast}
              onClick={() => {
                setRetryPreset('todayLate')
                onRetryAtChange(todayLate)
              }}
              label={t('triage.retry.todayLate')}
            />
            <OptionButton
              variant="chip"
              selected={retryPreset === 'tomorrowMorning'}
              onClick={() => {
                setRetryPreset('tomorrowMorning')
                onRetryAtChange(retryPresetToIso('tomorrowMorning'))
              }}
              label={t('triage.retry.tomorrowMorning')}
            />
            <OptionButton
              variant="chip"
              selected={retryPreset === 'custom'}
              onClick={() => setRetryPreset('custom')}
              label={
                retryPreset === 'custom' && retryAt
                  ? format(new Date(retryAt), 'd MMM HH:mm', { locale })
                  : t('triage.retry.custom')
              }
            />
          </Box>
          {retryPreset === 'custom' && (
            <TextField
              type="datetime-local"
              size="small"
              label={t('triage.retry.custom')}
              value={retryAt ? toLocalInput(retryAt) : ''}
              onChange={(e) => {
                const d = new Date(e.target.value)
                onRetryAtChange(Number.isNaN(d.getTime()) ? '' : d.toISOString())
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mt: 1, maxWidth: 260, bgcolor: tokens.paper }}
            />
          )}
        </ChoiceCard>
        <ChoiceCard
          name="triage-plan"
          value="ASK_PATIENT_TO_CALL"
          checked={value === 'ASK_PATIENT_TO_CALL'}
          onSelect={() => onChange('ASK_PATIENT_TO_CALL')}
          label={t('triage.notReached.ASK_PATIENT_TO_CALL')}
          hint={t('triage.notReached.ASK_PATIENT_TO_CALL_hint')}
        />
        <ChoiceCard
          name="triage-plan"
          value="HAND_OVER"
          checked={value === 'HAND_OVER'}
          onSelect={() => onChange('HAND_OVER')}
          label={t('triage.notReached.HAND_OVER')}
          hint={t('triage.notReached.HAND_OVER_hint')}
        />
      </Stack>
    </TriageSection>
  )
}
