import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import React, { useRef } from 'react'
import type { Control, FieldErrors,UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { TriageActionKey } from './actionConfig'
import { ACTION_CONFIG } from './actionConfig'
import DeadlineQuickChips from './DeadlineQuickChips'
import { isDeadlineShorthand,parseDeadlineInput } from './parseDeadlineInput'
import type { TriageForm } from './TriageForm'

const ROLES: Array<'NURSE' | 'DOCTOR' | 'PAL'> = ['NURSE', 'DOCTOR', 'PAL']

interface Props {
  action: TriageActionKey
  register: UseFormRegister<TriageForm>
  control: Control<TriageForm>
  setValue: UseFormSetValue<TriageForm>
  errors: FieldErrors<TriageForm>
  deadlineRaw: string
}

export default function TriageActionDetails({
  action,
  register,
  control,
  setValue,
  errors,
  deadlineRaw,
}: Props) {
  const { t, i18n } = useTranslation()
  const cfg = ACTION_CONFIG[action]
  const nativeDateRef = useRef<HTMLInputElement>(null)

  const parsedDeadline = deadlineRaw.trim() ? parseDeadlineInput(deadlineRaw) : null
  const deadlineHint =
    parsedDeadline && isDeadlineShorthand(deadlineRaw)
      ? `→ ${new Date(parsedDeadline + 'T12:00:00').toLocaleDateString(
          i18n.language === 'sv' ? 'sv-SE' : 'en-GB',
        )}`
      : undefined

  if (action === 'CLOSE_NOW') {
    return (
      <Stack gap={2}>
        <Alert severity="warning">{t('triage.closeNowConfirm')}</Alert>
        <TextField
          {...register('internalNote')}
          label={t('triage.internalNote')}
          multiline
          minRows={2}
          size="small"
          error={!!errors.internalNote}
        />
      </Stack>
    )
  }

  return (
    <Stack gap={2}>
      {/* Deadline */}
      {cfg.showDeadline && (
        <Box>
          {/* Hidden native picker */}
          <input
            ref={nativeDateRef}
            type="date"
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            onChange={(e) => {
              if (e.target.value) setValue('deadline', e.target.value, { shouldValidate: true })
            }}
          />
          <DeadlineQuickChips
            label={t('triage.quickDeadline')}
            onSelect={(iso) => setValue('deadline', iso, { shouldValidate: true })}
          />
          <TextField
            {...register('deadline', {
              validate: (val) =>
                !cfg.deadlineRequired ||
                (!!val?.trim() && parseDeadlineInput(val) !== null) ||
                t('triage.deadlineRequired'),
            })}
            label={t(cfg.allowBooking ? 'triage.deadlineBookBy' : 'triage.deadline')}
            type="text"
            size="small"
            fullWidth
            placeholder={t('triage.deadlinePlaceholder')}
            error={!!errors.deadline}
            helperText={deadlineHint ?? errors.deadline?.message}
            sx={{ mt: 1 }}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label={t('triage.deadlinePicker')}
                      onClick={() => nativeDateRef.current?.showPicker?.()}
                      edge="end"
                    >
                      <CalendarMonthIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      )}

      {/* Assigned role */}
      {cfg.showAssignedRole && (
        <Controller
          name="assignedRole"
          control={control}
          render={({ field }) => (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: 'block' }}
              >
                {t('triage.assignRole')}
              </Typography>
              <ToggleButtonGroup
                value={field.value ?? ''}
                exclusive
                onChange={(_, val) => field.onChange(val ?? '')}
                size="small"
              >
                {ROLES.map((role) => (
                  <ToggleButton key={role} value={role}>
                    {t(`role.${role}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
        />
      )}

      {/* Booking indication */}
      {cfg.allowBooking && (
        <TextField
          {...register('bookingNote')}
          label={t('triage.bookingNote')}
          size="small"
          multiline
          minRows={2}
        />
      )}

      {/* Internal note — always primary for PHONE_CALL, otherwise in accordion */}
      {cfg.showInternalNote && action === 'PHONE_CALL' ? (
        <TextField
          {...register('internalNote')}
          label={t('triage.internalNote')}
          multiline
          minRows={2}
          size="small"
          error={!!errors.internalNote}
        />
      ) : cfg.showInternalNote ? (
        <Accordion disableGutters variant="outlined" sx={{ '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">{t('triage.more')}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Stack gap={2}>
              <TextField
                {...register('internalNote')}
                label={t('triage.internalNote')}
                multiline
                minRows={2}
                size="small"
                error={!!errors.internalNote}
              />
              {cfg.showPatientMessage && (
                <TextField
                  {...register('patientMessage')}
                  label={t('triage.patientMessage')}
                  multiline
                  minRows={2}
                  size="small"
                  error={!!errors.patientMessage}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ) : null}
    </Stack>
  )
}
