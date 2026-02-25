**Data Model — Detailed Fields**

This document expands the core entities with field-level detail and references to the canonical Zod schemas in the codebase.

Patient (src/api/schemas/patient.ts)

- id: string (uuid)
- displayName: string
- personalNumber: string | null
- dateOfBirth: string (ISO)
- palId: string | null (user id of PAL)
- lastOpenedAt: string | null (ISO)
- createdAt: string (ISO)

Case (src/api/schemas/case.ts)

- id: string
- patientId: string (FK → Patient.id)
- status: enum (NEW, NEEDS_REVIEW, TRIAGED, FOLLOWING_UP, CLOSED)
- category: enum (ACUTE, SUBACUTE, CONTROL)
- triggers: string[] (named trigger keys)
- policyWarnings: {ruleId, message, severity, resolvedVars}[]
- nextStep: enum (digital, doctorVisit, nurse, physio, phone, none)
- assignedRole: enum (SSK, DOCTOR, PAL) | null
- assignedUserId: string | null
- deadline: string | null (ISO)
- createdAt, lastActivityAt: string (ISO)

PatientJourney (src/api/schemas/journey.ts)

- id: string
- patientId: string
- journeyTemplateId: string
- startDate: string (ISO)
- status: enum (ACTIVE, SUSPENDED, COMPLETED)
- modifications: partial overrides of entries
- createdAt, updatedAt

JourneyTemplateEntry

- id: string
- templateId: string
- order: number
- offsetDays: number
- windowDays: number
- scoreAliases: Record<string, string> (alias → score path)
- dashboardCategory: enum

FormResponse (src/api/schemas/forms.ts)

- id: string
- patientId: string
- templateId: string
- caseId: string | null
- answers: Record<string, number | string | boolean>
- scores: Record<string, number> (computed using scoringRules)
- submittedAt: string (ISO)

QuestionnaireTemplate (src/api/schemas/questionnaire.ts)

- id: string
- questions: {id, type, label, options?}[]
- scoringRules: {id, expression, aggregation}[]

JournalDraft (src/api/schemas/journal.ts)

- id, caseId, templateId
- content: string
- status: enum (DRAFT, APPROVED)
- createdByUserId, createdAt, updatedAt

PolicyRule (src/api/schemas/policy.ts)

- id, name, expression (string), severity (LOW/MEDIUM/HIGH), enabled, createdAt

AuditEvent (src/api/schemas/audit.ts)

- id, caseId, userId, userRole, action, details (free-form), timestamp

Notes

- The codebase stores journeys by `patientId` and the UI resolves the most relevant/ACTIVE journey when computing effective steps. There is no explicit Case→PatientJourney foreign key; document this when evolving the model.
