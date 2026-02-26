**Patient Journey — Concurrency, Entries and Effective Steps**

![Patient Journey Lifecycle](../diagrams/patient-journey-lifecycle.svg)

![Dashboard Journey Computation](../diagrams/dashboard-journey-computation.svg)

Concept

- A `PatientJourney` represents a configured series of follow-ups for a patient anchored at `startDate`.
- A patient can have many `PatientJourney` records simultaneously (e.g., overlapping studies, long-term vs short-term care plans).
- The `startDate` can be any clinically relevant anchor: registration date, surgery date, injury date, etc. It is set at journey assignment and can be reset via `SWITCH_TEMPLATE` with `newStartDate`.

Journey entries

- Each `JourneyTemplateEntry` defines:
  - `offsetDays`: days from journey `startDate` when the entry becomes active
  - `windowDays`: the allowed window for the follow-up
  - `scoreAliases`: a map of alias names to score paths used by policies and templates

![Score Aliasing](../diagrams/score-aliasing.svg)

- `scoreAliasLabels`: human-readable labels for aliased scores
- `dashboardCategory`: which queue the step maps to (Acute/Subacute/Control)
- `templateId`: optional questionnaire template; omitted for instruction-only steps
- `instructionText`: optional inline instruction content
- `instructionTemplateId`: optional FK to `InstructionTemplate`; if present, overrides `instructionText`

Instruction hydration

- `getEffectiveSteps` hydrates a `resolvedInstruction` string for each step:
  1. If `instructionTemplateId` is set and a matching `InstructionTemplate` exists, use its `content`.
  2. Else if `instructionText` is set, use it directly.
  3. Otherwise, `resolvedInstruction` is `undefined`.
- The `JourneyTimeline` component renders resolved instructions as collapsible panels per step.

Template inheritance (copy-on-derive)

- `deriveJourneyTemplate(parentId, newName)` creates a full deep copy of the parent with:
  - `parentTemplateId` set to the parent's id
  - `derivedAt` set to the current timestamp
  - All entries get new UUIDs (no shared references)
- `computeParentDiff(childId)` compares the child's entries against its parent using `offsetDays + order` as the stable matching key, returning `EntryDiff[]` with types: `ADDED`, `REMOVED`, `CHANGED`.
- `applyParentDiff(childId, entryIds[])` selectively applies diffs to the child and updates `derivedAt`.
- The Journey Editor UI exposes a "Derive" button (creates child) and a "Sync from Parent" button (shows diff checklist and applies selected changes).

Journey switching (SWITCH_TEMPLATE)

- `modifyPatientJourney` with `type: SWITCH_TEMPLATE` changes `journeyTemplateId` to `newTemplateId` and records the `previousTemplateId` in the modification.
- When `newStartDate` is provided, the journey's `startDate` is also updated. The modification records both `previousStartDate` and `newStartDate` so the change is auditable.
- All effective steps recalculate relative to the new start date after switching.

Effective step computation

- `getEffectiveSteps` (see `src/api/service/journeyResolver.ts`) applies modifications, overlays research modules, hydrates instructions, and returns a list of effective follow-ups for display.
- The dashboard uses `getEffectiveSteps` and maps follow-ups to Case rows; Cases are then assigned categories and suggested `nextStep`.

Selection rule (current behavior)

- The UI selects the latest `PatientJourney` with `status === ACTIVE` for a patient when computing effective steps.
- If none are ACTIVE, fallback is to template defaults (no active journey).

Patient journey status transitions

- `updatePatientJourneyStatus(journeyId, status)` allows explicit status changes: ACTIVE → SUSPENDED, SUSPENDED → ACTIVE, ACTIVE/SUSPENDED → COMPLETED.
- Service-layer guards enforce valid transitions.

Scheduling & cases

- Cases may be created from a scheduled follow-up (entry) or from patient-initiated contacts; the mapping is performed when the FormResponse is saved and service logic assigns/creates a `Case` where appropriate.
- There is no automatic background job advancing entries; scheduled follow-ups become visible in the dashboard based on computed dates.

Patient registration flow

- The `/patients` page provides a 3-step registration wizard: patient details → journey assignment (template + reference date) → review & confirm.
- `createPatient` creates the patient record, then `assignPatientJourney` links them to a journey template with the selected start date.
- An "Assign Journey" action is also available on the patient table for existing patients without journeys.

Patient care plan view

- The patient view (`/patient` role=PATIENT) shows a "My Care Plan" section with the read-only `JourneyTimeline` for the patient's active journey, including resolved instructions.
