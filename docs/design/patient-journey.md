**Patient Journey — Lifecycle, Scheduling, And Parallelism**

This document explains how journey logic drives due steps, scheduling behavior, and clinician/patient views.

Start with `../design.md` for architecture context, then use this deep dive for implementation details.

## Concept

A `PatientJourney` is a follow-up programme anchored to `startDate`.

- A patient may have multiple journeys in parallel.
- Each journey references a `JourneyTemplate` with ordered entries.
- Effective timeline output is computed (not stored) by resolver logic.

## Lifecycle And State

![Patient Journey Lifecycle](../diagrams/patient-journey-lifecycle.svg)

What this diagram shows:

- Assignment starts at `ACTIVE` with `pausedAt = null` and `totalPausedDays = 0`.
- Pause/resume transitions are explicit and guarded.
- Template switching can reset `startDate` with audit context.

## Effective Step Computation

![Dashboard Due-Step Computation](../diagrams/dashboard-journey-computation.svg)

What this diagram shows:

- Resolver pipeline: apply modifications, pause shift, research overlays, instruction hydration, due-step filtering.

Key methods:

- `getEffectiveSteps(journeyId)`
- `getMergedDueStepsForPatient(patientId, date)`

## Parallel Journeys In Views

![Multiple Journeys Tab Rendering](../diagrams/journey-tabs-rendering.svg)

What this diagram shows:

- `JourneyTab` (clinician) and `PatientCareplan` (patient) both render all journeys as tabs.
- Sorting order is deterministic (`ACTIVE`, `SUSPENDED`, `COMPLETED`; newest-first inside groups).

## Deduplication Across Journeys

![Parallel Journey Deduplication](../diagrams/journey-deduplication-flow.svg)

What this diagram shows:

- Due steps are deduplicated by `templateEntryId` when journeys overlap.

Clinical effect:

- A questionnaire appears once, even if scheduled by more than one active programme.

## Pause And Resume Semantics

![Journey Pause Resume Sequence](../diagrams/pause-resume-sequence.svg)

What this diagram shows:

- `pauseJourney`: store `pausedAt`, move to `SUSPENDED`.
- `resumeJourney`: add elapsed days to `totalPausedDays`, clear `pausedAt`, return to `ACTIVE`.
- Dynamic date shift while suspended happens in resolver, without rewriting all step dates.

## Journey Modifications

![Journey Modifications](../diagrams/journey-modifications-sequence.svg)

Supported operations:

- `ADD_STEP`
- `REMOVE_STEP`
- `SWITCH_TEMPLATE` (optionally with date reset)

All operations append to `PatientJourney.modifications[]` with reason text for auditability.

## Form Submission Coupling

![Form Submission Flow](../diagrams/form-submission-flow.svg)

What this diagram shows:

- Form submission updates journey context and may update case/policy/audit outputs.

## Cancellation Rules

- Delete journey only when no recorded journey data exists.
- Otherwise archive as `COMPLETED` and append a `CANCEL` modification.
- Never delete form responses as part of cancellation.

## Key Code References

- `../../src/api/service/patientJourneys.ts`
- `../../src/api/service/journeyResolver.ts`
- `../../src/components/case/JourneyTab/index.tsx`
- `../../src/components/patientView/PatientCareplan/main.tsx`
