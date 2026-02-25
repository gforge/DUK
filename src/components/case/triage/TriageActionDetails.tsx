import React, { useRef } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useTranslation } from 'react-i18next'
import type { UseFormRegister, Control, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { TriageForm } from './TriageForm'
import type { TriageActionKey } from './actionConfig'
import { ACTION_CONFIG } from './actionConfig'
import { parseDeadlineInput, isDeadlineShorthand } from './parseDeadlineInput'
import DeadlineQuickChips from './DeadlineQuickChips'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

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
            onSelect={(iso) => setValue('deadline', iso, { shouldValidate: true })}
          />
          <TextField
            {...register('deadline', {
              validate: (val) =>
                !cfg.deadlineRequired ||
                (!!val?.trim() && parseDeadlineInput(val) !== null) ||
                t('triage.deadlineRequired'),
            })}
            label={t('triage.deadline')}
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
        <FormControl fullWidth size="small">
          <InputLabel id="assign-role-label">{t('triage.assignRole')}</InputLabel>
          <Controller
            name="assignedRole"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                labelId="assign-role-label"
                label={t('triage.assignRole')}
                value={field.value ?? ''}
              >
                <MenuItem value="">
                  <em>{t('common.notSet')}</em>
                </MenuItem>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {t(`role.${role}`)}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>
      )}

      {/* Booking / Appointment */}
      {cfg.allowBooking && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack gap={1}>
            <Typography variant="body2">{t('triage.bookingTitle')}</Typography>
            <TextField
              {...register('bookingTime')}
              type="datetime-local"
              label={t('triage.bookingTime')}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Controller
              name="bookingRole"
              control={control}
              render={({ field }) => (
                <FormControl size="small">
                  <Select {...field} displayEmpty>
                    <MenuItem value="">
                      <em>{t('common.notSet')}</em>
                    </MenuItem>
                    {(cfg.bookingRoles ?? ROLES).map((r) => (
                      <MenuItem key={r} value={r}>
                        {t(`role.${r}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              {...register('bookingNote')}
              label={t('triage.bookingNote')}
              size="small"
              multiline
              minRows={2}
            />
          </Stack>
        </Paper>
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
