import React, { useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { TriageInputSchema } from '../../../api/schemas'
import type { Case } from '../../../api/schemas'
import { z } from 'zod'
import { parseDeadlineInput } from './parseDeadlineInput'
import { ACTION_CONFIG, ACTION_ORDER, type TriageActionKey } from './actionConfig'
import TriageContextBar from './TriageContextBar'
import TriageActionCards from './TriageActionCards'
import TriageActionDetails from './TriageActionDetails'

export const TriageFormSchema = TriageInputSchema.extend({
  deadline: z.string().optional(),
  closeImmediately: z.boolean(),
  bookingNote: z.string().optional(),
})
export type TriageForm = z.infer<typeof TriageFormSchema>

interface Props {
  caseData: Case
  onSubmit: (data: TriageForm) => Promise<void>
}

export default function TriageForm({ caseData, onSubmit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [selectedAction, setSelectedAction] = React.useState<TriageActionKey | null>(null)
  const detailsRef = useRef<HTMLDivElement>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TriageForm>({
    resolver: zodResolver(TriageFormSchema),
    defaultValues: {
      nextStep: 'DIGITAL_CONTROL',
      deadline: '',
      internalNote: caseData.internalNote ?? '',
      patientMessage: caseData.patientMessage ?? '',
      assignedRole: caseData.assignedRole,
      closeImmediately: false,
    },
  })

  function handleActionSelect(action: TriageActionKey) {
    const cfg = ACTION_CONFIG[action]
    setSelectedAction(action)
    setStep(2)

    // Pre-fill RHF fields from config
    setValue('nextStep', cfg.nextStep)
    setValue('closeImmediately', cfg.closeImmediately)
    setValue('assignedRole', cfg.defaultAssignedRole ?? undefined)

    if (cfg.defaultDeadlineShorthand) {
      const iso = parseDeadlineInput(cfg.defaultDeadlineShorthand)
      setValue('deadline', iso ?? '', { shouldValidate: false })
    } else {
      setValue('deadline', '')
    }
  }

  function handleBack() {
    setStep(1)
    setSelectedAction(null)
    reset({
      nextStep: 'DIGITAL_CONTROL',
      deadline: '',
      internalNote: caseData.internalNote ?? '',
      patientMessage: caseData.patientMessage ?? '',
      assignedRole: caseData.assignedRole,
      closeImmediately: false,
    })
  }

  // Move focus to the details area after action selection
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => detailsRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [step])

  async function handleSubmitWithResolve(data: TriageForm) {
    const resolved: TriageForm = {
      ...data,
      deadline: data.deadline?.trim()
        ? (parseDeadlineInput(data.deadline) ?? data.deadline)
        : undefined,
    }
    await onSubmit(resolved)
  }

  const deadlineRaw = watch('deadline') ?? ''

  // ─── Step 1: Action cards ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Box>
        <TriageContextBar caseData={caseData} />
        <TriageActionCards onSelect={handleActionSelect} />
      </Box>
    )
  }

  // ─── Step 2: Details ───────────────────────────────────────────────────────
  const isClose = selectedAction === 'CLOSE_NOW'

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleSubmitWithResolve)}
      aria-label={t('triage.title')}
      noValidate
    >
      {/* Context bar (compact, stays visible in step 2) */}
      <TriageContextBar caseData={caseData} />

      {/* Selected action summary */}
      <Paper
        variant="outlined"
        sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('triage.selectedAction')}:
        </Typography>
        <Chip
          label={t(`triage.actionLabel.${selectedAction}`)}
          size="small"
          color={isClose ? 'default' : 'primary'}
        />
        <Box flexGrow={1} />
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ flexShrink: 0 }}
        >
          {t('triage.backToActions')}
        </Button>
      </Paper>

      {/* Action-specific fields */}
      <Box ref={detailsRef} tabIndex={-1} sx={{ outline: 'none', mb: 2 }}>
        <TriageActionDetails
          action={selectedAction!}
          register={register}
          control={control}
          setValue={setValue}
          errors={errors}
          deadlineRaw={deadlineRaw}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />}>
          {t('triage.backToActions')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color={isClose ? 'inherit' : 'primary'}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? t('triage.submitting') : t('triage.submit')}
        </Button>
      </Stack>
    </Box>
  )
}
