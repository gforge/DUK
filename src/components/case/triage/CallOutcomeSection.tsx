import { Box } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CallOutcome } from '@/api/schemas'
import { tokens } from '@/theme'

import { ChoiceCard } from './ChoiceCard'
import { TriageSection } from './layout'

interface Props {
  readonly number: number
  readonly value: CallOutcome | null
  readonly onChange: (outcome: CallOutcome) => void
}

/** "Samtalsutfall": did the call get through? Reached is drawn green. */
export function CallOutcomeSection({ number, value, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <TriageSection
      number={number}
      title={t('triage.callOutcome.title')}
      required
      id="triage-outcome"
    >
      <Box
        role="radiogroup"
        aria-labelledby="triage-outcome"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 1.25,
        }}
      >
        <ChoiceCard
          name="triage-outcome"
          value="REACHED"
          checked={value === 'REACHED'}
          onSelect={() => onChange('REACHED')}
          label={t('triage.callOutcome.REACHED')}
          accent={tokens.successFg}
          accentBg={tokens.successBg}
        />
        <ChoiceCard
          name="triage-outcome"
          value="NOT_REACHED"
          checked={value === 'NOT_REACHED'}
          onSelect={() => onChange('NOT_REACHED')}
          label={t('triage.callOutcome.NOT_REACHED')}
        />
      </Box>
    </TriageSection>
  )
}
