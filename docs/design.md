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
- Selection rule: by default the latest ACTIVE journey for a patient is used for dashboard/step computation; document or change as required.

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
- Case services & transitions: [src/api/service/cases.ts](src/api/service/cases.ts)
- Journey resolution: [src/api/service/journeyResolver.ts](src/api/service/journeyResolver.ts)
- Policy parser: [src/api/policyParser/parser.ts](src/api/policyParser/parser.ts)
- Journal renderer: [src/api/journalRenderer.ts](src/api/journalRenderer.ts)
- Seeds show examples: [src/api/seed](src/api/seed)

Gaps & recommendations

- `PatientJourney.status` lifecycle lacks enforced transitions in service layer; consider adding explicit guards if needed.
- Case → PatientJourney relationship is implicit; document selection rule or introduce explicit relation if business requires.
- Verify template tokens in seeds against the renderer whitelist and update either templates or whitelist to avoid rendering surprises.
- Document score alias naming conventions for policy authors to avoid collisions.

Diagrams

- See `docs/diagrams/` for PlantUML sources and rendered SVGs: component, state, class (ERD), and sequence diagrams for triage/policy and journal generation.

Next steps

- Review this doc for domain accuracy; I will then add or adjust diagrams and (optionally) render SVGs locally or via CI.
