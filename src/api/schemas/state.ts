import { z } from 'zod'
import { UserSchema } from './users'
import { PatientSchema } from './patient'
import { CaseSchema } from './case'
import { FormResponseSchema } from './forms'
import { AuditEventSchema } from './audit'
import { JournalDraftSchema, JournalTemplateSchema } from './journal'
import { PolicyRuleSchema } from './policy'
import { QuestionnaireTemplateSchema, FormSeriesSchema } from './questionnaire'
import {
  JourneyTemplateSchema,
  ResearchModuleSchema,
  PatientJourneySchema,
  InstructionTemplateSchema,
} from './journey'

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
  journeyTemplates: z.array(JourneyTemplateSchema),
  researchModules: z.array(ResearchModuleSchema),
  patientJourneys: z.array(PatientJourneySchema),
  instructionTemplates: z.array(InstructionTemplateSchema),
})
export type AppState = z.infer<typeof AppStateSchema>
