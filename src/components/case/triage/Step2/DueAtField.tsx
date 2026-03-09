import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import {
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import type { Control, FieldError } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { parseDeadlineInput } from '../parseDeadlineInput'
import type { TriageForm } from '../schema'

export type DueAtPreset = '1w' | '2w' | '1m' | 'custom'

interface Props {
  control: Control<TriageForm>
  error?: FieldError
  dueAtPreset: DueAtPreset | null
  setDueAtPreset: React.Dispatch<React.SetStateAction<DueAtPreset | null>>
}

function duePresetToIso(preset: Exclude<DueAtPreset, 'custom'>): string {
  const now = new Date()
  const target = new Date(now)

  if (preset === '1w') target.setDate(target.getDate() + 7)
  if (preset === '2w') target.setDate(target.getDate() + 14)
  if (preset === '1m') target.setMonth(target.getMonth() + 1)

  return target.toISOString().slice(0, 10)
}

function normalizeDeadlineInput(input: string): string {
  const compact = input.trim().replace(/\s+/g, '')
  const match = compact.match(/^(\d+)(vecka|veckor|week|weeks|v|w|dag|dagar|day|days|d)$/i)

  if (!match) return input.trim()

  return `${match[1]}${match[2].toLowerCase()}`
}

export function DueAtField({ control, error, dueAtPreset, setDueAtPreset }: Props) {
  const { t } = useTranslation()
  const tr = (key: string) => t(key as never)
  const dueDatePickerRef = React.useRef<HTMLInputElement>(null)

  return (
    <Controller
      name="dueAtInput"
      control={control}
      render={({ field }) => (
        <Stack gap={1}>
          <Typography variant="body2" color="text.default">
            {tr('triage.dueAt')}
          </Typography>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={dueAtPreset}
            onChange={(_, nextPreset: DueAtPreset | null) => {
              if (!nextPreset) return

              setDueAtPreset(nextPreset)

              if (nextPreset !== 'custom') {
                field.onChange(duePresetToIso(nextPreset))
              }
            }}
            aria-label={tr('triage.dueAt')}
            color="primary"
          >
            <ToggleButton value="1w" aria-label={tr('triage.dueAtQuick.1w')}>
              {tr('triage.dueAtQuick.1w')}
            </ToggleButton>
            <ToggleButton value="2w" aria-label={tr('triage.dueAtQuick.2w')}>
              {tr('triage.dueAtQuick.2w')}
            </ToggleButton>
            <ToggleButton value="1m" aria-label={tr('triage.dueAtQuick.1m')}>
              {tr('triage.dueAtQuick.1m')}
            </ToggleButton>
            <ToggleButton value="custom" aria-label={tr('triage.dueAtQuick.custom')}>
              {tr('triage.dueAtQuick.custom')}
            </ToggleButton>
          </ToggleButtonGroup>

          {dueAtPreset === 'custom' && (
            <Stack direction="row" gap={1} alignItems="flex-start">
              <TextField
                fullWidth
                label={tr('triage.dueAt')}
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
                placeholder={tr('triage.dueAtPlaceholder')}
                error={Boolean(error)}
                helperText={error ? tr('triage.validation.dueAtInvalid') : undefined}
              />

              <input
                ref={dueDatePickerRef}
                type="date"
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

              <Tooltip title={tr('triage.dueAtOpenPicker')}>
                <Button
                  type="button"
                  variant="outlined"
                  aria-label={tr('triage.dueAtOpenPicker')}
                  onClick={() => dueDatePickerRef.current?.showPicker?.()}
                  sx={{ minWidth: 42, px: 1 }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      )}
    />
  )
}
