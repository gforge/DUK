**Data Model — Detailed Fields**

This document expands the core entities with field-level detail and references to the canonical Zod schemas in the codebase.

![Core Data Model](../diagrams/core-data-model.svg)

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
- startDate: string (ISO; may be reset via SWITCH_TEMPLATE with newStartDate)
- status: enum (ACTIVE, SUSPENDED, COMPLETED)
- researchModuleIds: string[]
- modifications: JourneyModification[]
- createdAt, updatedAt: string (ISO)

JourneyTemplateEntry

- id: string
- label: string
- templateId: string | undefined (questionnaire template; optional for instruction-only steps)
- order: number
- offsetDays: number
- windowDays: number
- scoreAliases: Record<string, string> (raw score key → semantic alias)
- scoreAliasLabels: Record<string, string> (alias → human label)
- dashboardCategory: enum (ACUTE, SUBACUTE, CONTROL)
- instructionText: string | undefined (inline instruction content)
- instructionTemplateId: string | undefined (FK → InstructionTemplate.id; overrides instructionText)

JourneyTemplate

- id: string
- name: string
- description: string | undefined
- entries: JourneyTemplateEntry[]
- parentTemplateId: string | undefined (FK → parent JourneyTemplate.id for derived templates)
- derivedAt: string | undefined (ISO; timestamp of last sync from parent)
- createdAt: string (ISO)

InstructionTemplate (src/api/schemas/journey.ts) — NEW

- id: string
- name: string
- content: string (Markdown content shown to clinicians and patients)
- tags: string[] (e.g., ["physio", "shoulder", "post-op"])
- createdAt: string (ISO)
- updatedAt: string (ISO)

JourneyModification (embedded in PatientJourney.modifications[])

- id: string
- type: enum (ADD_STEP, REMOVE_STEP, SWITCH_TEMPLATE)
- addedByUserId: string
- reason: string
- addedAt: string (ISO)
- entry: JourneyTemplateEntry | undefined (for ADD_STEP)
- stepId: string | undefined (for REMOVE_STEP)
- previousTemplateId, newTemplateId: string | undefined (for SWITCH_TEMPLATE)
- previousStartDate, newStartDate: string | undefined (for SWITCH_TEMPLATE with date reset)

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

- The codebase stores journeys by `patientId` and the UI resolves the most relevant ACTIVE journey when computing effective steps. There is no explicit Case→PatientJourney foreign key.
- `InstructionTemplate` entities are stored in `AppState.instructionTemplates` and referenced from `JourneyTemplateEntry.instructionTemplateId`.
- `JourneyTemplate.parentTemplateId` tracks derivation lineage; `derivedAt` marks the last sync point for `computeParentDiff`.
- The `EffectiveStep` type (returned by `getEffectiveSteps`) includes a `resolvedInstruction?: string` field hydrated from `instructionTemplateId` (preferred) or `instructionText`.
