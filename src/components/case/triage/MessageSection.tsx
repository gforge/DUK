import { Box, Link, TextField, Typography } from '@mui/material'
import React from 'react'
import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { tokens } from '@/theme'

import { TriageSection } from './layout'
import { PATIENT_MESSAGE_MAX, type TriageForm } from './schema'

interface Props {
  readonly control: Control<TriageForm>
  readonly patientMessageLength: number
  /** The case's current internal note; the triage note defaults to it. */
  readonly caseNote: string | undefined
  readonly number: number
}

/** Step 5: optional message to the patient and the (collapsed) internal note. */
export function MessageSection({ control, patientMessageLength, caseNote, number }: Props) {
  const { t } = useTranslation()
  const [editNote, setEditNote] = React.useState(false)
  const hasNote = Boolean(caseNote?.trim())

  return (
    <TriageSection
      number={number}
      title={t('triage.patientMessage')}
      optional
      id="triage-message"
      trailing={
        <Typography
          component="span"
          aria-live="polite"
          sx={{ fontSize: 12, color: tokens.textSecondary, whiteSpace: 'nowrap' }}
        >
          {patientMessageLength}/{PATIENT_MESSAGE_MAX}
        </Typography>
      }
    >
      <Controller
        name="patientMessage"
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value.slice(0, PATIENT_MESSAGE_MAX))}
            placeholder={t('triage.patientMessagePlaceholder')}
            slotProps={{
              htmlInput: {
                maxLength: PATIENT_MESSAGE_MAX,
                'aria-labelledby': 'triage-message',
              },
            }}
          />
        )}
      />

      {editNote ? (
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField
              fullWidth
              multiline
              minRows={2}
              autoFocus
              label={t('triage.note')}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      ) : (
        <Box sx={{ fontSize: 13, color: tokens.textSecondary }}>
          {hasNote ? t('triage.internalNoteSame') : t('triage.internalNoteNone')}
          {' · '}
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => setEditNote(true)}
            sx={{ fontWeight: 500, fontSize: 'inherit', verticalAlign: 'baseline' }}
          >
            {hasNote ? t('common.edit') : t('triage.internalNoteAdd')}
          </Link>
        </Box>
      )}
    </TriageSection>
  )
}
