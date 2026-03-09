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
import { useContactModeLabel } from '@/hooks/labels'

import type { TriageForm } from '../schema'
import { CareRoleField } from './CareRoleField'
import { AssignmentModeField } from './AssignmentModeField'
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
  const getContactModeLabel = useContactModeLabel()

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {t(STEP2_TITLE_KEY_BY_MODE[contactMode])}
        </Typography>

        <Chip size="small" color="primary" label={getContactModeLabel(contactMode)} />

        <Box sx={{ flexGrow: 1 }} />

        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          {t('triage.backToModes')}
        </Button>
      </Stack>

      {contactMode === 'CLOSE' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('triage.closeNoWorklist')}
        </Alert>
      ) : (
        <Stack gap={1.5} sx={{ mb: 2 }}>
          <CareRoleField
            control={control}
            error={errors.careRole}
            assignmentMode={assignmentMode}
            setValue={setValue}
          />

          <AssignmentModeField
            control={control}
            error={errors.assignmentMode}
            careRole={careRole}
            setValue={setValue}
          />

          {assignmentMode === 'NAMED' && (
            <Controller
              name="assignedUserId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label={t('triage.namedPerson')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={Boolean(errors.assignedUserId)}
                  helperText={
                    errors.assignedUserId
                      ? t('triage.validation.namedPersonRequired')
                      : eligibleNamedUsers.length === 0
                        ? t('triage.noNamedUsers')
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
                label={t('triage.note')}
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
          {t('triage.confirmCreatesWorklist')}
        </Typography>
      )}

      <Controller
        name="patientMessage"
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            label={t('triage.patientMessage')}
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
          {t('triage.backToModes')}
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? t('triage.submitting') : t('triage.submit')}
        </Button>
      </Stack>
    </Box>
  )
}
