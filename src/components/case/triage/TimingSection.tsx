import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import SendIcon from '@mui/icons-material/Send'
import { Box } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ContactMode } from '@/api/schemas'

import { ChoiceCard } from './ChoiceCard'
import { TriageSection } from './layout'

interface Props {
  readonly number: number
  readonly contactMode: Extract<ContactMode, 'DIGITAL' | 'PHONE'>
  readonly handledNow: boolean
  readonly onChange: (handledNow: boolean) => void
}

/** Step 2 "När och av vem?": do it now yourself, or plan a task for someone. */
export function TimingSection({ number, contactMode, handledNow, onChange }: Props) {
  const { t } = useTranslation()
  const isPhone = contactMode === 'PHONE'
  return (
    <TriageSection number={number} title={t('triage.timing.title')} required id="triage-timing">
      <Box
        role="radiogroup"
        aria-labelledby="triage-timing"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 1.25,
        }}
      >
        <ChoiceCard
          name="triage-timing"
          value="now"
          checked={handledNow}
          onSelect={() => onChange(true)}
          icon={
            isPhone ? (
              <PhoneInTalkIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <SendIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            )
          }
          label={t(isPhone ? 'triage.timing.callNow' : 'triage.timing.replyNow')}
          hint={t(isPhone ? 'triage.timing.callNowHint' : 'triage.timing.replyNowHint')}
        />
        <ChoiceCard
          name="triage-timing"
          value="plan"
          checked={!handledNow}
          onSelect={() => onChange(false)}
          icon={<ListAltOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
          label={t(isPhone ? 'triage.timing.planCall' : 'triage.timing.planDigital')}
          hint={t(isPhone ? 'triage.timing.planCallHint' : 'triage.timing.planDigitalHint')}
        />
      </Box>
    </TriageSection>
  )
}
