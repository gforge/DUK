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

Journey pause & resume

- Clinicians can pause a journey (`pauseJourney`) when clinical care is interruped (e.g. hospitalisation). Setting `status = SUSPENDED` freezes the timeline without rewriting any stored dates.
- `pausedAt` records the exact timestamp the pause started. `totalPausedDays` accumulates whole days across all previous pauses.
- `resumeJourney` computes the elapsed whole days since `pausedAt`, adds them to `totalPausedDays`, clears `pausedAt`, and restores `status = ACTIVE`.
- `getEffectiveSteps` dynamically computes `totalPauseShift = totalPausedDays + currentPauseDays` and applies it to every step's scheduled date. Nothing is written to the store during display — the shift is a pure calculation.
- The `JourneyTab` (clinician view) shows a pause/resume button and a live paused-days banner while a journey is suspended.

Journey cancellation

- Clinicians can cancel a journey using the "Avbryt resa" button, visible on `ACTIVE` and `SUSPENDED` journeys in `JourneyHeader`.
- **No recorded data** (no linked form responses, no recurring completions): the journey is deleted entirely from the store and disappears from all views.
- **Has recorded data**: the journey is marked `COMPLETED` and a `CANCEL` `JourneyModification` with mandatory reason text (≥ 5 characters) is appended. The record is preserved as an audit trail.
- `CancelJourneyDialog` shows a severity-appropriate alert (`error` for delete, `warning` for archive) and disables confirm until a valid reason is entered.
- Form responses are never deleted regardless of outcome.

Multiple parallel journeys

- A patient may have many concurrent `PatientJourney` records (e.g. wrist fracture programme + hip fracture programme running simultaneously).
- `JourneyTab` (CaseDetail) and `PatientCareplan` (PatientView) render all journeys in MUI `Tabs`, sorted ACTIVE → SUSPENDED → COMPLETED, newest first within each status group.
- `getMergedDueStepsForPatient(patientId, date)` in `journeyResolver.ts` collects due steps from all ACTIVE journeys and deduplicates by `templateEntryId`. This prevents the same questionnaire appearing twice on the dashboard even when two parallel journeys share overlapping windows.

Research consent

- `hasActiveConsent(patientId, moduleId, journeyId)` returns `false` after revocation; granting again creates a new record.
- `revokeConsent` sets `revokedAt` and `revokedByUserId`. The original record is kept as a permanent audit trail; a new grant after revocation creates a fresh record.
- The UI uses `ConsentDialog` (renders `studyInfoMarkdown` via `react-markdown` + checkbox acknowledgement) and `RevokeConsentDialog` (confirmation step). Both live in `src/components/journey/ConsentDialog.tsx`.

Patient questionnaire form (self-service)

- `PatientDueForms` fetches due steps for the logged-in patient via `getMergedDueStepsForPatient(patientId, today)` and lists them as cards with template name, scheduled date, and an overdue chip.
- Clicking a card replaces the Patient view with `PatientQuestionnaireForm`, which renders all five question types: `SCALE` (MUI Slider with marks), `BOOLEAN` (RadioGroup), `TEXT` (multiline TextField), `SELECT` (MUI Select), and `NUMBER` (numeric TextField with min/max).
- On submit, the component constructs a `JourneyStepContext` from the `MergedDueStep` and calls `client.submitFormResponse`, then returns to the due-forms list and triggers a refetch.
- Validation requires all non-optional questions before submission is enabled.

Nurse contact actions

- When a case has a `SEEK_CONTACT` or `NOT_OPENED` trigger and the viewer is a clinician, a contextual action banner (`NurseContactActions`) appears on the CaseDetail page between the patient card and the tab panel.
- The banner text is driven by the trigger type: `SEEK_CONTACT` → "The patient is requesting contact…"; `NOT_OPENED` → "The patient has not opened the form…".
- Two quick-action buttons are provided: **Contacted** and **Reminder sent**. Each writes a `CONTACTED` or `REMINDER_SENT` audit event via `logContactEvent` in `src/api/service/audit.ts`.
- The Audit Log tab translates these action keys via i18n keys `audit.actions.CONTACTED` and `audit.actions.REMINDER_SENT`.
- The panel is hidden when the case status is `CLOSED`.

Clinician patient detail page

- `/patients/:id` renders `PatientDetail.tsx` — a dedicated single-patient view for clinicians.
- Sections: breadcrumb navigation (Patients → patient name), patient summary card (name, PNR, DOB, `lastOpenedAt`, `createdAt`), cases table (clickable rows → `/cases/:id`; shows status, category, trigger count, last activity), journeys table (template name, status chip, start date), and research consents table (study name, granted/revoked dates).
- Data is fetched from five client calls: `getPatient`, `getCasesByPatient`, `getPatientJourneys`, `getJourneyTemplates`, `getResearchConsents`.
- The patient avatar icon in `PatientCard` (on `CaseDetail`) is clickable and navigates to `/patients/:id`. The `CaseDetail` breadcrumb also links: Dashboard → Patient name → Case detail.
- `PatientTable` on `/patients` shows a "Visa patient" button per row (navigates to `/patients/:id`) and a `JourneyChips` status summary. The quick-assign journey button has been removed; journey management is handled from the patient detail page.

Global patient search

- A search icon button (`GlobalSearch`) in the TopBar is visible to clinicians (NURSE/DOCTOR/PAL) and hidden for PATIENT role.
- Clicking the button opens a full-width dialog with an autofocused text field. All patients are fetched once on first open (subsequent opens reuse the cached list).
- Filtering is performed client-side by `displayName` or `personalNumber`, returning up to 10 results.
- Selecting a result closes the dialog and navigates to `/patients/:id`.

Print support

- `TopBar` (`displayPrint: 'none'`) and `SideNav` (wrapped in `Box` with `displayPrint: 'none'`) are hidden when the browser prints.
- `AppShell` removes the left margin and toolbar spacer on print so content fills the full page width.
- `JournalTab` has a print icon button (hidden on print itself) that calls `window.print()` to trigger the browser print dialog.

Pagination

- `PatientTable` uses MUI `TablePagination` with page sizes of 25 / 50 / 100 rows.
- The current page clamps to a valid range when the data set shrinks (e.g. after a search filter narrows results), avoiding a `setState`-in-effect anti-pattern.

ConfirmDialog pattern

- Destructive actions across the application use a shared `ConfirmDialog` component (`src/components/common/ConfirmDialog.tsx`) instead of the native `window.confirm()` API.
- Props: `{ open, title, message, confirmLabel?, confirmColor?, onConfirm, onCancel }`. `confirmColor` defaults to `'error'`.
- Used by: journey template deletion, research module deletion, instruction template deletion, questionnaire deletion, journey entry deletion, and booking cancellation.

404 route

- `NotFound.tsx` is the catch-all route (`path="*"` in the router). It renders an error icon, a localised title and message, and a "Go to start page" button that navigates to `/dashboard`.

Data model (core entities)

- Patient, Case, PatientJourney, JourneyTemplateEntry, FormResponse, QuestionnaireTemplate, JournalDraft, PolicyRule, AuditEvent, Consent.
- Case ↔ Patient: `case.patientId` links to patient. PatientJourney is linked by `patientId`; there is no explicit Case → PatientJourney FK (selection uses latest ACTIVE journey).

Mapping to implementation

- Enums & statuses: [src/api/schemas/enums.ts](src/api/schemas/enums.ts)
- Case schema & triage: [src/api/schemas/case.ts](src/api/schemas/case.ts)
- Patient & journeys: [src/api/schemas/patient.ts](src/api/schemas/patient.ts), [src/api/schemas/journey.ts](src/api/schemas/journey.ts)
- Instruction templates: [src/api/service/instructionTemplates.ts](src/api/service/instructionTemplates.ts)
- Journey template derivation & sync: [src/api/service/journeyTemplates.ts](src/api/service/journeyTemplates.ts) (`deriveJourneyTemplate`, `computeParentDiff`, `applyParentDiff`)
- Patient CRUD: [src/api/service/patients.ts](src/api/service/patients.ts) (`createPatient`)
- Case services & transitions: [src/api/service/cases.ts](src/api/service/cases.ts)
- Journey resolution: [src/api/service/journeyResolver.ts](src/api/service/journeyResolver.ts) (`getEffectiveSteps`, `getMergedDueStepsForPatient`)
- Journey pause & resume: [src/api/service/patientJourneys.ts](src/api/service/patientJourneys.ts) (`pauseJourney`, `resumeJourney`, `cancelJourney`)
- Journey cancellation UI: [src/components/case/JourneyTab/CancelJourneyDialog.tsx](src/components/case/JourneyTab/CancelJourneyDialog.tsx)
- JourneyTab sub-components: [src/components/case/JourneyTab/](src/components/case/JourneyTab/) (`useJourneyActions`, `JourneyHeader`, `JourneySelectorTabs`, `PauseConfirmDialog`, `CancelJourneyDialog`)
- Research consent: [src/api/service/researchConsents.ts](src/api/service/researchConsents.ts) (`grantConsent`, `revokeConsent`, `hasActiveConsent`)
- Consent UI: [src/components/journey/ConsentDialog.tsx](src/components/journey/ConsentDialog.tsx)
- Policy parser: [src/api/policyParser/parser.ts](src/api/policyParser/parser.ts)
- Journal renderer: [src/api/journalRenderer.ts](src/api/journalRenderer.ts)
- Seeds show examples: [src/api/seed](src/api/seed)
- Patient registration UI: [src/pages/Patients.tsx](src/pages/Patients.tsx)
- Patient detail page: [src/pages/PatientDetail.tsx](src/pages/PatientDetail.tsx)
- Patient questionnaire form: [src/components/patientView/PatientQuestionnaireForm.tsx](src/components/patientView/PatientQuestionnaireForm.tsx), [src/components/patientView/PatientDueForms.tsx](src/components/patientView/PatientDueForms.tsx)
- Nurse contact actions: [src/components/case/NurseContactActions.tsx](src/components/case/NurseContactActions.tsx), `logContactEvent` in [src/api/service/audit.ts](src/api/service/audit.ts)
- Global patient search: [src/components/layout/GlobalSearch.tsx](src/components/layout/GlobalSearch.tsx)
- Patient table pagination: [src/components/patients/PatientTable.tsx](src/components/patients/PatientTable.tsx)
- Confirm dialog: [src/components/common/ConfirmDialog.tsx](src/components/common/ConfirmDialog.tsx)
- 404 page: [src/pages/NotFound.tsx](src/pages/NotFound.tsx)

Gaps & recommendations

- Case → PatientJourney relationship is implicit; document selection rule or introduce explicit relation if business requires.
- Verify template tokens in seeds against the renderer whitelist and update either templates or whitelist to avoid rendering surprises.
- Document score alias naming conventions for policy authors to avoid collisions.
- Template derivation currently uses offset+order as a stable matching key for diffs; consider using a persistent entry UUID across parent/child for more robust tracking.
- The patient care plan in patient view shows steps without per-step form-response completion status — connect to case form responses if per-step tracking is required.
- Audit log has no search or date-range filter; for large patient cohorts this may become unwieldy.
- No notification or inbox system: clinicians have no in-app indicator of new triggers or unread events other than the dashboard queue.
- Batch operations (bulk triage, bulk journey assignment) are not yet implemented.

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

### Journey Pause & Resume

![Pause Resume Sequence](diagrams/pause-resume-sequence.svg)

### Multiple Parallel Journeys & Form Deduplication

![Multi Journey Tabs](diagrams/multi-journey-tabs.svg)

### Research Consent — Grant & Revoke

![Research Consent Sequence](diagrams/research-consent-sequence.svg)

### Consent Lifecycle

![Consent Lifecycle](diagrams/consent-lifecycle.svg)

See the sub-documents for additional context on each diagram.
