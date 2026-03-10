import { zodResolver } from '@hookform/resolvers/zod'
import { Box } from '@mui/material'
import React from 'react'
import { useForm, useWatch } from 'react-hook-form'

import * as client from '@/api/client'
import type { AssignmentMode, CareRole, Case, ContactMode, User } from '@/api/schemas'
import { useApi } from '@/hooks/useApi'

import { parseDeadlineInput } from './parseDeadlineInput'
import { type TriageForm, TriageFormSchema } from './schema'
import { Step1 } from './Step1'
import { Step2 } from './Step2'

interface Props {
  caseData: Case
  onSubmit: (data: {
    triageDecision: {
      contactMode: ContactMode
      careRole: CareRole
      assignmentMode: AssignmentMode
      assignedUserId?: string | null
      dueAt?: string | null
      note?: string | null
    }
    patientMessage?: string
  }) => Promise<void>
  contactModeFromRoute?: ContactMode | null
  onContactModeRouteChange?: (mode: ContactMode | null) => void
}

export type TriageSubmitData = Parameters<Props['onSubmit']>[0]

export default function TriageForm({
  caseData,
  onSubmit,
  contactModeFromRoute,
  onContactModeRouteChange,
}: Props) {
  const [step, setStep] = React.useState<1 | 2>(1)
  const [dueAtPreset, setDueAtPreset] = React.useState<'1w' | '2w' | '1m' | 'custom' | null>(null)

  const {
    control,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TriageForm>({
    resolver: zodResolver(TriageFormSchema),
    defaultValues: {
      contactMode: null,
      careRole: null,
      assignmentMode: null,
      assignedUserId: caseData.assignedUserId,
      dueAtInput: '',
      note: caseData.internalNote ?? '',
      patientMessage: caseData.patientMessage ?? '',
    },
  })

  const { data: users } = useApi(() => client.getUsers(), [])

  const contactMode = useWatch({ control, name: 'contactMode' })
  const careRole = useWatch({ control, name: 'careRole' })
  const assignmentMode = useWatch({ control, name: 'assignmentMode' })

  React.useEffect(() => {
    if (contactModeFromRoute === undefined) return

    if (contactModeFromRoute === null) {
      setStep(1)
      return
    }

    setValue('contactMode', contactModeFromRoute, { shouldValidate: true })
    if (contactModeFromRoute === 'CLOSE') {
      setValue('careRole', null)
      setValue('assignmentMode', null)
      setValue('assignedUserId', '')
      setValue('dueAtInput', '')
      setDueAtPreset(null)
    }
    setStep(2)
  }, [contactModeFromRoute, setValue])

  const eligibleNamedUsers = React.useMemo(() => {
    const roleByCareRole: Record<Exclude<CareRole, null>, User['role'] | null> = {
      DOCTOR: 'DOCTOR',
      NURSE: 'NURSE',
      PHYSIO: null,
    }

    if (!careRole) return []
    const mappedRole = roleByCareRole[careRole]
    if (!mappedRole) return []

    return (users ?? []).filter((u) => u.role === mappedRole)
  }, [users, careRole])

  function selectMode(mode: ContactMode) {
    setValue('contactMode', mode, { shouldValidate: true })

    if (mode === 'CLOSE') {
      setValue('careRole', null)
      setValue('assignmentMode', null)
      setValue('assignedUserId', '')
      setValue('dueAtInput', '')
      setDueAtPreset(null)
    }

    if (onContactModeRouteChange) {
      onContactModeRouteChange(mode)
      return
    }

    setStep(2)
  }

  function handleBack() {
    if (onContactModeRouteChange) {
      onContactModeRouteChange(null)
    } else {
      setStep(1)
    }

    const values = getValues()
    reset({
      contactMode: values.contactMode,
      careRole: values.careRole,
      assignmentMode: values.assignmentMode,
      assignedUserId: values.assignedUserId,
      dueAtInput: values.dueAtInput,
      note: values.note,
      patientMessage: values.patientMessage,
    })
  }

  async function submitForm(data: TriageForm) {
    const dueAt = data.dueAtInput?.trim()
      ? (() => {
          const parsed = parseDeadlineInput(data.dueAtInput)
          if (parsed) return parsed
          const date = new Date(data.dueAtInput)
          return Number.isNaN(date.getTime()) ? null : date.toISOString()
        })()
      : null

    await onSubmit({
      triageDecision: {
        contactMode: data.contactMode as ContactMode,
        careRole: data.contactMode === 'CLOSE' ? null : data.careRole,
        assignmentMode: data.contactMode === 'CLOSE' ? null : data.assignmentMode,
        assignedUserId:
          data.contactMode === 'CLOSE' || data.assignmentMode !== 'NAMED'
            ? null
            : (data.assignedUserId ?? null),
        dueAt: data.contactMode === 'CLOSE' ? null : dueAt,
        note: data.note?.trim() ? data.note : null,
      },
      patientMessage: data.patientMessage?.trim() ? data.patientMessage : undefined,
    })
  }

  if (step === 1) {
    return <Step1 selectedMode={contactMode} onSelect={selectMode} />
  }

  if (!contactMode) {
    return <Step1 selectedMode={contactMode} onSelect={selectMode} />
  }

  return (
    <Box>
      <Step2
        control={control}
        errors={errors}
        contactMode={contactMode}
        careRole={careRole}
        assignmentMode={assignmentMode}
        eligibleNamedUsers={eligibleNamedUsers}
        dueAtPreset={dueAtPreset}
        setDueAtPreset={setDueAtPreset}
        setValue={setValue}
        onBack={handleBack}
        onSubmit={handleSubmit(submitForm)}
        isSubmitting={isSubmitting}
      />
    </Box>
  )
}
