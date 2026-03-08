import { z } from 'zod'

import { CaseCategorySchema, ReviewTypeSchema } from './enums'

export const PatientJourneyStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED'])
export type PatientJourneyStatus = z.infer<typeof PatientJourneyStatusSchema>

export const JourneyModificationTypeSchema = z.enum(['ADD_STEP', 'REMOVE_STEP', 'CANCEL'])
export type JourneyModificationType = z.infer<typeof JourneyModificationTypeSchema>

/**
 * Semantic role of a PatientJourney phase within an EpisodeOfCare.
 */
export const PhaseTypeSchema = z.enum([
  'REFERRAL',
  'INTAKE',
  'FOLLOWUP',
  'WAITING_LIST',
  'POST_OP',
  'MONITORING',
  'DISCHARGE',
])
export type PhaseType = z.infer<typeof PhaseTypeSchema>

/**
 * Why a new phase was started — the clinical event that triggered the transition.
 */
export const TransitionTriggerTypeSchema = z.enum([
  'REFERRAL_RECEIVED',
  'TRIAGE_DECISION',
  'VISIT_DECISION',
  'SURGERY_SCHEDULED',
  'SURGERY_COMPLETED',
  'PHYSIO_COMPLETED',
  'MILESTONE',
  'MANUAL',
])
export type TransitionTriggerType = z.infer<typeof TransitionTriggerTypeSchema>

/**
 * Embedded on a PatientJourney to record how/why this phase started and
 * which preceding phase it follows.
 */
export const JourneyPhaseTransitionSchema = z.object({
  /** Journey ID of the phase that directly preceded this one. Absent for the first phase. */
  fromJourneyId: z.string().optional(),
  type: TransitionTriggerTypeSchema,
  triggeredAt: z.string().datetime(),
  triggeredByUserId: z.string().optional(),
  note: z.string().optional(),
})
export type JourneyPhaseTransition = z.infer<typeof JourneyPhaseTransitionSchema>

/**
 * Represents a patient's entire care engagement for a single clinical problem,
 * from referral/first contact through to discharge.
 * Contains a sequence of PatientJourney phases.
 */
export const EpisodeOfCareStatusSchema = z.enum(['OPEN', 'COMPLETED', 'DISCHARGED'])
export type EpisodeOfCareStatus = z.infer<typeof EpisodeOfCareStatusSchema>

export const EpisodeOfCareSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  /** Short human-readable title, e.g. "Proximal humerus fracture – March 2026". */
  label: z.string(),
  /** Clinical area for filtering/display, e.g. "Shoulder", "Hip OA". */
  clinicalArea: z.string().optional(),
  status: EpisodeOfCareStatusSchema.default('OPEN'),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable().default(null),
  /** PAL or treating clinician responsible for this episode. */
  responsibleUserId: z.string().optional(),
  /** The primary triage Case linked to this episode. */
  primaryCaseId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type EpisodeOfCare = z.infer<typeof EpisodeOfCareSchema>

/**
 * A reusable instruction template (physio protocol, wound care instructions, etc.)
 * that can be attached to journey steps.
 */
export const InstructionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Markdown content shown to clinicians and patients. */
  content: z.string(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type InstructionTemplate = z.infer<typeof InstructionTemplateSchema>

export const JourneyTemplateInstructionSchema = z.object({
  id: z.string(),
  journeyTemplateId: z.string(),
  instructionTemplateId: z.string(),
  label: z.string().optional(),
  startDayOffset: z.number().int(),
  endDayOffset: z.number().int().optional(),
  order: z.number(),
  tags: z.array(z.string()).default([]),
  /** MUI icon key from JOURNEY_ICON_OPTIONS, e.g. 'FitnessCenter'. */
  icon: z.string().optional(),
})
export type JourneyTemplateInstruction = z.infer<typeof JourneyTemplateInstructionSchema>

export const InstructionStatusSchema = z.enum(['ACTIVE', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED'])
export type InstructionStatus = z.infer<typeof InstructionStatusSchema>

export const InstructionCancelReasonSchema = z.enum(['LATE_JOIN', 'MANUAL'])
export type InstructionCancelReason = z.infer<typeof InstructionCancelReasonSchema>

export const InstructionSchema = z.object({
  id: z.string(),
  patientJourneyId: z.string(),
  journeyTemplateInstructionId: z.string().optional(),
  instructionTemplateId: z.string(),
  label: z.string().optional(),
  startDayOffset: z.number().int(),
  endDayOffset: z.number().int().optional(),
  /** Resolved ISO datetime start, persisted for stable timeline rendering. */
  startAt: z.string().datetime(),
  /** Resolved ISO datetime end, persisted for stable timeline rendering. */
  endAt: z.string().datetime().nullable().default(null),
  status: InstructionStatusSchema.default('ACTIVE'),
  /** Set when status is CANCELLED to record why it was cancelled. */
  cancelReason: InstructionCancelReasonSchema.optional(),
  tags: z.array(z.string()).default([]),
  acknowledgedAt: z.string().datetime().nullable().default(null),
  acknowledgedByUserId: z.string().nullable().default(null),
  completedAt: z.string().datetime().nullable().default(null),
  completedByUserId: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Instruction = z.infer<typeof InstructionSchema>

/**
 * One step inside a reusable journey template.
 * scoreAliases maps raw score keys to semantic journey-relative names,
 * e.g. { "PNRS_2": "PNRS_week4", "OSS.total": "OSS_week4" }.
 * Allows policy rules to reference time-point values independently of journey type.
 */
export const JourneyTemplateEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  offsetDays: z.number(),
  windowDays: z.number().default(2),
  order: z.number(),
  /** Questionnaire template ID — optional; a step may be instruction-only. */
  templateId: z.string().optional(),
  scoreAliases: z.record(z.string(), z.string()).default({}),
  /** Human-readable labels for each alias, used in journal templates via {{label.X}}. */
  scoreAliasLabels: z.record(z.string(), z.string()).default({}),
  /**
   * Short identifier used in policy expressions to disambiguate scores from
   * this step vs. other steps using the same questionnaire template.
   * Auto-derived from `label` (slugified) if not explicitly set.
   * Examples: "week_4", "6m_followup", "baseline".
   */
  stepKey: z.string().optional(),
  /** Which dashboard column is active while this step's window is open. */
  dashboardCategory: CaseCategorySchema.default('CONTROL'),
  /**
   * If set, this step recurs every N days after the previous occurrence is completed.
   * Completion is triggered when the patient submits the linked form.
   * getEffectiveSteps expands this into multiple occurrences up to a 5-year horizon.
   */
  recurrenceIntervalDays: z.number().int().positive().optional(),
  /**
   * Types of clinical reviews (lab results, X-rays) that should be created when this step becomes active.
   */
  reviewTypes: z.array(ReviewTypeSchema).optional(),
  /** MUI icon key from JOURNEY_ICON_OPTIONS, e.g. 'Assignment', 'FitnessCenter'. */
  icon: z.string().optional(),
})
export type JourneyTemplateEntry = z.infer<typeof JourneyTemplateEntrySchema>

export const JourneyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  entries: z.array(JourneyTemplateEntrySchema),
  instructions: z.array(JourneyTemplateInstructionSchema).default([]),
  createdAt: z.string().datetime(),
  /** If derived from another template, the parent's ID is recorded here. */
  parentTemplateId: z.string().optional(),
  /**
   * ISO timestamp of the last time this template was synced with its parent
   * (or the timestamp of derivation if never explicitly synced).
   */
  derivedAt: z.string().optional(),
  /**
   * Human-readable name for the anchor/reference date used when assigning this template.
   * Displayed in the registration dialog instead of the generic "Referensdatum".
   * Examples: "Operationsdatum", "Skadedatum", "Uppföljningsstart".
   */
  referenceDateLabel: z.string().default('Startdatum'),
})
export type JourneyTemplate = z.infer<typeof JourneyTemplateSchema>

export const ResearchModuleEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  replaceStepId: z.string().optional(),
  offsetDays: z.number().optional(),
  templateId: z.string(),
})
export type ResearchModuleEntry = z.infer<typeof ResearchModuleEntrySchema>

export const ResearchModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  studyName: z.string(),
  /** Markdown content shown to the patient in the consent dialog. */
  studyInfoMarkdown: z.string().default(''),
  entries: z.array(ResearchModuleEntrySchema),
  createdAt: z.string().datetime(),
})
export type ResearchModule = z.infer<typeof ResearchModuleSchema>

/**
 * Records a patient's informed consent to participate in a research module.
 * Consent may be revoked; revoked consents are retained for audit purposes.
 */
export const ConsentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  researchModuleId: z.string(),
  patientJourneyId: z.string(),
  grantedAt: z.string().datetime(),
  grantedByUserId: z.string(),
  revokedAt: z.string().datetime().nullable().default(null),
  revokedByUserId: z.string().nullable().default(null),
  /**
   * Free-text reason supplied by the patient when withdrawing consent or declining
   * participation. Stored for GCP ICH E6 audit-trail purposes. May be null when
   * no reason was given or for consents recorded before this field was introduced.
   */
  withdrawalReason: z.string().nullable().default(null),
})
export type Consent = z.infer<typeof ConsentSchema>

export const JourneyModificationSchema = z.object({
  id: z.string(),
  type: JourneyModificationTypeSchema,
  addedByUserId: z.string(),
  addedAt: z.string().datetime(),
  reason: z.string(),
  entry: JourneyTemplateEntrySchema.optional(),
  stepId: z.string().optional(),
  /**
   * Present on REMOVE_STEP when the step is removed because it overlaps with a
   * step in an existing parallel journey. Records which journey the patient will
   * fill this form through instead, providing an audit trail for the merge.
   */
  mergedFromJourneyId: z.string().optional(),
})
export type JourneyModification = z.infer<typeof JourneyModificationSchema>

/**
 * Records one completed occurrence of a recurring step.
 * stepId refers to the base entry id (not the __r0 variant from getEffectiveSteps).
 */
export const RecurringCompletionSchema = z.object({
  stepId: z.string(),
  occurrenceIndex: z.number().int().min(0),
  /** YYYY-MM-DD when the patient submitted the form for this occurrence. */
  completedAt: z.string(),
})
export type RecurringCompletion = z.infer<typeof RecurringCompletionSchema>

export const PatientJourneySchema = z.object({
  id: z.string(),
  /** The EpisodeOfCare this phase belongs to. Required on all journeys. */
  episodeId: z.string(),
  patientId: z.string(),
  journeyTemplateId: z.string(),
  /** Semantic role of this phase within the episode. */
  phaseType: PhaseTypeSchema.default('FOLLOWUP'),
  /** Optional human-readable name for this phase, e.g. "Fracture follow-up". */
  phaseLabel: z.string().optional(),
  /**
   * Clinical anchor date — e.g. surgery date, injury date, referral date.
   * All JourneyTemplateEntry offsetDays are relative to this date.
   */
  startDate: z.string(), // YYYY-MM-DD
  /**
   * Date the patient was formally enrolled/joined this phase.
   * Defaults to startDate. When joinedAt > startDate (late enrolment),
   * steps and instructions whose window has already closed are skipped/cancelled.
   */
  joinedAt: z.string().default(''), // YYYY-MM-DD; empty string coerced to startDate at read time
  /** How and why this phase was started. Absent on the first phase of an episode. */
  transition: JourneyPhaseTransitionSchema.optional(),
  status: PatientJourneyStatusSchema,
  researchModuleIds: z.array(z.string()),
  modifications: z.array(JourneyModificationSchema),
  /** Completion records for recurring steps — drives the next-occurrence date calculation. */
  recurringCompletions: z.array(RecurringCompletionSchema).default([]),
  /**
   * ISO datetime of when the current suspension started.
   * null when the journey is not paused.
   * Set by pauseJourney(), cleared by resumeJourney().
   */
  pausedAt: z.string().datetime().nullable().default(null),
  /**
   * Accumulated whole-day paused duration from all past suspensions.
   * Does NOT include the current ongoing pause (add daysSince(pausedAt) for that).
   * Every resumeJourney() call adds the completed pause duration here and clears pausedAt.
   */
  totalPausedDays: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type PatientJourney = z.infer<typeof PatientJourneySchema>
