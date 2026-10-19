import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { type TransitionTriggerType, TransitionTriggerTypeSchema } from '@/api/schemas'
import { useTransitionTriggerLabel } from '@/hooks/labels'

interface Props {
  readonly value: TransitionTriggerType | ''
  readonly onChange: (value: TransitionTriggerType | '') => void
  readonly label: string
  readonly helperText?: string
  /** Offer an empty "not set" option (used by the template editor). */
  readonly allowEmpty?: boolean
  readonly required?: boolean
}

/** Select for the clinical event that starts (or transitions) a journey phase. */
export default function TriggerEventSelect({
  value,
  onChange,
  label,
  helperText,
  allowEmpty = false,
  required = false,
}: Props) {
  const { t } = useTranslation()
  const triggerLabel = useTransitionTriggerLabel()
  return (
    <FormControl size="small" fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as TransitionTriggerType | '')}
      >
        {allowEmpty && (
          <MenuItem value="">
            <em>{t('journey.template.anchorEventNone')}</em>
          </MenuItem>
        )}
        {TransitionTriggerTypeSchema.options.map((type) => (
          <MenuItem key={type} value={type}>
            {triggerLabel(type)}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
