import { Box, ButtonBase, Link, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ContactMode } from '@/api/schemas'
import { useContactModeHelpLabel, useContactModeLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

import { TriageSection } from './layout'
import { CONTACT_MODE_UI } from './Step1/actions'

const FOLLOW_UP_MODES: Exclude<ContactMode, 'CLOSE'>[] = ['DIGITAL', 'PHONE', 'VISIT']

interface Props {
  readonly value: ContactMode | null
  readonly onSelect: (mode: ContactMode) => void
}

/** Step 1: three contact-mode cards plus the "Stäng ärendet" escape hatch. */
export function ContactModeSection({ value, onSelect }: Props) {
  const { t } = useTranslation()
  const getLabel = useContactModeLabel()
  const getHelp = useContactModeHelpLabel()
  return (
    <TriageSection number={1} title={t('triage.contactModeLabel')} required id="triage-mode">
      <Box
        role="radiogroup"
        aria-labelledby="triage-mode"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 1.25,
        }}
      >
        {FOLLOW_UP_MODES.map((mode) => {
          const selected = value === mode
          const Icon = CONTACT_MODE_UI[mode].icon
          return (
            <ButtonBase
              key={mode}
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(mode)}
              sx={{
                font: 'inherit',
                textAlign: 'left',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: 1.25,
                borderRadius: '10px',
                // keep the outer size stable when the border grows to 2px
                p: selected ? '13px' : '14px',
                border: selected ? `2px solid ${tokens.primary}` : `1px solid ${tokens.border}`,
                bgcolor: selected ? tokens.selectedCardBg : tokens.paper,
                '&:hover': { borderColor: tokens.primary },
                '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 2 },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: selected ? tokens.primary : tokens.greyFill,
                  color: selected ? '#fff' : tokens.text2,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {getLabel(mode)}
                </Box>
                <Box component="span" sx={{ fontSize: 13, color: tokens.textSecondary }}>
                  {getHelp(mode)}
                </Box>
              </Box>
            </ButtonBase>
          )
        })}
      </Box>
      <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
        {t('triage.closePrompt')}{' '}
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => onSelect('CLOSE')}
          aria-pressed={value === 'CLOSE'}
          sx={{ fontWeight: 500, fontSize: 'inherit', verticalAlign: 'baseline' }}
        >
          {getLabel('CLOSE')}
        </Link>
      </Typography>
    </TriageSection>
  )
}
