import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, ContactMode, User } from '@/api/schemas'

import type { TriageForm } from '../schema'
import { CareRoleField } from './CareRoleField'
import { DueAtField, type DueAtPreset } from './DueAtField'

interface Props {
  control: Control<TriageForm>
  errors: FieldErrors<TriageForm>
  contactMode: ContactMode
  careRole: CareRole
  assignmentMode: AssignmentMode
  eligibleNamedUsers: User[]
  dueAtPreset: DueAtPreset | null
  setDueAtPreset: React.Dispatch<React.SetStateAction<DueAtPreset | null>>
  setValue: UseFormSetValue<TriageForm>
  onBack: () => void
  onSubmit: ReturnType<UseFormHandleSubmit<TriageForm>>
  isSubmitting: boolean
}

const STEP2_TITLE_KEY_BY_MODE: Record<ContactMode, string> = {
  DIGITAL: 'triage.step2TitleByMode.DIGITAL',
  PHONE: 'triage.step2TitleByMode.PHONE',
  VISIT: 'triage.step2TitleByMode.VISIT',
  CLOSE: 'triage.step2TitleByMode.CLOSE',
}

export function Step2({
  control,
  errors,
  contactMode,
  careRole,
  assignmentMode,
  eligibleNamedUsers,
  dueAtPreset,
  setDueAtPreset,
  setValue,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  const { t } = useTranslation()
  const tr = (key: string) => t(key as never)

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {tr(STEP2_TITLE_KEY_BY_MODE[contactMode])}
        </Typography>

        <Chip size="small" color="primary" label={tr(`triage.contactMode.${contactMode}`)} />

        <Box sx={{ flexGrow: 1 }} />

        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          {tr('triage.backToModes')}
        </Button>
      </Stack>

      {contactMode === 'CLOSE' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {tr('triage.closeNoWorklist')}
        </Alert>
      ) : (
        <Stack gap={1.5} sx={{ mb: 2 }}>
          <CareRoleField
            control={control}
            error={errors.careRole}
            assignmentMode={assignmentMode}
            setValue={setValue}
          />

          <Controller
            name="assignmentMode"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label={tr('triage.assignmentMode')}
                value={field.value ?? ''}
                onChange={(e) => {
                  const nextMode = e.target.value as AssignmentMode
                  field.onChange(nextMode)

                  if (nextMode !== 'NAMED') {
                    setValue('assignedUserId', '')
                  }
                }}
                error={Boolean(errors.assignmentMode)}
                helperText={
                  errors.assignmentMode ? tr('triage.validation.assignmentModeRequired') : undefined
                }
              >
                <MenuItem value="ANY">{tr('triage.assignmentModeOption.ANY')}</MenuItem>
                {careRole === 'DOCTOR' && (
                  <MenuItem value="PAL">{tr('triage.assignmentModeOption.PAL')}</MenuItem>
                )}
                <MenuItem value="NAMED">{tr('triage.assignmentModeOption.NAMED')}</MenuItem>
              </TextField>
            )}
          />

          {assignmentMode === 'NAMED' && (
            <Controller
              name="assignedUserId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label={tr('triage.namedPerson')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={Boolean(errors.assignedUserId)}
                  helperText={
                    errors.assignedUserId
                      ? tr('triage.validation.namedPersonRequired')
                      : eligibleNamedUsers.length === 0
                        ? tr('triage.noNamedUsers')
                        : undefined
                  }
                >
                  {eligibleNamedUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <DueAtField
            control={control}
            error={errors.dueAtInput}
            dueAtPreset={dueAtPreset}
            setDueAtPreset={setDueAtPreset}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label={tr('triage.note')}
                value={field.value ?? ''}
                onChange={field.onChange}
                multiline
                minRows={2}
              />
            )}
          />
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      {contactMode !== 'CLOSE' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tr('triage.confirmCreatesWorklist')}
        </Typography>
      )}

      <Controller
        name="patientMessage"
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            label={tr('triage.patientMessage')}
            value={field.value ?? ''}
            onChange={field.onChange}
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
        )}
      />

      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button variant="outlined" onClick={onBack} startIcon={<ArrowBackIcon />}>
          {tr('triage.backToModes')}
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? tr('triage.submitting') : tr('triage.submit')}
        </Button>
      </Stack>
    </Box>
  )
}
