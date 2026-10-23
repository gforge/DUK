# User Stories (with Acceptance Criteria)

This document captures the key user stories for the Duk demo application. The list has been translated to English and organised to align with the design document (`docs/design.md`). Acceptance criteria reference behaviours implemented in the codebase (see folder `src/` for services, components and tests).

---

## US1 – PAL dashboard filtering

**As a** Patient‑Responsible Physician (PAL) **I want** to drill into queues and highlight the work that matters most to me:

- see only patients for whom I am responsible physician
- see cases that I myself have created/triaged
- easily switch back to the full queue when needed

**Acceptance criteria**

1. The Patientöversikt toolbar has a segmented filter **Alla** / **Mina patienter** / **Anmälda av mig**, shown to DOCTOR and NURSE.
2. When a clinician triages a case, `createdByUserId`/`triagedByUserId` are set so that the “Anmälda av mig” filter works.
3. “Mina patienter” matches the patient-level PAL (`Patient.palId`) against the logged-in user. Journey/episode PAL resolution exists in `palOwnership.ts` but is not used by this filter, and dashboard rows show no PAL badge.

> _Related code_: `src/pages/Dashboard.tsx`, `src/components/dashboard/DashboardToolbar.tsx`, `src/api/service/cases.ts` (state transitions), `src/store/roleContext.tsx` (logged-in user).

---

## US2 – Doctor fast triage flow

**As a** Doctor **I want** to move a case from the queue to a decision with minimal clicks:

- open a case from the dashboard
- view a summary (category, triggers, recent scores, policy warnings)
- fill in a single-page triage form with numbered sections (contact mode, competence, recipient, due date, patient message + internal note) and a sticky “Beslut” aside that summarises the decision and holds the submit button
- perform triage and either
  - close the checkpoint immediately (`contactMode = CLOSE` → status `CLOSED`) or
  - assign a follow‑up task (status `TRIAGED`), which appears in the Worklist for a nurse/secretary to action (`TRIAGED → FOLLOWING_UP → CLOSED`)

**Acceptance criteria**

1. After triage the TriageTab shows a read-only summary of the triage decision (contact mode, care role, assignment, due date, note) — no further action buttons.
2. Choosing `contactMode = CLOSE` (the close-case link under the contact-mode options, confirmed in a dialog) goes directly to CLOSED and creates no worklist task.
3. Recipient can be VSH (`ANY`), `PAL`, one or more named people (`NAMED`) or one or more care teams (`TEAM`); a single named person becomes `assignedUserId`, otherwise the task stays claimable.
4. Triage is blocked while lab/X-ray reviews on the case are unreviewed.
5. An audit event is emitted for every state change.
6. CLOSED cases are hidden from the Patientöversikt queues; cases closed within the last 7 days are shown via a "Visa stängda" toggle at the bottom of each collapsible category section.

> _Related code_: `src/components/case/TriageTab/index.tsx`, `src/components/case/triage/`, `src/api/service/cases.ts` (`triageCase`), `src/tests/triage.flow.test.tsx`.

---

## US3 – Staff contact workflow for unresponsive patients

**As a** clinician or secretary **I want** to see patients needing outreach and record what I did:

- both “no response” and “not opened” are managed as the same kind of workflow but shown with different icons/text
- the case detail suggests an action (“Call the patient…”) based on the trigger that raised the alert
- I can mark an action such as **Contacted**, **Reminder sent** or **Attempted call (not reached)** and it is logged in the audit trail
- the panel shows the date of the most recent reminder so it’s easy to know when we last tried

**Acceptance criteria**

1. Iconography and text differentiate the two triggers while reusing the same workflow code.
2. Case detail page renders the suggested action dynamically and surface the latest reminder timestamp.
3. Audit log captures full history of contact events, including call attempts.
4. The outreach panel is accessible to NURSE, DOCTOR or SECRETARY roles.

> _Related code_: `src/components/case/ContactActions/index.tsx`, `src/api/service/audit.ts` (`logContactEvent`), audit i18n keys `audit.actions.CONTACTED` / `audit.actions.REMINDER_SENT` / `audit.actions.CALL_ATTEMPT`.

---

## US4 – Patient app experience

**As a** Patient **I want** to open the app, see my scheduled checkpoints, fill in forms and request contact:

- there is a patient‑role view reachable by logging in as the demo patient
- opening the app updates `lastOpenedAt` on the patient record
- forms are validated with zod; submitting creates a `FormResponse` and updates the case’s `lastActivityAt`
- “request contact” actions generate a trigger visible on the staff dashboard

**Acceptance criteria**

1. Patient view (`/patient`) exists and is only rendered for the PATIENT role; other roles are redirected to the dashboard.
2. Patient actions update the appropriate timestamps.
3. Triggers are pushed into the dashboard queues.
4. Due questionnaire steps are listed with template name, scheduled date, and overdue indicator.
5. The questionnaire form renders all five question types (SCALE, BOOLEAN, TEXT, SELECT, NUMBER) and validates required fields before submission.

> _Related code_: `src/pages/PatientView.tsx`, `src/components/patientView/PatientDueForms/index.tsx`, `src/components/patientView/PatientQuestionnaireForm/index.tsx`, `src/components/patientView/PatientActions/index.tsx`.

## US5 – Configurable triage policy without eval

**As a** Doctor **I want** a safe, simple way to author policy rules and see when they fire:

- add/edit/remove rules in the policy editor (Triagepolicyer), each with a name, expression, severity and optional description, scoped to a journey template
- enable/disable rules with a switch without deleting them
- the expression parser avoids `eval` and supports identifiers, numbers, `+ - * /`, unary minus, parenthesised arithmetic, comparisons `<= < >= > == !=` and `&& ||`
- case detail shows which rules matched and the values used in evaluation
- dashboard cases display a badge/chip when any policy warning exists

**Acceptance criteria**

1. Policy editor CRUD is functional and persisted in state; a template picker selects which journey template's rules are shown.
2. The rule dialog validates the expression (zod + `validateExpression`) and lists alias variables for the selected template; a help dialog documents the syntax.
3. Evaluator lives in `src/api/policyParser` and is covered by unit tests.
4. Warnings are evaluated on form submission and stored on the case; UI surfaces matches (with triggered values) on both the case header and the dashboard row.

> _Related code_: `src/pages/PolicyEditor.tsx`, `src/components/policy/`, `src/api/policyParser/`, `src/api/service/policy.ts`, `src/tests/policy.test.ts`, `src/tests/policyRulesTable.test.tsx`. See `docs/design/policy.md`.

---

## US6 – Secure journal draft generation

**As a** Doctor **I want** to generate draft journal entries from form answers, preview them, and approve with a click:

- journal text is built using a white‑listed mustache‑like templating language with optional `{{#if}}` conditionals
- no executable code and no user‑defined helpers are permitted
- preview page offers copy‑to‑clipboard
- approving sets status `APPROVED` and emits an audit event
- nurses can generate drafts but only doctors may approve
- deselecting a journal template deletes its draft (audit event `JOURNAL_DRAFT_DELETED`)

**Acceptance criteria**

1. Renderer lives in `src/api/journalRenderer.ts` and enforces the token whitelist.
2. Approval flow is implemented in the UI with appropriate state updates.
3. `deleteJournalDraft(draftId, ...)` removes the draft and logs an audit event.

> _Related code_: `src/api/journalRenderer.ts`, `src/api/service/journal.ts`, `src/components/case/JournalTab/index.tsx`, `src/components/case/JournalDraftCard.tsx`.

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
- hotkeys: `/` focuses dashboard search, `g d` navigates to dashboard (`g c` is registered on case detail but is a no-op)
- focus is restored when returning from a case to the dashboard
- at least two automated tests verify keyboard interactions (e.g. arrow nav + hotkey)

**Acceptance criteria**

1. Keyboard helpers are defined in `hooks/useHotkeys.ts` and tested in `src/tests`.
2. Accessibility checks are part of the CI test suite.

---

These stories map directly to the workflows and components described in the design document. They should evolve alongside the implementation, and new stories can be added for additional features (e.g. audit filtering, etc.).

---

## US9 – Journey phase transitions within an episode

**As a** clinician **I want** to transition a patient from one clinical phase to the next (for example referral -> intake -> follow-up) while preserving episode continuity:

- the previous journey phase is completed when the next phase starts
- the new phase keeps the same `episodeId` and records transition metadata
- the transition stores trigger type, actor, and optional note for auditability

**Acceptance criteria**

1. `startNextPhase(...)` marks `fromJourneyId` as `COMPLETED`.
2. A new `PatientJourney` is created with the same `episodeId`, requested `phaseType`, and transition metadata.
3. New phase assignment instantiates instruction records from the selected template.
4. Unit tests cover phase transition state updates and episode continuity.

> _Related code_: `src/api/service/patientJourneys.ts`, `src/api/schemas/journey.ts`, `src/tests/journey.test.ts`.

---

## US10 – Patient registration & journey assignment

**As a** clinician (nurse/doctor) **I want** to register new patients and assign them to a clinical journey with a configurable reference date:

- a dedicated `/patients` page lists all patients with search/filter
- clicking "Register Patient" opens a 4-step wizard: patient details → journey assignment → research studies → review & confirm
- existing patients can have journeys assigned via an "Assign Journey" button on their table row
- the reference date (e.g. surgery date, injury date) becomes the journey's `startDate`

**Acceptance criteria**

1. `/patients` route exists and is accessible to NURSE, DOCTOR and SECRETARY roles via the sidebar; the table can be filtered to all patients, my patients (PAL) or patients without an active journey, and by journey template.
2. `createPatient` service function creates a new patient record.
3. `assignPatientJourney` assigns a journey template with the selected start date.
4. The patients table shows active journey status per patient.

> _Related code_: `src/pages/Patients.tsx`, `src/api/service/patients.ts`, `src/router/index.tsx`.

---

## US11 – Physio & patient instructions on the timeline

**As a** clinician **I want** to schedule patient instructions separately from follow-up steps so guidance can be managed independently:

- journey templates include dedicated `instructions[]` schedules referencing reusable `InstructionTemplate`
- patient journeys instantiate persisted `Instruction` records with status lifecycle (ACTIVE/ACKNOWLEDGED/COMPLETED/CANCELLED)
- the UI renders follow-up timeline and instruction timeline as separate sections
- instruction templates are managed in the Journey Editor under an "Instructions" tab with full CRUD

**Acceptance criteria**

1. `JourneyTemplate.instructions` stores `JourneyTemplateInstruction` schedule records.
2. `InstructionTemplate` entity exists with CRUD operations.
3. `assignPatientJourney` instantiates patient-level `Instruction` records from template schedules.
4. The case/patient journey views render instructions in a dedicated instruction timeline.
5. The Journey Editor supports editing template-level instruction schedules.
6. Unit tests verify instruction lifecycle and resolved instruction rendering via instruction APIs.

> _Related code_: `src/api/schemas/journey.ts`, `src/api/service/instructions.ts`, `src/components/journey/InstructionTimeline.tsx`, `src/components/journey/editor/JourneyTemplatesTab/TemplateInstructionsDialog.tsx`.

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

> _Related code_: `src/api/service/journeyTemplates.ts`, `src/components/journey/editor/JourneyTemplatesTab/`, `src/tests/journey.test.ts`.

---

## US13 – Patient care plan view

**As a** patient **I want** to see my clinical journey timeline with instructions so I know what to expect at each checkpoint:

- the patient view shows a "My Care Plan" section with separate follow-up and instruction sections
- follow-up steps are rendered in a read-only `JourneyTimeline`
- instructions are rendered in a dedicated `InstructionTimeline` with status and active-range information

**Acceptance criteria**

1. Patient view (`/patient`) fetches the active journey and effective steps.
2. A "My Care Plan" `Paper` section renders a read-only `JourneyTimeline` for follow-up steps.
3. Patient instructions are fetched via instruction APIs and rendered separately using `InstructionTimeline`.

> _Related code_: `src/pages/PatientView.tsx`, `src/components/patientView/PatientCareplan/main.tsx`, `src/components/journey/InstructionTimeline.tsx`, `src/components/journey/JourneyTimeline/main.tsx`.

---

## US14 – Pause & resume a patient journey

**As a** clinician **I want** to temporarily pause a patient’s journey when clinical circumstances prevent scheduled follow-ups (e.g. hospitalisation, patient travel), and later resume it so that all remaining steps shift forward by the accumulated pause duration:

- a pause button is available on the journey tab; clicking it shows a confirmation dialog
- while suspended, the timeline shows a banner with the number of days paused so far and a resume button
- all scheduled step dates in the paused journey shift forward dynamically — no manual rescheduling needed
- resuming the journey records the total elapsed pause days and restores ACTIVE status

**Acceptance criteria**

1. `pauseJourney(journeyId)` transitions `status` from `ACTIVE` → `SUSPENDED`, sets `pausedAt` to the current timestamp, and does not rewrite any step dates in the store.
2. `resumeJourney(journeyId)` transitions `status` from `SUSPENDED` → `ACTIVE`, computes whole elapsed days, accumulates into `totalPausedDays`, and clears `pausedAt`.
3. `getEffectiveSteps` shifts every scheduled date by `totalPausedDays + currentPauseDays`; for a currently-suspended journey `currentPauseDays` is computed live without a store write.
4. The `JourneyTab` component shows a paused-days banner and a resume button while the journey is `SUSPENDED`.
5. Pausing a non-ACTIVE journey and resuming a non-SUSPENDED journey both throw with a descriptive error.
6. Unit tests verify status transitions, `totalPausedDays` accumulation, and the step-date shift.

> _Related code_: `src/api/service/patientJourneys.ts`, `src/api/service/journeyResolver.ts`, `src/components/case/JourneyTab/index.tsx`, `src/tests/journey.test.ts`.

---

## US15 – Multiple parallel journeys per patient

**As a** clinician **I want** to assign multiple concurrent care journeys to a patient (e.g. one for a wrist fracture and one for a hip fracture) and have the UI present them clearly without duplicating questionnaires:

- the journey tab on a case detail shows all journeys in labelled tabs, sorted ACTIVE → SUSPENDED → COMPLETED
- each tab has an independent timeline and pause/resume controls
- when the same questionnaire is due in two parallel journeys the dashboard only shows it once

**Acceptance criteria**

1. `assignPatientJourney` creates a new `PatientJourney` record regardless of existing journeys; there is no single-journey-per-patient constraint.
2. `JourneyTab` (CaseDetail) renders all journeys for the patient as MUI `Tabs` sorted by status (ACTIVE first), newest first within each group.
3. `PatientCareplan` (PatientView) renders the same multi-tab layout for the patient self-view.
4. `getMergedDueStepsForPatient(patientId, date)` deduplicates due steps across ACTIVE/SUSPENDED journeys by questionnaire `templateId`.
5. Unit tests verify that `getMergedDueStepsForPatient` deduplicates correctly when two journeys share the same questionnaire.

> _Related code_: `src/api/service/journeyResolver.ts`, `src/components/case/JourneyTab/index.tsx`, `src/components/patientView/PatientCareplan/main.tsx`, `src/tests/journey.test.ts`.

---

## US16 – Research consent — grant & revoke

**As a** clinician **I want** to formally capture informed consent before enrolling a patient in a research module, and to be able to revoke that consent if the patient withdraws:

- each research module has a `studyInfoMarkdown` field with study information rendered as formatted text in a consent dialog
- the clinician must tick a checkbox (“I confirm the patient has been informed”) before the confirm button is enabled
- granting consent creates an auditable record with timestamp and granting user
- revoking consent shows a confirmation dialog and records `revokedAt` + `revokedByUserId`; the original grant record is preserved as an audit trail
- consent chips on the journey tab are colour-coded (green = active consent, amber = not yet consented)

**Acceptance criteria**

1. `ResearchModuleSchema` includes `studyInfoMarkdown: string`; the Journey Editor’s Research Modules tab exposes a multiline text field for editing it.
2. `grantConsent(patientId, moduleId, journeyId, userId)` is idempotent: if an active (non-revoked) consent record already exists for the same patient + module + journey, the existing record is returned unchanged; no duplicate is created.
3. `revokeConsent(consentId, userId)` sets `revokedAt: now()` and `revokedByUserId`. The record is never deleted.
4. The consent dialog (`ConsentDialog/Grant.tsx`) renders `studyInfoMarkdown` via `react-markdown` and requires a checkbox before the confirm button is enabled.
5. `RevokeConsentDialog` shows a one-step confirmation before calling `revokeConsent`.
6. `hasActiveConsent(patientId, moduleId, journeyId)` returns `false` after revocation; granting again creates a new record.
7. Unit tests in `researchConsents.test.ts` cover grant idempotency, revocation, `hasActiveConsent`, and `getActiveConsent`.

> _Related code_: `src/api/service/researchConsents.ts`, `src/api/client/researchConsents.ts`, `src/components/journey/ConsentDialog/Grant.tsx`, `src/components/journey/editor/ResearchModulesTab/`, `src/tests/researchConsents.test.ts`.

---

## US17 – Global patient search

**As a** clinician **I want** to find any patient quickly from anywhere in the application without navigating to the patients list:

- a search button is permanently visible in the top navigation bar
- clicking it opens a dialog with an autofocused text field
- results filter by patient name or personal number in real time
- selecting a result navigates directly to the patient detail page

**Acceptance criteria**

1. `GlobalSearch` button is shown in the TopBar for NURSE and DOCTOR roles only.
2. Patients are fetched once on first open; subsequent opens reuse the cached list without a network round-trip.
3. Up to 10 matching results are shown; filtering is case-insensitive and matches against `displayName` and `personalNumber`.
4. Selecting a result navigates to `/patients/:id`.

> _Related code_: `src/components/layout/GlobalSearch.tsx`, `src/components/layout/TopBar.tsx`.

---

## US18 – Clinician patient detail page

**As a** clinician **I want** to view a consolidated summary of a single patient, their cases, journeys, and research consents on one page:

- clicking a patient row in the patients table navigates to `/patients/:id`
- the page shows patient demographics, the patient-level PAL, all cases (with status, category, triggers), journeys grouped by episode (with per-journey PAL), and research studies per journey
- clicking a case row navigates to the case detail

**Acceptance criteria**

1. `/patients/:id` renders `PatientDetail.tsx`; previously this route rendered the patient list again.
2. Breadcrumb navigation shows Patients → patient name and supports back navigation.
3. Cases table shows status chip, category, trigger chips, created date, and last activity timestamp; clicking a row navigates to `/cases/:id`.
4. Journeys section groups journeys by episode of care, shows phases with template name, status and start date, and lets the clinician set the journey PAL.
5. A research section lists, per journey, the research modules with consent status and grant/revoke actions.

> _Related code_: `src/pages/PatientDetail.tsx`, `src/components/patients/CasesSection.tsx`, `src/components/patients/PatientJourneysSection.tsx`, `src/components/patients/PatientJourneyResearchCard.tsx`, `src/router/index.tsx`.

---

## US19 – Print-ready journal view

**As a** clinician **I want** to print a patient’s journal entries directly from the browser so I can place a paper copy in a physical file:

- a print button in the Journal tab triggers the browser’s native print dialog
- the navigation chrome (top bar, side navigation) is hidden in the print layout
- the journal content spans the full page width with appropriate margins

**Acceptance criteria**

1. `JournalTab` renders a print icon button that calls `globalThis.print()`; the button itself is hidden in the print output (`displayPrint: 'none'`).
2. `TopBar` is hidden on print (`displayPrint: 'none'` on the `AppBar`).
3. `SideNav` is hidden on print (wrapped in a `Box` with `displayPrint: 'none'`).
4. `AppShell` removes the left margin and toolbar spacer for print so the main content fills the full width.

> _Related code_: `src/components/case/JournalTab/index.tsx`, `src/components/layout/TopBar.tsx`, `src/components/layout/SideNav.tsx`, `src/components/layout/AppShell.tsx`.

---

## US20 – Login & account menu

**As a** demo user **I want** to log in as a specific person instead of switching roles, so that the app behaves as it would for that user:

- unauthenticated visits redirect to `/login`, which lists the available demo users with their role
- after login the user returns to the originally requested page (default `/dashboard`)
- the account menu (name + avatar in the top bar) shows identity, language choice and logout

**Acceptance criteria**

1. `RoleProvider` exposes the session (`currentUser`, `isRole`, `loginAs`, `logout`) from a pluggable `AuthProviderAdapter`; the demo uses `fakeAuthProvider`, persisting the session in `localStorage` with an expiry.
2. `getAuthProvider()` is the single swap point for a production adapter (e.g. SITHS/OIDC).
3. Navigation items and pages are filtered by the logged-in user's role.

> _Related code_: `src/auth/`, `src/store/roleContext.tsx`, `src/pages/Login.tsx`, `src/components/common/RoleSwitcher.tsx`, `src/router/index.tsx`.

---

## US21 – Worklist (Åtgärdslista) tabs and filters

**As a** nurse, doctor or secretary **I want** to see triaged tasks split by who should act on them, and narrow the list:

- **Aktiva**: tasks directed at me (claimed, named, my team, PAL for my patients) or at nobody specific (VSH)
- **Bevakning**: tasks directed at colleagues, for overview during absence or delays
- **Avklarade**: tasks completed in the last 30 days
- tasks are grouped by work category (visit, phone, digital) and can be filtered by type, competence and recipient (VSH / PAL / named / team), plus “Mina tilldelade” and “Mina patienter”
- an unassigned task can be claimed (“Tilldela mig”); completing a task closes the case

**Acceptance criteria**

1. `useWorklistQueue` splits TRIAGED/FOLLOWING_UP cases into actionable and monitoring buckets using `isWorklistTaskMine` (team membership via `isCaseAssignedToUser`).
2. `claimCaseAssignment` sets `assignedUserId` for active worklist cases and logs an audit event.
3. `completeWorklistCase` transitions the case to CLOSED, optionally completing a booking.
4. Unit tests cover bucket splitting, team/multi-person assignment and the completed window.

> _Related code_: `src/pages/Worklist.tsx`, `src/hooks/useWorklistQueue.ts`, `src/components/worklist/`, `src/api/service/teams.ts`, `src/tests/worklistQueue.test.tsx`.

---

## US22 – Colleague review request

**As a** clinician triaging a case **I want** to ask a named colleague for a second opinion without handing over the case:

- from the triage aside I can request a review from another doctor/nurse with an optional question
- the colleague sees the request on the case and can answer it once; I can withdraw an unanswered request
- the dashboard row shows a “Granskning begärd” chip while a request is unanswered

**Acceptance criteria**

1. `requestColleagueReview` refuses self-review, stores an empty question as `null` and logs `COLLEAGUE_REVIEW_REQUESTED`.
2. Only the requested reviewer can respond (`respondColleagueReview`), and only once.
3. Only the requester can cancel (`cancelColleagueReview`).
4. Review requests never block triage.

> _Related code_: `src/api/service/colleagueReviews.ts`, `src/components/case/ColleagueReviews/`, `src/tests/colleagueReviews.test.ts`.

---

## US23 – Referral information and diagnoses via uthopp

**As a** clinician **I want** to see the incoming referral for an episode of care and get its diagnoses from the journal system:

- the journey tab shows a referral card with received date, referrer, reason and diagnoses
- diagnoses are not typed in the app; a simulated TakeCare “uthopp” lets the clinician pick ICD-10-SE codes that are then stored on the referral

**Acceptance criteria**

1. `EpisodeOfCare.referral` holds `receivedAt`, `referrer`, `reason`, `diagnoses[]` and `diagnosisSource` (`UTHOPP` / `MANUAL`).
2. `setReferralDiagnoses(episodeId, diagnoses, source, ...)` updates the referral and logs `REFERRAL_DIAGNOSES_SET` on the episode's primary case.
3. The referral card indicates when diagnoses are missing and when they came from uthopp.

> _Related code_: `src/api/service/episodes.ts`, `src/api/schemas/journey.ts`, `src/components/case/JourneyTab/ReferralCard.tsx`, `src/components/case/JourneyTab/UthoppDiagnosisDialog.tsx`, `src/api/seed/referralExamples.ts`.
