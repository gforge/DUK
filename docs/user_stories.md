# User Stories (with Acceptance Criteria)

This document captures the key user stories for the Duk demo application. The list has been translated to English and organised to align with the design document (`docs/design.md`). Acceptance criteria reference behaviours implemented in the codebase (see folder `src/` for services, components and tests).

---

## US1 – PAL dashboard filtering

**As a** Patient‑Responsible Physician (PAL) **I want** to drill into queues and highlight the work that matters most to me:

- see only patients for whom I am the PAL
- see cases that I myself have created/triaged
- easily switch back to the full queue when needed

**Acceptance criteria**

1. Dashboard has filter/toggles: **My patients (PAL)**, **Reported by me**, **All**.
2. When a clinician triages a case, `createdBy`/`triagedBy` fields are set so that the “Reported by me” filter works.
3. Patient cards show a PAL badge when appropriate and the filtering logic matches the badge.

> _Related code_: `src/api/service/cases.ts` (state transitions), `src/store/roleContext.tsx` (role switch), `components/dashboard`.

---

## US2 – Doctor fast triage flow

**As a** Doctor **I want** to move a case from the queue to a decision with minimal clicks:

- open a case from the dashboard
- view a summary (category, triggers, recent scores, policy warnings)
- perform triage and either
  - close the checkpoint immediately (TRIAGED → CLOSED) or
  - schedule follow‑up with a deadline then close (TRIAGED → FOLLOWING_UP → CLOSED)

**Acceptance criteria**

1. UI clearly exposes allowed state transitions (see state machine in `design.md`).
2. Choosing “no action” with no deadline still allows the flow to go directly to CLOSED.
3. An audit event is emitted for every state change.

---

## US3 – Nurse handling “no response / unopened”

**As a** Nurse (SSK) **I want** to see patients needing contact and record what I did:

- both “no response” and “not opened” are managed as the same kind of workflow but shown with different icons/text
- the case detail suggests an action (“Call the patient…”) based on the trigger that raised the alert
- I can mark a demo action such as **Contacted** or **Reminder sent** and it is logged in the audit trail

**Acceptance criteria**

1. Iconography and text differentiate the two triggers while reusing the same workflow code.
2. Case detail page renders the suggested action dynamically.
3. Audit log captures these contact events.

---

## US4 – Patient app experience

**As a** Patient **I want** to open the app, see my scheduled checkpoints, fill in forms and request contact:

- there is a patient‑role view reachable via role switch
- opening the app updates `lastOpenedAt` on the patient record
- forms are validated with zod; submitting creates a `FormResponse` and updates the case’s `lastActivityAt`
- “request contact” actions generate a trigger visible on the staff dashboard

**Acceptance criteria**

1. Patient view exists and respects feature flags.
2. Patient actions update the appropriate timestamps.
3. Triggers are pushed into the dashboard queues.

---

## US5 – Configurable triage policy without eval

**As a** Doctor **I want** a safe, simple way to author policy rules and see when they fire:

- add/remove rules in the policy editor, each with a name, expression and severity
- the expression parser avoids `eval` and supports identifiers, numbers, `+ - * /`, parentheses and comparisons `<= < >= > == !=`
- case detail shows which rules matched and the values used in evaluation
- dashboard cases display a badge/chip when any policy warning exists

**Acceptance criteria**

1. Policy editor CRUD is functional and persisted in state.
2. Evaluator lives in `src/api/policyParser` and is covered by unit tests.
3. UI surfaces matches on both the case detail and the list item.

---

## US6 – Secure journal draft generation

**As a** Doctor **I want** to generate draft journal entries from form answers, preview them, and approve with a click:

- journal text is built using a white‑listed mustache‑like templating language with optional `{{#if}}` conditionals
- no executable code and no user‑defined helpers are permitted
- preview page offers copy‑to‑clipboard
- approving sets status `APPROVED` and emits an audit event
- (optional) nurses can author drafts but only doctors/PALs may approve

**Acceptance criteria**

1. Renderer lives in `src/api/journalRenderer.ts` and enforces the token whitelist.
2. Approval flow is implemented in the UI with appropriate state updates.

---

## US7 – Demo toolkit

**As a** demo user **I want** tools to snapshot, restore and reseed the application state quickly:

- **Export JSON** copies/downloads the current state
- **Import JSON** (paste/upload) replaces the entire state after confirmation
- **Reset** clears all state to empty
- **Re‑seed** repopulates with the predefined seed data
- all actions call the API client and display snackbars for feedback

**Acceptance criteria**

1. Demo tools are accessible from the demo tools page.
2. State mutations are atomic and reflected immediately in the UI.

---

## US8 – Accessibility & keyboard navigation

**As a** user **I want** to navigate efficiently with the keyboard and receive clear focus/ARIA cues:

- dashboard lists support roving tabindex and arrow‑key navigation
- hotkeys: `/` focuses search, `g d` navigates to dashboard, `g c` opens current case
- focus is restored when returning from a case to the dashboard
- at least two automated tests verify keyboard interactions (e.g. arrow nav + hotkey)

**Acceptance criteria**

1. Keyboard helpers are defined in `hooks/useHotkeys.ts` and tested in `src/tests`.
2. Accessibility checks are part of the CI test suite.

---

These stories map directly to the workflows and components described in the design document. They should evolve alongside the implementation, and new stories can be added for additional features (e.g. audit filtering, etc.).

---

## US9 – Journey switching with date reset

**As a** clinician **I want** to switch a patient's journey template (e.g., from non‑op to post‑surgery protocol) and optionally reset the start date to a clinically relevant anchor (e.g. surgery date):

- the modification dialog shows a "New start date" field when switching templates
- all subsequent steps recalculate relative to the new anchor date
- the modification history clearly shows both the template switch and the date change

**Acceptance criteria**

1. `SWITCH_TEMPLATE` modification accepts optional `newStartDate` and `previousStartDate`.
2. After switching, `PatientJourney.startDate` reflects the new date and `getEffectiveSteps` returns dates relative to it.
3. The modification history panel shows a date reset banner when applicable.
4. Unit tests cover SWITCH_TEMPLATE with date reset.

> _Related code_: `src/api/service/patientJourneys.ts`, `src/components/journey/modify/ModifyForms.tsx`, `src/tests/journey.test.ts`.

---

## US10 – Patient registration & journey assignment

**As a** clinician (nurse/doctor/PAL) **I want** to register new patients and assign them to a clinical journey with a configurable reference date:

- a dedicated `/patients` page lists all patients with search/filter
- clicking "Register Patient" opens a 3-step wizard: patient details → journey assignment → review & confirm
- existing patients can have journeys assigned via an "Assign Journey" button on their table row
- the reference date (e.g. surgery date, injury date) becomes the journey's `startDate`

**Acceptance criteria**

1. `/patients` route exists and is accessible to NURSE, DOCTOR, PAL roles via the sidebar.
2. `createPatient` service function creates a new patient record.
3. `assignPatientJourney` assigns a journey template with the selected start date.
4. The patients table shows active journey status per patient.

> _Related code_: `src/pages/Patients.tsx`, `src/api/service/patients.ts`, `src/router/index.tsx`.

---

## US11 – Physio & patient instructions on the timeline

**As a** clinician **I want** to attach physio protocols or care instructions to specific journey steps so patients and staff see relevant guidance at each checkpoint:

- journey template entries can have inline `instructionText` or reference a reusable `InstructionTemplate`
- the timeline renders instructions as collapsible panels with an info icon toggle
- instruction templates are managed in the Journey Editor under an "Instructions" tab with full CRUD

**Acceptance criteria**

1. `JourneyTemplateEntry` supports `instructionText` and `instructionTemplateId` fields.
2. `InstructionTemplate` entity exists with CRUD operations.
3. `getEffectiveSteps` returns `resolvedInstruction` hydrated from the template or inline text.
4. The `JourneyTimeline` component renders collapsible instruction panels.
5. The Journey Editor has an "Instructions" tab for managing reusable templates.
6. Unit tests verify instruction hydration from both template references and inline text.

> _Related code_: `src/api/schemas/journey.ts`, `src/api/service/instructionTemplates.ts`, `src/components/journey/JourneyTimeline.tsx`, `src/components/journey/editor/InstructionTemplatesTab.tsx`.

---

## US12 – Template inheritance & derivation

**As a** clinician **I want** to derive a new journey template from an existing parent, make local changes, and later selectively sync updates from the parent:

- "Derive" button on a template creates a full copy with `parentTemplateId` linkage
- derived templates show a badge indicating their parent
- "Sync from Parent" button computes diffs (added/removed/changed entries) and presents a checklist
- the clinician selects which changes to apply; unselected changes remain as local customisations

**Acceptance criteria**

1. `deriveJourneyTemplate(parentId, newName)` creates a deep copy with `parentTemplateId` and `derivedAt`.
2. Derived entries get new UUIDs (no shared references with parent).
3. `computeParentDiff(childId)` returns `EntryDiff[]` (ADDED, REMOVED, CHANGED).
4. `applyParentDiff(childId, entryIds[])` selectively merges and updates `derivedAt`.
5. The Journey Editor UI shows derive/sync buttons with appropriate dialogs.
6. Unit tests cover derive, diff computation, and selective sync.

> _Related code_: `src/api/service/journeyTemplates.ts`, `src/components/journey/editor/JourneyTemplatesTab.tsx`, `src/tests/journey.test.ts`.

---

## US13 – Patient care plan view

**As a** patient **I want** to see my clinical journey timeline with instructions so I know what to expect at each checkpoint:

- the patient view shows a "My Care Plan" section with the journey timeline
- each step shows its scheduled date, status, and any resolved instructions
- instructions are displayed as collapsible panels identical to the clinician view

**Acceptance criteria**

1. Patient view (`/patient`) fetches the active journey and effective steps.
2. A "My Care Plan" `Paper` section renders a read-only `JourneyTimeline`.
3. Resolved instructions are visible and expandable.

> _Related code_: `src/pages/PatientView.tsx`, `src/components/journey/JourneyTimeline.tsx`.
