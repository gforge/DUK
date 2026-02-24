import { z } from 'zod'

// ─── Enumerations ───────────────────────────────────────────────────────────

export const RoleSchema = z.enum(['PATIENT', 'NURSE', 'DOCTOR', 'PAL'])
export type Role = z.infer<typeof RoleSchema>

export const CaseStatusSchema = z.enum(['NEW', 'NEEDS_REVIEW', 'TRIAGED', 'FOLLOWING_UP', 'CLOSED'])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

export const CaseCategorySchema = z.enum(['ACUTE', 'SUBACUTE', 'CONTROL'])
export type CaseCategory = z.infer<typeof CaseCategorySchema>

export const TriggerTypeSchema = z.enum([
  'NO_RESPONSE',
  'NOT_OPENED',
  'HIGH_PAIN',
  'INFECTION_SUSPECTED',
  'LOW_FUNCTION',
  'LOW_QOL',
  'SEEK_CONTACT',
  'ABNORMAL_ANSWER',
])
export type TriggerType = z.infer<typeof TriggerTypeSchema>

export const NextStepSchema = z.enum([
  'DIGITAL_CONTROL',
  'DOCTOR_VISIT',
  'NURSE_VISIT',
  'PHYSIO_VISIT',
  'PHONE_CALL',
  'NO_ACTION',
])
export type NextStep = z.infer<typeof NextStepSchema>

export const JournalDraftStatusSchema = z.enum(['DRAFT', 'APPROVED'])
export type JournalDraftStatus = z.infer<typeof JournalDraftStatusSchema>

export const QuestionTypeSchema = z.enum(['SCALE', 'BOOLEAN', 'TEXT', 'SELECT', 'NUMBER'])
export type QuestionType = z.infer<typeof QuestionTypeSchema>

// ─── Questionnaires ─────────────────────────────────────────────────────────

export const QuestionSchema = z.object({
  id: z.string(),
  key: z.string(), // used in policy expressions, e.g. "PNRS_1"
  type: QuestionTypeSchema,
  labelKey: z.string(), // i18n key
  required: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.object({ value: z.string(), labelKey: z.string() })).optional(),
})
export type Question = z.infer<typeof QuestionSchema>

export const QuestionnaireTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  descriptionKey: z.string().optional(),
  questions: z.array(QuestionSchema),
  scoringRules: z.array(
    z.object({
      outputKey: z.string(), // e.g. "OSS.total"
      formula: z.enum(['SUM', 'AVERAGE', 'MAX', 'DIRECT']),
      inputKeys: z.array(z.string()),
      scale: z.number().optional(), // multiply result
    }),
  ),
  createdAt: z.string().datetime(),
})
export type QuestionnaireTemplate = z.infer<typeof QuestionnaireTemplateSchema>

export const FormSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  entries: z.array(
    z.object({
      templateId: z.string(),
      offsetDays: z.number(), // when to send relative to care plan start
      order: z.number(),
    }),
  ),
  createdAt: z.string().datetime(),
})
export type FormSeries = z.infer<typeof FormSeriesSchema>

// ─── Patients ────────────────────────────────────────────────────────────────

export const PatientSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  personalNumber: z.string(), // fake e.g. "19XX0101-XXXX"
  dateOfBirth: z.string(), // YYYY-MM-DD
  palId: z.string().optional(), // user ID of PAL
  lastOpenedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
})
export type Patient = z.infer<typeof PatientSchema>

// ─── Forms / Responses ───────────────────────────────────────────────────────

export const FormResponseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  templateId: z.string(),
  caseId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  scores: z.record(z.string(), z.number()), // e.g. { "OSS.total": 38, "EQ5D.index": 0.7 }
  submittedAt: z.string().datetime(),
  imageUrl: z.string().optional(),
})
export type FormResponse = z.infer<typeof FormResponseSchema>

// ─── Cases ───────────────────────────────────────────────────────────────────

export const PolicyWarningSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  triggeredValues: z.record(z.string(), z.number()),
  expression: z.string(),
})
export type PolicyWarning = z.infer<typeof PolicyWarningSchema>

export const CaseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  category: CaseCategorySchema,
  status: CaseStatusSchema,
  triggers: z.array(TriggerTypeSchema),
  policyWarnings: z.array(PolicyWarningSchema),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  createdByUserId: z.string(),
  triagedByUserId: z.string().optional(),
  nextStep: NextStepSchema.optional(),
  deadline: z.string().optional(), // ISO date string
  internalNote: z.string().optional(),
  patientMessage: z.string().optional(),
  formSeriesId: z.string().optional(),
  scheduledAt: z.string().datetime(), // when this check-in window starts
  lastActivityAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})
export type Case = z.infer<typeof CaseSchema>

// ─── Triage Form Input ────────────────────────────────────────────────────────

export const TriageInputSchema = z.object({
  nextStep: NextStepSchema,
  deadline: z.string().optional(),
  internalNote: z.string().optional(),
  patientMessage: z.string().optional(),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  closeImmediately: z.boolean().default(false),
})
export type TriageInput = z.infer<typeof TriageInputSchema>

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const AuditEventSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  userId: z.string(),
  userRole: RoleSchema,
  action: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
})
export type AuditEvent = z.infer<typeof AuditEventSchema>

// ─── Journal Drafts ───────────────────────────────────────────────────────────

export const JournalDraftSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  templateId: z.string().optional(),
  content: z.string(),
  status: JournalDraftStatusSchema,
  createdByUserId: z.string(),
  approvedByUserId: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type JournalDraft = z.infer<typeof JournalDraftSchema>

// ─── Journal Template ─────────────────────────────────────────────────────────

export const JournalTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(), // Mustache-like template string
  createdAt: z.string().datetime(),
})
export type JournalTemplate = z.infer<typeof JournalTemplateSchema>

// ─── Policy Rule ──────────────────────────────────────────────────────────────

export const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  expression: z.string(), // e.g. "OSS.total < 30"
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
})
export type PolicyRule = z.infer<typeof PolicyRuleSchema>

// ─── Users (fake auth) ────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleSchema,
})
export type User = z.infer<typeof UserSchema>

// ─── App State (full store shape) ────────────────────────────────────────────

export const AppStateSchema = z.object({
  users: z.array(UserSchema),
  patients: z.array(PatientSchema),
  cases: z.array(CaseSchema),
  formResponses: z.array(FormResponseSchema),
  auditEvents: z.array(AuditEventSchema),
  journalDrafts: z.array(JournalDraftSchema),
  journalTemplates: z.array(JournalTemplateSchema),
  policyRules: z.array(PolicyRuleSchema),
  questionnaireTemplates: z.array(QuestionnaireTemplateSchema),
  formSeries: z.array(FormSeriesSchema),
})
export type AppState = z.infer<typeof AppStateSchema>
