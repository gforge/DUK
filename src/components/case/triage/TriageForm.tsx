import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, Case, ContactMode } from '@/api/schemas'
import { useAssigneeLabel, useCareRoleLabel, useContactModeLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

import { AssigneeSection } from './AssigneeSection'
import { CallOutcomeSection } from './CallOutcomeSection'
import { CareRoleSection } from './CareRoleSection'
import { CloseCaseDialog } from './CloseCaseDialog'
import { ContactModeSection } from './ContactModeSection'
import { DueAtField, type DueAtPreset } from './DueAtField'
import {
  AsideTitle,
  Banner,
  type DecisionRow,
  DecisionRows,
  EffectsList,
  OutcomeChip,
  TriageLayout,
  TriageSection,
} from './layout'
import { MessageSection } from './MessageSection'
import { NotReachedSection } from './NotReachedSection'
import { PhoneBox } from './PhoneBox'
import type { RetryPreset } from './retryTime'
import {
  CALL_NOTE_MAX,
  isCallingNow,
  isHandingOver,
  isReplyingNow,
  needsPlanningFields,
  type TriageForm as TriageFormValues,
  TriageFormSchema,
} from './schema'
import { cardSx } from './styles'
import { TimingSection } from './TimingSection'
import {
  type HandledBy,
  type MissingField,
  missingRequired,
  tomorrowMorning,
  toTriageSubmitData,
  type TriageSubmitData,
} from './toSubmitData'
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
  /** The clinician doing the triage; enables "ringer nu" / "svarar nu" in step 2. */
  readonly handledBy?: HandledBy
  readonly patientName?: string
  readonly patientPhone?: string
  /** Earlier unsuccessful call attempts on this case; shown as "försök N". */
  readonly priorCallAttempts?: number
}

type Outcome = 'none' | 'reply' | 'callReached' | 'callNotReached' | 'planned' | 'close'

export default function TriageForm({
  caseData,
  onSubmit,
  contactModeFromRoute,
  onContactModeRouteChange,
  asideFooter,
  handledBy,
  patientName,
  patientPhone,
  priorCallAttempts = 0,
}: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const getContactModeLabel = useContactModeLabel()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssigneeLabel = useAssigneeLabel()
  const { users, teams } = useTriageDirectory()
  const [dueAtPreset, setDueAtPreset] = React.useState<DueAtPreset | null>(null)
  const [retryPreset, setRetryPreset] = React.useState<RetryPreset | null>(null)
  const [confirmClose, setConfirmClose] = React.useState(false)
  const [callStartedAt, setCallStartedAt] = React.useState<Date | null>(null)
  const [withSummary, setWithSummary] = React.useState(false)

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
      xrayBeforeVisit: caseData.triageDecision?.xrayBeforeVisit ?? false,
      handledNow: false,
      callOutcome: null,
      callNote: '',
      notReachedPlan: null,
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
  const isVisit = contactMode === 'VISIT'
  const isPhone = contactMode === 'PHONE'
  const isDigital = contactMode === 'DIGITAL'
  const handledNow = values.handledNow === true
  const replyingNow = isReplyingNow(values)
  const callingNow = isCallingNow(values)
  const callOutcome = values.callOutcome ?? null
  const notReachedPlan = values.notReachedPlan ?? null
  const handingOver = isHandingOver(values)
  const planning = needsPlanningFields(values)
  const canHandleNow = Boolean(handledBy) && (isPhone || isDigital)
  const selfName = users.find((u) => u.id === handledBy?.userId)?.name ?? null

  const clearPlanningFields = React.useCallback(() => {
    setValue('careRole', null)
    setValue('assignmentMode', null)
    setValue('assignedUserIds', [])
    setValue('assignedTeamIds', [])
    setValue('dueAtInput', '')
  }, [setValue])

  const clearCallFields = React.useCallback(() => {
    setValue('callOutcome', null)
    setValue('callNote', '')
    setValue('notReachedPlan', null)
    setRetryPreset(null)
    setCallStartedAt(null)
    setWithSummary(false)
  }, [setValue])

  React.useEffect(() => {
    if (!contactModeFromRoute) return
    setValue('contactMode', contactModeFromRoute, { shouldValidate: true })
    if (contactModeFromRoute === 'CLOSE') clearPlanningFields()
  }, [contactModeFromRoute, setValue, clearPlanningFields])

  function selectMode(mode: ContactMode) {
    setValue('contactMode', mode, { shouldValidate: true })
    if (mode !== 'PHONE' && mode !== 'DIGITAL') setValue('handledNow', false)
    if (mode !== 'PHONE') clearCallFields()
    if (mode === 'CLOSE') clearPlanningFields()
    onContactModeRouteChange?.(mode)
  }

  function selectTiming(now: boolean) {
    setValue('handledNow', now, { shouldValidate: true })
    clearPlanningFields()
    setDueAtPreset(null)
    clearCallFields()
    setValue('patientMessage', caseData.patientMessage ?? '')
    if (now && isPhone) setCallStartedAt(new Date())
  }

  function selectCallOutcome(outcome: 'REACHED' | 'NOT_REACHED') {
    setValue('callOutcome', outcome, { shouldValidate: true })
    setValue('notReachedPlan', null)
    clearPlanningFields()
    setDueAtPreset(null)
    setRetryPreset(null)
    setValue('patientMessage', '')
    setWithSummary(false)
  }

  function selectPlan(plan: 'CALL_AGAIN' | 'ASK_PATIENT_TO_CALL' | 'HAND_OVER') {
    setValue('notReachedPlan', plan, { shouldValidate: true })
    clearPlanningFields()
    setDueAtPreset(null)
    setRetryPreset(null)
    setValue('patientMessage', plan === 'ASK_PATIENT_TO_CALL' ? t('triage.askToCallTemplate') : '')
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
    await onSubmit(toTriageSubmitData(data, handledBy))
  }

  const submit = handleSubmit(submitForm)
  const missing = missingRequired(values)
  const dueIso = planning ? computeDueAtFromInput(values.dueAtInput) : null
  const fmtDate = (iso: string | null) =>
    iso ? format(new Date(iso), 'd MMM yyyy', { locale }) : null
  const fmtDateTime = (iso: string | null) =>
    iso ? format(new Date(iso), 'd MMM HH:mm', { locale }) : null

  const outcome: Outcome = !contactMode
    ? 'none'
    : isClose
      ? 'close'
      : replyingNow
        ? 'reply'
        : callingNow && callOutcome === 'REACHED'
          ? 'callReached'
          : callingNow && callOutcome === 'NOT_REACHED'
            ? 'callNotReached'
            : 'planned'

  // ----- section numbering follows what is shown
  let n = 1
  const next = () => ++n
  const timingNumber = canHandleNow ? next() : null
  const replyNumber = replyingNow ? next() : null
  const outcomeNumber = callingNow ? next() : null
  const callNoteNumber = callingNow && callOutcome === 'REACHED' ? next() : null
  const planNumber = callingNow && callOutcome === 'NOT_REACHED' ? next() : null
  const careRoleNumber = planning ? next() : null
  const assigneeNumber = planning ? next() : null
  const dueNumber = planning ? next() : null
  const messageNumber =
    isClose || planning || (callingNow && notReachedPlan === 'ASK_PATIENT_TO_CALL') ? next() : null

  // ----- decision aside
  const assigneeValue = getAssigneeLabel(
    { assignmentMode, careRole, assignedUserIds, assignedTeamIds },
    users,
    teams,
  )
  const actionValue =
    contactMode === 'DIGITAL'
      ? t('triage.aside.actionValue.DIGITAL')
      : contactMode === 'PHONE'
        ? t('triage.aside.actionValue.PHONE')
        : contactMode === 'VISIT'
          ? t('triage.aside.actionValue.VISIT')
          : null
  const nextStepValue =
    notReachedPlan === 'CALL_AGAIN'
      ? t('triage.aside.nextStep.CALL_AGAIN')
      : notReachedPlan === 'ASK_PATIENT_TO_CALL'
        ? t('triage.aside.nextStep.ASK_PATIENT_TO_CALL')
        : notReachedPlan === 'HAND_OVER'
          ? t('triage.aside.nextStep.HAND_OVER')
          : null
  const effectText = {
    replySent: t('triage.effects.replySent'),
    caseCloses: t('triage.effects.caseCloses'),
    noTask: t('triage.effects.noTask'),
    callLogged: t('triage.effects.callLogged'),
    summarySent: t('triage.effects.summarySent'),
    attemptLogged: t('triage.effects.attemptLogged'),
    retryTask: t('triage.effects.retryTask'),
    askMessage: t('triage.effects.askMessage'),
    awaitTask: t('triage.effects.awaitTask'),
    handOverTask: t('triage.effects.handOverTask'),
    caseStays: t('triage.effects.caseStays'),
    taskCreated: t('triage.effects.taskCreated'),
    formSentOnDue: t('triage.effects.formSentOnDue'),
    callTask: t('triage.effects.callTask'),
    visitTask: t('triage.effects.visitTask'),
  }
  const missingText: Record<MissingField, string> = {
    contactMode: t('triage.missing.contactMode'),
    callOutcome: t('triage.missing.callOutcome'),
    callNote: t('triage.missing.callNote'),
    notReachedPlan: t('triage.missing.notReachedPlan'),
    retryAt: t('triage.missing.retryAt'),
    patientMessage: t('triage.missing.patientMessage'),
    careRole: t('triage.missing.careRole'),
    assignee: t('triage.missing.assignee'),
    dueAt: t('triage.missing.dueAt'),
  }
  const rows: DecisionRow[] = (() => {
    const caseRow = (key: 'closes' | 'followedUp' | 'stays'): DecisionRow => ({
      key: 'case',
      label: t('triage.aside.caseLabel'),
      value: t(`triage.aside.case.${key}`),
    })
    switch (outcome) {
      case 'close':
        return [
          { key: 'mode', label: t('triage.contactModeLabel'), value: getContactModeLabel('CLOSE') },
          caseRow('closes'),
        ]
      case 'reply':
        return [
          {
            key: 'action',
            label: t('triage.aside.action'),
            value: t('triage.aside.actionValue.reply'),
          },
          {
            key: 'when',
            label: t('triage.aside.performed'),
            value: t('triage.aside.performedNow'),
          },
          { key: 'who', label: t('triage.responsible'), value: selfName },
          caseRow('closes'),
        ]
      case 'callReached':
        return [
          { key: 'action', label: t('triage.aside.action'), value: actionValue },
          {
            key: 'when',
            label: t('triage.aside.performed'),
            value: t('triage.aside.performedNow'),
          },
          {
            key: 'outcome',
            label: t('triage.aside.outcome'),
            value: t('triage.callOutcome.REACHED'),
          },
          caseRow('closes'),
        ]
      case 'callNotReached': {
        const who = handingOver ? assigneeValue : selfName
        const due = handingOver
          ? fmtDate(dueIso)
          : notReachedPlan === 'CALL_AGAIN'
            ? fmtDateTime(computeDueAtFromInput(values.dueAtInput))
            : notReachedPlan === 'ASK_PATIENT_TO_CALL'
              ? fmtDateTime(tomorrowMorning())
              : null
        return [
          {
            key: 'outcome',
            label: t('triage.aside.outcome'),
            value: t('triage.callOutcome.NOT_REACHED_short'),
          },
          { key: 'next', label: t('triage.aside.nextStepLabel'), value: nextStepValue },
          { key: 'who', label: t('triage.responsible'), value: who },
          { key: 'due', label: t('triage.dueShort'), value: due },
          caseRow('stays'),
        ]
      }
      case 'planned':
        return [
          { key: 'action', label: t('triage.aside.action'), value: actionValue },
          {
            key: 'role',
            label: t('triage.careRole'),
            value: careRole ? getCareRoleLabel(careRole) : null,
          },
          { key: 'who', label: t('triage.responsible'), value: assigneeValue },
          { key: 'due', label: t('triage.dueShort'), value: fmtDate(dueIso) },
          ...(isVisit && values.xrayBeforeVisit
            ? [{ key: 'xray', label: t('triage.xrayBeforeVisit'), value: t('common.yes') }]
            : []),
          caseRow('followedUp'),
        ]
      default:
        return [
          { key: 'mode', label: t('triage.contactModeLabel'), value: null },
          { key: 'role', label: t('triage.careRole'), value: null },
          { key: 'who', label: t('triage.responsible'), value: null },
          { key: 'due', label: t('triage.dueShort'), value: null },
        ]
    }
  })()

  const chip: { tone: 'info' | 'warning' | 'neutral'; label: string } | null = (() => {
    switch (outcome) {
      case 'reply':
        return { tone: 'info', label: t('triage.aside.chip.reply') }
      case 'callReached':
        return { tone: 'info', label: t('triage.aside.chip.call') }
      case 'callNotReached':
        return {
          tone: 'warning',
          label: t('triage.aside.chip.notReached', { count: priorCallAttempts + 1 }),
        }
      case 'planned':
        return { tone: 'neutral', label: t('triage.aside.chip.planned') }
      case 'close':
        return { tone: 'neutral', label: t('triage.aside.chip.close') }
      default:
        return null
    }
  })()

  const effects: string[] = (() => {
    const e = (k: keyof typeof effectText) => effectText[k]
    switch (outcome) {
      case 'reply':
        return [e('replySent'), e('caseCloses'), e('noTask')]
      case 'callReached':
        return [
          e('callLogged'),
          ...(withSummary && values.patientMessage?.trim() ? [e('summarySent')] : []),
          e('caseCloses'),
          e('noTask'),
        ]
      case 'callNotReached':
        return [
          e('attemptLogged'),
          ...(notReachedPlan === 'CALL_AGAIN' ? [e('retryTask')] : []),
          ...(notReachedPlan === 'ASK_PATIENT_TO_CALL' ? [e('askMessage'), e('awaitTask')] : []),
          ...(notReachedPlan === 'HAND_OVER' ? [e('handOverTask')] : []),
          e('caseStays'),
        ]
      case 'planned':
        return [
          e('taskCreated'),
          ...(isDigital ? [e('formSentOnDue')] : []),
          ...(isPhone ? [e('callTask')] : []),
          ...(isVisit ? [e('visitTask')] : []),
        ]
      case 'close':
        return [e('caseCloses'), e('noTask')]
      default:
        return []
    }
  })()
  const closing = outcome === 'reply' || outcome === 'callReached' || outcome === 'close'

  const submitLabel = isSubmitting
    ? t('triage.submitting')
    : outcome === 'reply'
      ? t('triage.submitLabel.reply')
      : outcome === 'callReached'
        ? t('triage.submitLabel.callReached')
        : outcome === 'callNotReached'
          ? t('triage.submitLabel.callNotReached')
          : outcome === 'close'
            ? getContactModeLabel('CLOSE')
            : t('triage.submit')
  const submitIcon = isSubmitting ? (
    <CircularProgress size={16} color="inherit" />
  ) : outcome === 'reply' ? (
    <SendIcon />
  ) : outcome === 'callReached' ? (
    <PhoneInTalkIcon />
  ) : outcome === 'callNotReached' ? (
    <CheckCircleOutlineIcon />
  ) : outcome === 'close' ? (
    <CheckCircleOutlineIcon />
  ) : undefined

  const main = (
    <Stack sx={{ ...cardSx, p: 3, gap: 3.5 }}>
      <ContactModeSection value={contactMode} onSelect={selectMode} />

      {isVisit && (
        <Controller
          name="xrayBeforeVisit"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ mt: -2 }}
              control={
                <Checkbox
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={t('triage.xrayBeforeVisit')}
            />
          )}
        />
      )}

      {timingNumber && (isPhone || isDigital) && (
        <TimingSection
          number={timingNumber}
          contactMode={contactMode}
          handledNow={handledNow}
          onChange={selectTiming}
        />
      )}

      {replyingNow && (
        <Banner
          tone="info"
          title={t('triage.replyBanner.title')}
          body={t('triage.replyBanner.body')}
        />
      )}

      {replyNumber && (
        <MessageSection
          number={replyNumber}
          control={control}
          required
          rows={5}
          title={t('triage.replyTitle')}
          placeholder={t('triage.replyPlaceholder')}
          hint={selfName ? t('triage.replySigned', { name: selfName }) : undefined}
          patientMessageLength={values.patientMessage?.length ?? 0}
          caseNote={caseData.internalNote}
        />
      )}

      {callingNow && (
        <PhoneBox patientName={patientName ?? ''} phone={patientPhone} startedAt={callStartedAt} />
      )}

      {outcomeNumber && (
        <CallOutcomeSection
          number={outcomeNumber}
          value={callOutcome}
          onChange={selectCallOutcome}
        />
      )}

      {callNoteNumber && (
        <TriageSection
          number={callNoteNumber}
          title={t('triage.callNote.title')}
          required
          id="triage-call-note"
          trailing={
            <Typography component="span" sx={{ fontSize: 12, color: tokens.textSecondary }}>
              {values.callNote?.length ?? 0}/{CALL_NOTE_MAX}
            </Typography>
          }
        >
          <Controller
            name="callNote"
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                multiline
                minRows={4}
                autoFocus
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value.slice(0, CALL_NOTE_MAX))}
                placeholder={t('triage.callNote.placeholder')}
                slotProps={{
                  htmlInput: { maxLength: CALL_NOTE_MAX, 'aria-labelledby': 'triage-call-note' },
                }}
              />
            )}
          />
          <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
            {t('triage.callNote.hint')}
          </Typography>
          {!withSummary ? (
            <Box sx={{ borderTop: `1px solid ${tokens.greyFill}`, pt: 1.5 }}>
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => setWithSummary(true)}
                sx={{ fontWeight: 600, fontSize: 13 }}
              >
                {t('triage.callSummaryLink')}
              </Link>
            </Box>
          ) : (
            <Controller
              name="patientMessage"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  autoFocus
                  label={t('triage.callSummaryLabel')}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value.slice(0, 500))}
                  placeholder={t('triage.callSummaryPlaceholder')}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                />
              )}
            />
          )}
        </TriageSection>
      )}

      {callingNow && callOutcome === 'NOT_REACHED' && (
        <Banner
          tone="warning"
          title={t('triage.notReached.banner.title')}
          body={t('triage.notReached.banner.body')}
        />
      )}

      {planNumber && (
        <NotReachedSection
          number={planNumber}
          value={notReachedPlan}
          onChange={selectPlan}
          retryAt={values.dueAtInput ?? ''}
          onRetryAtChange={(iso) => setValue('dueAtInput', iso, { shouldValidate: true })}
          retryPreset={retryPreset}
          setRetryPreset={setRetryPreset}
        />
      )}

      {isClose && (
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
      )}

      {planning && careRoleNumber && assigneeNumber && dueNumber && (
        <>
          <CareRoleSection number={careRoleNumber} value={careRole} onChange={selectCareRole} />
          <AssigneeSection
            number={assigneeNumber}
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
            number={dueNumber}
            control={control}
            error={errors.dueAtInput}
            // a cleared due date (e.g. after choosing CLOSE) also clears the preset highlight
            dueAtPreset={values.dueAtInput || dueAtPreset === 'custom' ? dueAtPreset : null}
            setDueAtPreset={setDueAtPreset}
          />
        </>
      )}

      {messageNumber && (
        <MessageSection
          number={messageNumber}
          control={control}
          required={notReachedPlan === 'ASK_PATIENT_TO_CALL' && callingNow}
          title={
            callingNow && notReachedPlan === 'ASK_PATIENT_TO_CALL'
              ? t('triage.askToCallTitle')
              : undefined
          }
          hint={
            callingNow && notReachedPlan === 'ASK_PATIENT_TO_CALL'
              ? t('triage.askToCallHint')
              : undefined
          }
          rows={callingNow && notReachedPlan === 'ASK_PATIENT_TO_CALL' ? 4 : 2}
          patientMessageLength={values.patientMessage?.length ?? 0}
          caseNote={caseData.internalNote}
        />
      )}
    </Stack>
  )

  const aside = (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AsideTitle>{t('triage.decision')}</AsideTitle>
        {chip && <OutcomeChip tone={chip.tone}>{chip.label}</OutcomeChip>}
      </Stack>
      <DecisionRows rows={rows} />
      {effects.length > 0 && (
        <EffectsList
          title={t(outcome === 'reply' ? 'triage.aside.whenSend' : 'triage.aside.whenConfirm')}
          items={effects}
          closing={closing}
        />
      )}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={missing.length > 0 || isSubmitting}
        onClick={() => {
          if (isClose) setConfirmClose(true)
          else void submit()
        }}
        startIcon={submitIcon}
        sx={{ py: 1.25, borderRadius: 2 }}
      >
        {submitLabel}
      </Button>
      <Typography sx={{ fontSize: 12, color: tokens.textSecondary, textAlign: 'center' }}>
        {missing.length > 0
          ? t('triage.missingList', { items: missing.map((f) => missingText[f]).join(', ') })
          : outcome === 'reply'
            ? t('triage.irrevocable')
            : outcome === 'close'
              ? t('triage.closeNoWorklist')
              : outcome === 'planned'
                ? t('triage.createsTask')
                : ''}
      </Typography>
      {asideFooter}
      <CloseCaseDialog
        open={confirmClose}
        initialMessage={values.patientMessage ?? ''}
        confirmLabel={getContactModeLabel('CLOSE')}
        onCancel={() => setConfirmClose(false)}
        onConfirm={(patientMessage) => {
          setConfirmClose(false)
          setValue('patientMessage', patientMessage)
          void submit()
        }}
      />
    </>
  )

  return <TriageLayout main={main} aside={aside} />
}
