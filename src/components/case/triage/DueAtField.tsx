import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { Box, Button, Stack, TextField, Tooltip } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import type { Control, FieldError } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { OptionButton } from '@/components/common'

import { TriageSection } from './layout'
import { parseDeadlineInput } from './parseDeadlineInput'
import type { TriageForm } from './schema'
import { useDateLocale } from './useTriageDirectory'
import { computeDueAtFromInput } from './utils'

export type DueAtPreset = '1w' | '2w' | '1m' | 'custom'

const PRESETS: Exclude<DueAtPreset, 'custom'>[] = ['1w', '2w', '1m']

interface Props {
  readonly control: Control<TriageForm>
  readonly error?: FieldError
  readonly dueAtPreset: DueAtPreset | null
  readonly setDueAtPreset: React.Dispatch<React.SetStateAction<DueAtPreset | null>>
}

function duePresetToIso(preset: Exclude<DueAtPreset, 'custom'>, from = new Date()): string {
  const target = new Date(from)
  if (preset === '1w') target.setDate(target.getDate() + 7)
  if (preset === '2w') target.setDate(target.getDate() + 14)
  if (preset === '1m') target.setMonth(target.getMonth() + 1)
  return format(target, 'yyyy-MM-dd')
}

function normalizeDeadlineInput(input: string): string {
  const compact = input.trim().replace(/\s+/g, '')
  const match = compact.match(/^(\d+)(vecka|veckor|week|weeks|v|w|dag|dagar|day|days|d)$/i)
  if (!match) return input.trim()
  return `${match[1]}${match[2].toLowerCase()}`
}

/** Step 4: due date presets (1 vecka / 2 veckor / 1 månad) or a custom date. */
export function DueAtField({ control, error, dueAtPreset, setDueAtPreset }: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const dueDatePickerRef = React.useRef<HTMLInputElement>(null)
  const fmt = (iso: string) => format(new Date(`${iso}T12:00:00`), 'd MMM yyyy', { locale })
  const presetLabel: Record<DueAtPreset, string> = {
    '1w': t('triage.dueAtQuick.1w'),
    '2w': t('triage.dueAtQuick.2w'),
    '1m': t('triage.dueAtQuick.1m'),
    custom: t('triage.dueAtQuick.custom'),
  }

  return (
    <Controller
      name="dueAtInput"
      control={control}
      render={({ field }) => {
        const customIso = dueAtPreset === 'custom' ? computeDueAtFromInput(field.value) : null
        return (
          <TriageSection number={4} title={t('triage.dueAt')} required id="triage-due">
            <Box
              role="radiogroup"
              aria-labelledby="triage-due"
              sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
            >
              {PRESETS.map((preset) => (
                <OptionButton
                  key={preset}
                  selected={dueAtPreset === preset}
                  onClick={() => {
                    setDueAtPreset(preset)
                    field.onChange(duePresetToIso(preset))
                  }}
                  label={presetLabel[preset]}
                  sub={fmt(duePresetToIso(preset))}
                />
              ))}
              <OptionButton
                selected={dueAtPreset === 'custom'}
                onClick={() => {
                  if (dueAtPreset !== 'custom') field.onChange('')
                  setDueAtPreset('custom')
                }}
                label={presetLabel.custom}
                sub={
                  customIso && !error
                    ? format(new Date(customIso), 'd MMM yyyy', { locale })
                    : t('triage.dueAtPickDate')
                }
              />
            </Box>

            {dueAtPreset === 'custom' && (
              <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start', maxWidth: 420 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('triage.dueAt')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={(e) => {
                    const raw = e.target.value
                    const parsed =
                      parseDeadlineInput(raw) ?? parseDeadlineInput(normalizeDeadlineInput(raw))
                    if (parsed) {
                      field.onChange(parsed)
                    }
                  }}
                  placeholder={t('triage.dueAtPlaceholder')}
                  error={Boolean(error)}
                  helperText={
                    error
                      ? field.value?.trim()
                        ? t('triage.validation.dueAtInvalid')
                        : t('triage.validation.dueAtRequired')
                      : undefined
                  }
                />
                <input
                  ref={dueDatePickerRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      field.onChange(e.target.value)
                      setDueAtPreset('custom')
                    }
                  }}
                />
                <Tooltip title={t('triage.dueAtOpenPicker')}>
                  <Button
                    type="button"
                    variant="outlined"
                    aria-label={t('triage.dueAtOpenPicker')}
                    onClick={() => dueDatePickerRef.current?.showPicker?.()}
                    sx={{ minWidth: 40, px: 1, height: 40 }}
                  >
                    <CalendarMonthIcon fontSize="small" />
                  </Button>
                </Tooltip>
              </Stack>
            )}
          </TriageSection>
        )
      }}
    />
  )
}
