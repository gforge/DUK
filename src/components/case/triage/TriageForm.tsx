import { zodResolver } from '@hookform/resolvers/zod'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, Case, ContactMode } from '@/api/schemas'
import { ConfirmDialog } from '@/components/common'
import { useAssigneeLabel, useCareRoleLabel, useContactModeLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

import { AssigneeSection } from './AssigneeSection'
import { CareRoleSection } from './CareRoleSection'
import { ContactModeSection } from './ContactModeSection'
import { DueAtField, type DueAtPreset } from './DueAtField'
import { AsideTitle, type DecisionRow, DecisionRows, TriageLayout } from './layout'
import { MessageSection } from './MessageSection'
import { type TriageForm as TriageFormValues, TriageFormSchema } from './schema'
import { cardSx } from './styles'
import { countMissingRequired, toTriageSubmitData, type TriageSubmitData } from './toSubmitData'
import { eligibleUsersFor, useDateLocale, useTriageDirectory } from './useTriageDirectory'
import { computeDueAtFromInput } from './utils'

export type { TriageSubmitData } from './toSubmitData'

interface Props {
  readonly caseData: Case
  readonly onSubmit: (data: TriageSubmitData) => Promise<void>
  readonly contactModeFromRoute?: ContactMode | null
  readonly onContactModeRouteChange?: (mode: ContactMode | null) => void
  /** Extra aside content under the submit button (colleague review). */
  readonly asideFooter?: React.ReactNode
}

export default function TriageForm({
  caseData,
  onSubmit,
  contactModeFromRoute,
  onContactModeRouteChange,
  asideFooter,
}: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const getContactModeLabel = useContactModeLabel()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssigneeLabel = useAssigneeLabel()
  const { users, teams } = useTriageDirectory()
  const [dueAtPreset, setDueAtPreset] = React.useState<DueAtPreset | null>(null)
  const [confirmClose, setConfirmClose] = React.useState(false)

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TriageFormValues>({
    resolver: zodResolver(TriageFormSchema),
    defaultValues: {
      contactMode: null,
      careRole: null,
      assignmentMode: null,
      assignedUserIds: caseData.assignedUserId ? [caseData.assignedUserId] : [],
      assignedTeamIds: [],
      dueAtInput: '',
      note: caseData.internalNote ?? '',
      patientMessage: caseData.patientMessage ?? '',
    },
  })

  const values = useWatch({ control }) as Partial<TriageFormValues>
  const contactMode = values.contactMode ?? null
  const careRole = values.careRole ?? null
  const assignmentMode = values.assignmentMode ?? null
  const assignedUserIds = values.assignedUserIds ?? []
  const assignedTeamIds = values.assignedTeamIds ?? []
  const isClose = contactMode === 'CLOSE'

  const clearFollowUpFields = React.useCallback(() => {
    setValue('careRole', null)
    setValue('assignmentMode', null)
    setValue('assignedUserIds', [])
    setValue('assignedTeamIds', [])
    setValue('dueAtInput', '')
  }, [setValue])

  React.useEffect(() => {
    if (!contactModeFromRoute) return
    setValue('contactMode', contactModeFromRoute, { shouldValidate: true })
    if (contactModeFromRoute === 'CLOSE') clearFollowUpFields()
  }, [contactModeFromRoute, setValue, clearFollowUpFields])

  function selectMode(mode: ContactMode) {
    setValue('contactMode', mode, { shouldValidate: true })
    if (mode === 'CLOSE') clearFollowUpFields()
    onContactModeRouteChange?.(mode)
  }

  function selectCareRole(role: Exclude<CareRole, null>) {
    if (role === careRole) return
    setValue('careRole', role, { shouldValidate: true })
    // PAL is only valid for doctors, and named people follow the competence.
    if (assignmentMode === 'PAL' && role !== 'DOCTOR') setValue('assignmentMode', null)
    const eligible = new Set(eligibleUsersFor(users, role).map((u) => u.id))
    setValue(
      'assignedUserIds',
      assignedUserIds.filter((id) => eligible.has(id)),
    )
  }

  function selectAssignmentMode(mode: Exclude<AssignmentMode, null>) {
    setValue('assignmentMode', mode, { shouldValidate: true })
  }

  async function submitForm(data: TriageFormValues) {
    await onSubmit(toTriageSubmitData(data))
  }

  const submit = handleSubmit(submitForm)
  const missing = countMissingRequired(values)
  const dueIso = isClose ? null : computeDueAtFromInput(values.dueAtInput)

  const rows: DecisionRow[] = isClose
    ? [{ key: 'mode', label: t('triage.contactModeLabel'), value: getContactModeLabel('CLOSE') }]
    : [
        {
          key: 'mode',
          label: t('triage.contactModeLabel'),
          value: contactMode ? getContactModeLabel(contactMode) : null,
        },
        {
          key: 'role',
          label: t('triage.careRole'),
          value: careRole ? getCareRoleLabel(careRole) : null,
        },
        {
          key: 'who',
          label: t('triage.responsible'),
          value: getAssigneeLabel(
            { assignmentMode, careRole, assignedUserIds, assignedTeamIds },
            users,
            teams,
          ),
        },
        {
          key: 'due',
          label: t('triage.dueShort'),
          value: dueIso ? format(new Date(dueIso), 'd MMM yyyy', { locale }) : null,
        },
      ]

  const main = (
    <Stack sx={{ ...cardSx, p: 3, gap: 3.5 }}>
      <ContactModeSection value={contactMode} onSelect={selectMode} />

      {isClose ? (
        <Stack
          direction="row"
          sx={{
            gap: 1,
            alignItems: 'flex-start',
            bgcolor: tokens.headerBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: '10px',
            p: 1.75,
          }}
        >
          <InfoOutlinedIcon fontSize="small" sx={{ color: tokens.textSecondary, mt: '1px' }} />
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{t('triage.closeNoWorklist')}</Typography>
            <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
              {t('triage.closeBackHint')}
            </Typography>
          </Box>
        </Stack>
      ) : (
        <>
          <CareRoleSection value={careRole} onChange={selectCareRole} />
          <AssigneeSection
            contactMode={contactMode}
            careRole={careRole}
            assignmentMode={assignmentMode}
            assignedUserIds={assignedUserIds}
            assignedTeamIds={assignedTeamIds}
            users={users}
            teams={teams}
            onModeChange={selectAssignmentMode}
            onUsersChange={(ids) => setValue('assignedUserIds', ids, { shouldValidate: true })}
            onTeamsChange={(ids) => setValue('assignedTeamIds', ids, { shouldValidate: true })}
            personError={Boolean(errors.assignedUserIds)}
            teamError={Boolean(errors.assignedTeamIds)}
          />
          <DueAtField
            control={control}
            error={errors.dueAtInput}
            // a cleared due date (e.g. after choosing CLOSE) also clears the preset highlight
            dueAtPreset={values.dueAtInput || dueAtPreset === 'custom' ? dueAtPreset : null}
            setDueAtPreset={setDueAtPreset}
          />
        </>
      )}

      <MessageSection
        control={control}
        number={isClose ? 2 : 5}
        patientMessageLength={values.patientMessage?.length ?? 0}
        caseNote={caseData.internalNote}
      />
    </Stack>
  )

  const aside = (
    <>
      <AsideTitle>{t('triage.decision')}</AsideTitle>
      <DecisionRows rows={rows} />
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={missing > 0 || isSubmitting}
        onClick={() => {
          if (isClose) setConfirmClose(true)
          else void submit()
        }}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{ py: 1.25, borderRadius: 2 }}
      >
        {isSubmitting ? t('triage.submitting') : t('triage.submit')}
      </Button>
      <Typography sx={{ fontSize: 12, color: tokens.textSecondary, textAlign: 'center' }}>
        {missing > 0
          ? t('triage.missingRequired', { count: missing })
          : isClose
            ? t('triage.closeNoWorklist')
            : t('triage.createsTask')}
      </Typography>
      {asideFooter}
      <ConfirmDialog
        open={confirmClose}
        title={t('triage.closeConfirmTitle')}
        message={t('triage.closeConfirmMessage')}
        confirmLabel={getContactModeLabel('CLOSE')}
        confirmColor="primary"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false)
          void submit()
        }}
      />
    </>
  )

  return <TriageLayout main={main} aside={aside} />
}
