import { z } from 'zod'

import { AuditEventSchema } from './audit'
import { CaseSchema } from './case'
import { FormResponseSchema } from './forms'
import { JournalDraftSchema, JournalTemplateSchema } from './journal'
import {
  ConsentSchema,
  EpisodeOfCareSchema,
  InstructionSchema,
  InstructionTemplateSchema,
  JourneyTemplateSchema,
  PatientJourneySchema,
  ResearchModuleSchema,
} from './journey'
import { PatientSchema } from './patient'
import { PolicyRuleSchema } from './policy'
import { FormSeriesSchema, QuestionnaireTemplateSchema } from './questionnaire'
import { UserSchema } from './users'

export const AppStateSchema = z.object({
  schemaVersion: z.number().int().default(0),
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
  episodesOfCare: z.array(EpisodeOfCareSchema).default([]),
  instructions: z.array(InstructionSchema).default([]),
  instructionTemplates: z.array(InstructionTemplateSchema),
  researchConsents: z.array(ConsentSchema).default([]),
})
export type AppState = z.infer<typeof AppStateSchema>
