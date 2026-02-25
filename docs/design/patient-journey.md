**Patient Journey — Concurrency, Entries and Effective Steps**

Concept

- A `PatientJourney` represents a configured series of follow-ups for a patient anchored at `startDate`.
- A patient can have many `PatientJourney` records simultaneously (e.g., overlapping studies, long-term vs short-term care plans).

Journey entries

- Each `JourneyTemplateEntry` defines:
  - `offsetDays`: days from journey `startDate` when the entry becomes active
  - `windowDays`: the allowed window for the follow-up
  - `scoreAliases`: a map of alias names to score paths used by policies and templates
  - `dashboardCategory`: which queue the step maps to (Acute/Subacute/Control)

Effective step computation

- `getEffectiveSteps` (see `src/api/service/journeyResolver.ts`) applies modifications and overlays research modules and returns a list of effective follow-ups for display.
- The dashboard uses `getEffectiveSteps` and maps follow-ups to Case rows; Cases are then assigned categories and suggested `nextStep`.

Selection rule (current behavior)

- The UI selects the latest `PatientJourney` with `status === ACTIVE` for a patient when computing effective steps.
- If none are ACTIVE, fallback is to template defaults (no active journey).

Scheduling & cases

- Cases may be created from a scheduled follow-up (entry) or from patient-initiated contacts; the mapping is performed when the FormResponse is saved and service logic assigns/creates a `Case` where appropriate.
- There is no automatic background job advancing entries; scheduled follow-ups become visible in the dashboard based on computed dates.

Recommendations

- Consider adding explicit FK linking Case → PatientJourneyEntry if the business needs to trace which journey entry created a case.
- Add service-side guards for `PatientJourney.status` transitions if lifecycle invariants are required (e.g., ACTIVE → SUSPENDED → COMPLETED).
