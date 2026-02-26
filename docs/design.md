**Design Document — Duk Demo (English)**

Executive summary

- Purpose: A public demo showing how clinical staff (Nurse/Doctor/PAL) triage, decide and close or schedule follow-ups for problem patients. All data is fake/pseudonymised.
- Deliverables: dashboard queues, case detail triage flow, policy rules, secure journal templates, demo tools (export/import/reset/re-seed), accessibility and keyboard navigation.

Goals & constraints

- Tech: React + TypeScript (Vite), MUI, React Hook Form + zod, i18next, react-router.
- Backend: in-memory API + localStorage via API client; simulate network latency and failures.
- Tests: Vitest + React Testing Library.

Core roles

- Patient: open app, fill forms, request contact, view follow-up plan.
- Nurse (SSK): triage within scope, document contact attempts, create journal drafts.
- Doctor: triage + approve journal drafts.
- Patient Responsible Physician (PAL): doctor with filters (My patients / My created cases / All).

Workflows (high-level)

- Dashboard: three queues (Acute 0–2w, Subacute 3–8w, Follow-up 9w+) with filters and search.
- Case detail: patient summary, triggers, latest forms, policy warnings, tabs (Forms, Triage, Journal, Audit).
- Triage form: nextStep, deadline, internal note, patient message, assignToRole, submit -> update backend + audit event.

State machine (case lifecycle)

- States: NEW → NEEDS_REVIEW → TRIAGED → FOLLOWING_UP → CLOSED
- Valid transitions enforced in code (see mapping in [src/api/service/cases.ts](src/api/service/cases.ts)).
- Audit events emitted on state change.

Patient journeys

- A patient may have multiple concurrent `PatientJourney` instances. A journey defines a series of follow-ups (entries) with an offset and window relative to `startDate`.
- The UI resolves effective steps via `getEffectiveSteps` ([src/api/service/journeyResolver.ts](src/api/service/journeyResolver.ts)).
- Selection rule: by default the latest ACTIVE journey for a patient is used for dashboard/step computation.
- **Journey switching with date reset**: clinicians can switch between templates (e.g., non-op → surgery → post-op) using `SWITCH_TEMPLATE`. When switching, a new start date can be set (e.g. surgery date) so all subsequent steps recalculate relative to the new anchor.
- **Instruction steps**: each `JourneyTemplateEntry` can carry physio/patient instructions — either inline text (`instructionText`) or a reference to a reusable `InstructionTemplate` (`instructionTemplateId`). Instructions are hydrated at resolution time and rendered as collapsible panels in the timeline.
- **Template inheritance**: templates can be derived from a parent via `deriveJourneyTemplate` (copy-on-derive). The `computeParentDiff` / `applyParentDiff` functions let clinicians selectively sync changes from the parent after it evolves.

Patient registration & journey assignment

- A dedicated `/patients` page allows clinicians to register new patients and assign them to a journey template with a configurable reference date (e.g. surgery date, injury date).
- The registration wizard is a 3-step flow: patient details → journey assignment → review & confirm.
- Patients can also have journeys assigned later via an "Assign Journey" action on the patients table.

InstructionTemplates

- `InstructionTemplate` is a reusable entity (id, name, content, tags) for physio protocols, wound care instructions, post-op guidance, etc.
- Managed in the Journey Editor under the "Instructions" tab.
- CRUD: `saveInstructionTemplate`, `deleteInstructionTemplate` in [src/api/service/instructionTemplates.ts](src/api/service/instructionTemplates.ts).
- Seed provides 4 templates: proximal humerus, distal radius, wound care, post-op general.

Patient care plan

- The Patient view (`/patient`) displays a "My Care Plan" section showing the read-only journey timeline with resolved instructions for the patient's active journey.

Policy & templating

- Policy: user-editable rules with a safe expression language (identifiers, + - _ /, comparisons, parentheses). Evaluator is implemented without `eval` ([src/api/policyParser/_](src/api/policyParser)).
- Policy evaluation runs against an assembled numeric scope (answers + aliased scores) and produces `policyWarnings` on cases ([src/api/service/policy.ts](src/api/service/policy.ts)).
- Journal templates: secure Mustache-like renderer with a whitelist of tokens and limited `{{#if FLAG}}` conditionals ([src/api/journalRenderer.ts](src/api/journalRenderer.ts)).

Data model (core entities)

- Patient, Case, PatientJourney, JourneyTemplateEntry, FormResponse, QuestionnaireTemplate, JournalDraft, PolicyRule, AuditEvent.
- Case ↔ Patient: `case.patientId` links to patient. PatientJourney is linked by `patientId`; there is no explicit Case → PatientJourney FK (selection uses latest ACTIVE journey).

Mapping to implementation

- Enums & statuses: [src/api/schemas/enums.ts](src/api/schemas/enums.ts)
- Case schema & triage: [src/api/schemas/case.ts](src/api/schemas/case.ts)
- Patient & journeys: [src/api/schemas/patient.ts](src/api/schemas/patient.ts), [src/api/schemas/journey.ts](src/api/schemas/journey.ts)
- Instruction templates: [src/api/service/instructionTemplates.ts](src/api/service/instructionTemplates.ts)
- Journey template derivation & sync: [src/api/service/journeyTemplates.ts](src/api/service/journeyTemplates.ts) (`deriveJourneyTemplate`, `computeParentDiff`, `applyParentDiff`)
- Patient CRUD: [src/api/service/patients.ts](src/api/service/patients.ts) (`createPatient`)
- Case services & transitions: [src/api/service/cases.ts](src/api/service/cases.ts)
- Journey resolution: [src/api/service/journeyResolver.ts](src/api/service/journeyResolver.ts) (now hydrates `resolvedInstruction`)
- Policy parser: [src/api/policyParser/parser.ts](src/api/policyParser/parser.ts)
- Journal renderer: [src/api/journalRenderer.ts](src/api/journalRenderer.ts)
- Seeds show examples: [src/api/seed](src/api/seed)
- Patient registration UI: [src/pages/Patients.tsx](src/pages/Patients.tsx)

Gaps & recommendations

- Case → PatientJourney relationship is implicit; document selection rule or introduce explicit relation if business requires.
- Verify template tokens in seeds against the renderer whitelist and update either templates or whitelist to avoid rendering surprises.
- Document score alias naming conventions for policy authors to avoid collisions.
- Template derivation currently uses offset+order as a stable matching key for diffs; consider using a persistent entry UUID across parent/child for more robust tracking.
- The patient care plan in patient view shows steps without form response status (all appear as UPCOMING) — connect to case form responses if per-step completion tracking is needed.

Diagrams

All diagrams are maintained as PlantUML sources in `docs/diagrams/` with pre-rendered SVGs.

### Architecture

![High-level Architecture](diagrams/high-level-architecture.svg)

### Core Data Model (ERD)

![Core Data Model](diagrams/core-data-model.svg)

### Case Lifecycle

![Case Lifecycle](diagrams/case-lifecycle.svg)

### Patient Journey Lifecycle

![Patient Journey Lifecycle](diagrams/patient-journey-lifecycle.svg)

### Dashboard / Journey Computation

![Dashboard Journey Computation](diagrams/dashboard-journey-computation.svg)

### Triage → Policy Evaluation

![Triage Policy Sequence](diagrams/triage-policy-sequence.svg)

### Journal Draft Generation

![Journal Generation](diagrams/journal-generation.svg)

### Score Aliasing

![Score Aliasing](diagrams/score-aliasing.svg)

### Policy Expression Grammar

![Policy Grammar](diagrams/policy-grammar.svg)

See the sub-documents for additional context on each diagram.
