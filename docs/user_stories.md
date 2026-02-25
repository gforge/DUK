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

These stories map directly to the workflows and components described in the design document. They should evolve alongside the implementation, and new stories can be added for additional features (e.g. journey management, audit filtering, etc.).
