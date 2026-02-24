import React from 'react'
import {
  Box,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Typography,
  Chip,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { TriageInputSchema } from '../../api/schemas'
import type { Case, TriageInput, CaseStatus } from '../../api/schemas'
import { useRole } from '../../store/roleContext'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import StatusChip from '../common/StatusChip'
import { z } from 'zod'

// Extend schema to make deadline optional string, remove .default() so closeImmediately is always boolean
const TriageFormSchema = TriageInputSchema.extend({
  deadline: z.string().optional(),
  closeImmediately: z.boolean(),
})
type TriageForm = z.infer<typeof TriageFormSchema>

interface TriageTabProps {
  caseData: Case
  onTriaged: () => void
}

const NEXT_STEPS: TriageInput['nextStep'][] = [
  'DIGITAL_CONTROL',
  'DOCTOR_VISIT',
  'NURSE_VISIT',
  'PHYSIO_VISIT',
  'PHONE_CALL',
  'NO_ACTION',
]

const ROLES: TriageInput['assignedRole'][] = ['NURSE', 'DOCTOR', 'PAL']

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: ['NEEDS_REVIEW'],
  NEEDS_REVIEW: ['TRIAGED'],
  TRIAGED: ['FOLLOWING_UP', 'CLOSED'],
  FOLLOWING_UP: ['CLOSED'],
  CLOSED: [],
}

export default function TriageTab({ caseData, onTriaged }: TriageTabProps) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()

  const canTriage = isRole('NURSE', 'DOCTOR', 'PAL')
  const canClose =
    caseData.status === 'TRIAGED' ||
    caseData.status === 'FOLLOWING_UP' ||
    caseData.status === 'NEEDS_REVIEW'
  const allowedTransitions = VALID_TRANSITIONS[caseData.status] ?? []

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TriageForm>({
    resolver: zodResolver(TriageFormSchema),
    defaultValues: {
      nextStep: caseData.nextStep ?? 'DIGITAL_CONTROL',
      deadline: caseData.deadline ? caseData.deadline.substring(0, 10) : '',
      internalNote: caseData.internalNote ?? '',
      patientMessage: caseData.patientMessage ?? '',
      assignedRole: caseData.assignedRole,
      closeImmediately: false,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchClose = watch('closeImmediately')

  async function onSubmit(data: TriageForm) {
    try {
      const deadline = data.deadline ? new Date(data.deadline).toISOString() : undefined
      await client.triageCase(caseData.id, { ...data, deadline }, currentUser.id, currentUser.role)
      showSnack(t('triage.success'), 'success')
      onTriaged()
    } catch (err) {
      showSnack(`${t('triage.error')}: ${String(err)}`, 'error')
    }
  }

  async function handleFollowUp() {
    try {
      await client.advanceCaseStatus(caseData.id, 'FOLLOWING_UP', currentUser.id, currentUser.role)
      showSnack(t('triage.followUp'), 'info')
      onTriaged()
    } catch (err) {
      showSnack(String(err), 'error')
    }
  }

  async function handleClose() {
    try {
      await client.advanceCaseStatus(caseData.id, 'CLOSED', currentUser.id, currentUser.role)
      showSnack(t('triage.close'), 'success')
      onTriaged()
    } catch (err) {
      showSnack(String(err), 'error')
    }
  }

  if (!canTriage) {
    return (
      <Alert severity="info">
        {t('role.currentRole')}: {t(`role.${currentUser.role}`)}. Triage requires clinical staff
        access.
      </Alert>
    )
  }

  return (
    <Box>
      {/* State machine info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {t('triage.stateInfo', { status: t(`status.${caseData.status}`) })}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <StatusChip status={caseData.status} />
          {allowedTransitions.map((s) => (
            <React.Fragment key={s}>
              <ArrowForwardIcon fontSize="small" sx={{ opacity: 0.4 }} />
              <StatusChip status={s} />
            </React.Fragment>
          ))}
        </Stack>

        {/* Quick action buttons for post-triage transitions */}
        {caseData.status === 'TRIAGED' && (
          <Stack direction="row" gap={1} mt={2}>
            <Button variant="outlined" size="small" onClick={handleFollowUp}>
              {t('triage.followUp')}
            </Button>
            <Button variant="outlined" color="success" size="small" onClick={handleClose}>
              {t('triage.close')}
            </Button>
          </Stack>
        )}
        {caseData.status === 'FOLLOWING_UP' && (
          <Stack direction="row" gap={1} mt={2}>
            <Button variant="outlined" color="success" size="small" onClick={handleClose}>
              {t('triage.close')}
            </Button>
          </Stack>
        )}
        {caseData.status === 'CLOSED' && (
          <Alert severity="success" sx={{ mt: 1 }}>
            {t('status.CLOSED')}
          </Alert>
        )}
      </Paper>

      {/* Triage form — only for NEEDS_REVIEW */}
      {(caseData.status === 'NEW' || caseData.status === 'NEEDS_REVIEW') && (
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          aria-label={t('triage.title')}
          noValidate
        >
          <Stack gap={2}>
            {/* Next step */}
            <FormControl fullWidth size="small" error={!!errors.nextStep}>
              <InputLabel id="next-step-label">{t('triage.nextStep')}</InputLabel>
              <Controller
                name="nextStep"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="next-step-label"
                    label={t('triage.nextStep')}
                    aria-required="true"
                  >
                    {NEXT_STEPS.map((step) => (
                      <MenuItem key={step} value={step}>
                        {t(`nextStep.${step}`)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            {/* Deadline */}
            {!watchClose && (
              <TextField
                {...register('deadline')}
                label={t('triage.deadline')}
                type="date"
                size="small"
                error={!!errors.deadline}
                helperText={errors.deadline?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

            {/* Assign role */}
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

            <Divider />

            {/* Internal note */}
            <TextField
              {...register('internalNote')}
              label={t('triage.internalNote')}
              multiline
              minRows={2}
              size="small"
              error={!!errors.internalNote}
            />

            {/* Patient message */}
            <TextField
              {...register('patientMessage')}
              label={t('triage.patientMessage')}
              multiline
              minRows={2}
              size="small"
              error={!!errors.patientMessage}
            />

            {/* Close immediately checkbox */}
            <FormControlLabel
              control={
                <Controller
                  name="closeImmediately"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label={t('triage.closeImmediately')}
            />

            {watchClose && (
              <Alert severity="warning">
                {t('status.TRIAGED')} → {t('status.CLOSED')}
              </Alert>
            )}

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
      )}
    </Box>
  )
}
