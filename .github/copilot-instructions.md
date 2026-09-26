# GitHub Copilot Instructions — DUK Clinical Triage Demo

## Project overview

**DUK** (Digital Uppföljning Klinisk) is a fully client-side React/TypeScript demo of a clinical triage workflow for orthopaedic follow-up. There is no backend, no real authentication (only a replaceable fake login), and no real patient data — everything lives in browser `localStorage` backed by an in-memory singleton store. The live demo can be deployed to GitHub Pages.

Primary language of the UI is **Swedish** (default and fallback locale); **English** is the second locale. Code, comments, and commit messages are in **English**.

---

## Technology stack

| Layer             | Library / version                                                                |
| ----------------- | -------------------------------------------------------------------------------- |
| UI framework      | React 19 + TypeScript 6                                                          |
| Build tool        | Vite 8                                                                           |
| Component library | MUI v9 (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`)           |
| Forms             | React Hook Form v7 + Zod v4 (`@hookform/resolvers`)                              |
| Routing           | React Router v7 (hash router — deployed as static site)                          |
| i18n              | i18next v26 + react-i18next v17                                                  |
| Dates             | date-fns v4                                                                      |
| Markdown          | react-markdown v10                                                               |
| Tests             | Vitest v5 + @testing-library/react v16 + @testing-library/user-event v14 + jsdom |
| Linting           | ESLint 10 + typescript-eslint + eslint-plugin-react-hooks                        |
| Formatting        | Prettier 3                                                                       |
| Fake data (dev)   | @faker-js/faker (devDependency, dynamically imported)                            |

---

## Repository layout

```
src/
├── api/
│   ├── schemaVersion.ts        # CURRENT_SCHEMA_VERSION + CURRENT_DEMO_DATA_VERSION integers
│   ├── schemas/                # Zod schemas — single source of truth for all types
│   │   ├── state.ts            # AppStateSchema (schemaVersion, demoDataVersion, seedAnchorDate, …)
│   │   ├── case.ts, patient.ts, users.ts, team.ts, journal.ts, journey.ts, …
│   │   ├── enums.ts            # All shared enum literals
│   │   └── index.ts            # Re-exports everything
│   ├── migrations.ts           # Migration chain: runMigrations(raw) → MigrationResult
│   ├── bootstrap.ts            # initializeStoreFromRaw: migrate, replace outdated demo data, re-anchor dates
│   ├── storage.ts              # localStorage r/w + in-memory singleton (getStore/setStore/patchStore)
│   ├── undoHistory.ts          # Journey-editor undo stack (separate localStorage key)
│   ├── seed/                   # Minimal hand-crafted seed (incl. referralExamples.ts, careTeams.ts)
│   │   └── index.ts            # buildMinimalSeed(today), reanchorDemoState(state, today), SEED_STATE
│   ├── seedRealistic/          # Programmatic ~320-patient cohort (PRNG, no faker)
│   ├── seedFaker.ts            # ~1 000-patient faker seed (dynamically imported)
│   ├── service/                # Pure business logic — reads getStore(), writes setStore()/patchStore()
│   │   ├── cases.ts, patients.ts, journal.ts, policy.ts, …
│   │   ├── patientJourneys.ts  # assignPatientJourney, pauseJourney, resumeJourney, startNextPhase, …
│   │   ├── journeyResolver.ts  # getEffectiveSteps, getMergedDueStepsForPatient
│   │   ├── journeyDates.ts     # computeTotalPauseShift, toScheduledDate
│   │   ├── researchConsents.ts # grantConsent, revokeConsent, hasActiveConsent, …
│   │   ├── colleagueReviews.ts # requestColleagueReview, respondColleagueReview, cancelColleagueReview
│   │   ├── teams.ts            # getCareTeams, isCaseAssignedToUser
│   │   ├── triageDecision.ts   # Maps TriageDecision → next step / work category / assigned role
│   │   ├── seed.ts             # exportState / importState / resetAndReseed(variant)
│   │   └── utils.ts            # uuid(), now(), evaluatePolicyRules(), computeScores(), …
│   ├── client/                 # Async wrappers adding 100–400 ms simulated delay (one file per service)
│   │   └── index.ts            # Re-exports all client functions
│   ├── policyParser/           # Hand-written recursive-descent expression parser (no eval)
│   └── journalRenderer.ts      # Safe Mustache-like template renderer
├── auth/                       # AuthProviderAdapter contract + fakeAuthProvider (demo login accounts)
├── components/
│   ├── layout/                 # AppShell, TopBar, SideNav, GlobalSearch
│   ├── common/                 # Shared primitives (PageHeader, SectionCard, GridTable, SegmentedControl,
│   │                           #   Tag, OptionButton, DropdownButton, FilterPill), StatusChip,
│   │                           #   RoleSwitcher (account menu), MigrationErrorOverlay, …
│   ├── dashboard/              # QueueColumn, CaseListItem, DashboardToolbar, sortCases
│   ├── case/                   # CaseHeader, ContactActions, FormResponsesTab, JourneyTab, TriageTab,
│   │                           #   JournalTab, AuditLogTab, ColleagueReviews, ClinicalReviewPanel,
│   │                           #   BookingsList, triage/ (single-page triage form sections)
│   ├── journey/                # JourneyTimeline, ModifyJourneyDialog, ConsentDialog, editor/ tabs
│   ├── patients/               # PatientTable, detail sections, register/assign dialogs
│   ├── patientView/            # Patient portal components
│   ├── policy/                 # PolicyRulesTable, PolicyRuleDialog, PolicyTemplatePicker
│   ├── worklist/               # WorklistFilters, GroupSection, WorklistRow, CompletionDialog
│   └── demo/                   # SeedPanel, ExportPanel, ImportPanel
├── hooks/
│   ├── useApi.ts               # Generic async hook: { data, loading, error, refetch }
│   ├── useHotkeys.ts           # Keyboard shortcut map
│   ├── useRovingTabIndex.ts    # A11y arrow-key navigation
│   ├── useFocusRestore.ts      # Restore focus on back navigation
│   ├── useNavItems.ts          # Role-filtered side navigation
│   ├── useWorklistQueue.ts     # Worklist grouping/filtering
│   ├── useCollapsedSections.ts # Persisted collapsed state for sections
│   └── labels/                 # useRoleLabel, useCareRoleLabel, … (translated enum labels)
├── i18n/
│   ├── index.ts                # i18next initialisation (sv default + fallback, en available)
│   └── locales/sv/ & en/       # translation.json files
├── pages/                      # Route-level components (lazy imported by router)
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── CaseDetail.tsx
│   ├── PatientDetail.tsx
│   ├── Patients.tsx
│   ├── PatientView.tsx
│   ├── PolicyEditor.tsx
│   ├── JourneyEditor.tsx
│   ├── Worklist.tsx
│   ├── DemoTools.tsx
│   └── NotFound.tsx
├── router/index.tsx            # HashRouter + /login + protected lazy routes inside AppShell
├── store/
│   ├── roleContext.tsx          # Session/current user (RoleProvider, useRole, useOptionalRole, useLogin)
│   └── snackContext.tsx         # Global snackbar (SnackProvider, useSnack)
├── theme.ts                    # MUI theme + design `tokens` (colour semantics from the DUK redesign)
├── utils/                      # Small UI helpers (deadline, journeyUtils, slugify, …)
├── App.tsx                     # ThemeProvider + RoleProvider + SnackProvider; accepts migrationError prop
└── main.tsx                    # Boot: loadState → initializeStoreFromRaw → App (or MigrationErrorOverlay)
docs/
├── design.md                   # English design document
├── design/                     # data-model, patient-journey, policy, templating
├── user_stories.md
└── diagrams/                   # PlantUML sources (render with npm run diagrams:render)
scripts/bin/                    # duk-install, duk-build, duk-publish, duk-run (add to PATH via `source setup.sh`)
.design-sync/                   # claude.ai/design sync config for shared components (see NOTES.md)
```

---

## Data layer architecture

### Storage singleton

All domain state lives in one JSON blob at `localStorage` key `duk_app_state`. Access from application code goes through `src/api/storage.ts` — no other file reads or writes that key. (Separate keys exist for the fake auth session `duk.auth.fakeSession`, the journey-editor undo stack `duk_undo_history`, and UI preferences such as collapsed sections.) The module exposes:

- `loadState()` → `unknown | null` (raw parse — no validation, callers own migration)
- `saveState(state)`, `clearState()`
- `initStore(state)` — first write (called once at boot via `initializeStoreFromRaw` in `bootstrap.ts`)
- `getStore()` → `AppState` (in-memory cache, throws if not initialised)
- `setStore(state)`, `patchStore(updater)` — write-through cache + localStorage
- `resetStore()` — clears memory and localStorage

### Schema versioning & migrations

`CURRENT_SCHEMA_VERSION` in `src/api/schemaVersion.ts` is an integer that must be bumped whenever `AppStateSchema` changes in a breaking way. Currently **v18**. Every seed sets `schemaVersion: CURRENT_SCHEMA_VERSION`.

At boot, `main.tsx` calls `initializeStoreFromRaw(loadState())` from `src/api/bootstrap.ts`, which:

- Seeds with `buildMinimalSeed(today)` when nothing is stored.
- Otherwise calls `runMigrations(raw)` from `src/api/migrations.ts`:
  - Returns `{ ok: true, state: AppState }` on success (migrates v0 through v18 with a contiguous chain).
  - Returns `{ ok: false, reason, storedVersion, rawState }` when migration is impossible (`reason`: `downgrade`, `no-path`, `parse-error` or `invalid`).
- Replaces the stored state with a fresh seed when `demoDataVersion < CURRENT_DEMO_DATA_VERSION`; otherwise re-anchors demo dates to today with `reanchorDemoState` (shifts all dates by the days since `seedAnchorDate`).
- On failure, `<App migrationError={...}>` renders `<MigrationErrorOverlay>` — a full-screen blocking UI with download-as-JSON and clear-and-restart actions.

**When adding a schema migration:**

1. Increment `CURRENT_SCHEMA_VERSION`.
2. Add a `{ from: N, to: N+1, up: (s) => ({...s, newField: default}) }` entry to the `MIGRATIONS` array in `src/api/migrations.ts`.
3. Keep the chain contiguous.

Bump `CURRENT_DEMO_DATA_VERSION` (not the schema version) when only the bundled seed content should replace older local demo stores.

### Service layer pattern

Every service function in `src/api/service/` follows the same read-compute-write pattern:

```typescript
export function doSomething(id: string, value: string): SomeType {
  return patchStore((state) => ({
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, value } : item)),
  })).items.find((i) => i.id === id)!
}
```

- No mutation of state inside the updater — always return a new object.
- All service functions are synchronous.
- `uuid()` from `service/utils.ts` generates IDs (not crypto-grade, fine for demo).
- `now()` from `service/utils.ts` returns the current ISO timestamp string.

### Client layer

All UI code calls functions from `src/api/client/` which wrap service functions with:

- `withDelay(fn)` — adds 100–400 ms simulated latency.
- All client functions are `async` and return `Promise<T>`.
- Import with `import * as client from '@/api/client'` in page and component files.

---

## Schemas & types

All types derive from Zod schemas in `src/api/schemas/`. Never write manual type definitions for domain objects — always use `z.infer<typeof SomeSchema>`.

Key schemas:

- `AppStateSchema` — flat object with top-level arrays for all entities + `schemaVersion: z.number().int().default(0)` + `demoDataVersion` + optional `seedAnchorDate` + `careTeams[]` + `episodesOfCare[]` + `instructions[]` + `instructionTemplates[]` + `researchConsents[]`
- `CaseSchema` — `id`, `patientId`, optional `episodeId`, `category`, `status`, `triggers[]`, `policyWarnings[]`, optional `triageDecision`, optional `bookings[]`, `reviews[]` (lab/X-ray), `colleagueReviews[]`, and lifecycle timestamps
- `TriageDecisionSchema` — `contactMode` (`DIGITAL|PHONE|VISIT|CLOSE`), `careRole` (`DOCTOR|NURSE|PHYSIO`), `assignmentMode` (`ANY|PAL|NAMED|TEAM`), `assignedUserId` / `assignedUserIds[]` (NAMED, one or several people), `assignedTeamIds[]` (TEAM), `dueAt`, `note`. `CLOSE` requires null careRole/assignmentMode; `PAL` requires careRole `DOCTOR`
- `PatientSchema` — `id`, `displayName`, `personalNumber` (Swedish), `dateOfBirth`, `palId?`, etc.
- `UserSchema` — `id`, `name`, `role` (`PATIENT|NURSE|DOCTOR|SECRETARY`). PAL is an ownership assignment (`Patient.palId`, journey/episode responsibility), not a role
- `CareTeamSchema` — `id`, `name`, `memberUserIds[]`; a TEAM-assigned case is shared by the team members
- `ColleagueReviewSchema` — advisory second-opinion request on a case (`requestedByUserId`, `reviewerUserId`, `question`, `response`, `respondedAt`); never blocks triage
- `JourneyTemplateSchema` — template for a follow-up journey with ordered entries (`offsetDays`, `windowDays`, `scoreAliases`, etc.) and optional `group` / `phaseOrder` for care-pathway grouping in the editor
- `PatientJourneySchema` — assignment of a template to a patient with `episodeId`, `phaseType`, optional `phaseLabel`, `startDate`, `joinedAt`, optional `transition`, `status`, `modifications[]`, `recurringCompletions[]`, `pausedAt`, `totalPausedDays`
- `EpisodeOfCareSchema` — episode container for one clinical problem over time; links multiple journey phases; optional `referral` (`receivedAt`, `referrer`, `reason`, `diagnoses[]`, `diagnosisSource`: `UTHOPP|MANUAL`)
- `InstructionTemplateSchema` / `InstructionSchema` — first-class instruction templates and persisted instruction records
- `ResearchModuleSchema` — `id`, `name`, `studyInfoMarkdown: string` (Markdown shown in the consent dialog), `entries[]`
- `ConsentSchema` — `id`, `patientId`, `researchModuleId`, `patientJourneyId`, `grantedAt`, `grantedByUserId`, `revokedAt: string | null`, `revokedByUserId: string | null` — stored in `AppState.researchConsents`
- `PolicyRuleSchema` — `id`, `journeyTemplateId` (rule applies only when the patient has an active journey on that template), `name`, `expression` (parsed by policyParser), `severity`, `enabled`
- All enum values are in `src/api/schemas/enums.ts`

---

## Journey pause & resume

`pauseJourney(journeyId)` and `resumeJourney(journeyId)` are in `src/api/service/patientJourneys.ts`.

- **Pause**: guards `status === 'ACTIVE'`, sets `status: 'SUSPENDED'` and `pausedAt: now()`. No step dates are written to the store.
- **Resume**: guards `status === 'SUSPENDED'`, computes `elapsedDays = Math.floor((Date.now() − new Date(pausedAt)) / 86_400_000)`, adds to `totalPausedDays`, clears `pausedAt: null`, sets `status: 'ACTIVE'`.
- **Effective-date shift**: `getEffectiveSteps` in `journeyResolver.ts` uses `computeTotalPauseShift` (`journeyDates.ts`) = `totalPausedDays + currentPauseDays` (where `currentPauseDays` is the live elapsed time for a currently-suspended journey), and adds this shift to every step's `scheduledDate`. No store write occurs until `resumeJourney` is called.
- The `JourneyTab` (clinician CaseDetail view) shows a pause/resume button and a paused-days banner while suspended.

## Episode phases and transitions

Journeys are organized into episodes of care and can transition between phases.

- `startNextPhase(...)` in `src/api/service/patientJourneys.ts` completes the previous journey and creates a new journey linked to the same `episodeId`.
- `PatientJourney.phaseType` records the semantic phase (`REFERRAL`, `INTAKE`, `FOLLOWUP`, `WAITING_LIST`, `POST_OP`, `MONITORING`, `DISCHARGE`).
- `PatientJourney.transition` stores audit metadata (`fromJourneyId`, trigger type, actor, note).
- Late enrollment via `joinedAt` removes already-missed steps and auto-cancels expired instructions with `cancelReason: 'LATE_JOIN'`.
- Recurring steps are expanded by the resolver and tracked with `recurringCompletions[]`.

## Research consent model

Consents for research modules are managed via `src/api/service/researchConsents.ts` and stored in `AppState.researchConsents`.

- **Grant**: `grantConsent(patientId, researchModuleId, patientJourneyId, grantedByUserId)` — idempotent; if an active (non-revoked) consent already exists for the same patient + module + journey, it is returned unchanged. Otherwise a new `Consent` record is created with `grantedAt: now()`.
- **Revoke**: `revokeConsent(consentId, revokedByUserId)` — sets `revokedAt: now()` and `revokedByUserId`. The original record is preserved as an audit trail; a new grant after revocation creates a fresh record.
- **Query helpers**: `hasActiveConsent(patientId, moduleId, journeyId)`, `getActiveConsent(...)`, `getResearchConsents(patientId?, moduleId?)`.
- **UI**: `ConsentDialog` (`src/components/journey/ConsentDialog.tsx`) renders `studyInfoMarkdown` via `react-markdown`, requires the user to check a checkbox before enabling confirm. `RevokeConsentDialog` shows a confirmation step. Both are used inside `JourneyTab`.
- `studyInfoMarkdown` on `ResearchModuleSchema` is edited in the Journey Editor's Research Modules tab.

## Multiple parallel journeys

A patient can have any number of concurrent `PatientJourney` records (e.g., wrist fracture + hip fracture programmes running in parallel).

- `JourneyTab` (CaseDetail) and `PatientCareplan` (PatientView) both render **all journeys** for the patient in MUI `Tabs`, sorted ACTIVE → SUSPENDED → COMPLETED, newest first within each status group.
- **Form deduplication**: `getMergedDueStepsForPatient(patientId, date)` in `journeyResolver.ts` collects due steps from ACTIVE/SUSPENDED journeys and deduplicates by questionnaire `templateId` so the same questionnaire is never shown twice on the dashboard, even when two parallel journeys schedule it on overlapping windows.

---

## Components

### Conventions

- Prefer named exports for shared utilities and helpers. UI components may use default exports where established in the codebase.
- Props interfaces are defined inline above the component: `interface Props { ... }`.
- Use MUI components exclusively — do not introduce CSS files, Tailwind, or other styling libraries.
- Use `tokens` from `src/theme.ts` for colours instead of ad-hoc hex values (amber = clinical signal, grey = administrative, blue = selection/status, green = done), and reuse the shared primitives in `src/components/common` (`PageHeader`, `SectionCard`, `GridTable`, `SegmentedControl`, `Tag`, …).
- Use `sx` prop for one-off styles; avoid `styled()` unless the component is reused and the style is complex.
- Always supply `aria-label` on icon-only buttons.
- Destructure `useTranslation()` as `const { t } = useTranslation()` at the top of every component that renders text.
- For loading states use MUI `Skeleton`, not spinners, unless something is page-level (use `CircularProgress`).

### Async data fetching in components

Use `useApi` from `src/hooks/useApi.ts`:

```tsx
const { data, loading, error, refetch } = useApi(() => client.getSomething(id), [id])
```

- Pass a stable dependency array (just like `useEffect`).
- Call `refetch()` after mutations to re-fetch data.
- `loading` is `true` on first load and on every refetch.

### Role-based UI

```tsx
const { currentUser, isRole } = useRole()
const canTriage = isRole('NURSE', 'DOCTOR')
```

`currentUser.role` is `'PATIENT' | 'NURSE' | 'DOCTOR' | 'SECRETARY'`. PAL is not a role — "my patients" filters compare `patient.palId` with `currentUser.id`. Side-nav visibility per role is defined in `src/hooks/useNavItems.ts`.

`useRole()` throws outside an authenticated session; use `useOptionalRole()` where no session may exist. The session comes from the auth provider returned by `getAuthProvider()` (`src/auth/provider.ts`), currently `fakeAuthProvider` with fixed demo accounts (`user-pal-1`, `user-doc-1`, `user-nurse-1`, `user-sec-1`, `user-patient-1`). Switching user means logging out and logging in again via `/login`. Keep auth-specific code behind the `AuthProviderAdapter` interface so a real provider can replace the fake one.

### Notifications

```tsx
const { showSnack } = useSnack()
showSnack(t('some.key'), 'success') // 'success' | 'error' | 'info' | 'warning'
```

---

## Internationalisation (i18n)

- **Swedish** (`sv`) is the primary and fallback locale; **English** (`en`) is the second locale.
- Translation files: `src/i18n/locales/sv/translation.json` and `src/i18n/locales/en/translation.json`.
- Always add keys to **both** locale files when adding new UI text. Never inline raw strings in JSX.
- Key naming convention: `camelCaseSection.camelCaseKey` — e.g. `patient.displayName`, `case.status`, `demoTools.exportTitle`.
- For enums rendered in the UI, use the pattern `t('enumSection.ENUM_VALUE')` — e.g. `t('status.NEW')`, `t('category.ACUTE')`.
- Run `npm run generate:i18n` to extract missing keys and regenerate the typed resources in `src/@types/resources.d.ts` (uses i18next-cli). Run this after adding or changing UI text; it updates both `src/i18n/locales/sv/translation.json` and `src/i18n/locales/en/translation.json`. Run before opening a PR so locale files stay in sync then search for all `__NOT_TRANSLATED__` placeholders and fill them in.

---

## Testing

- Test files live in `src/tests/`.
- **Vitest** globals (`describe`, `it`, `expect`, `vi`) are enabled; many tests still import them explicitly from `vitest`, which is fine.
- Use `@testing-library/react` for component tests. The setup file is `src/tests/setup.ts`.
- For storage-dependent tests, call `initStore(structuredClone(SEED_STATE))` before the test and `resetStore()` in `afterEach`.
- In test mode `RoleProvider` starts with a session for the first fake login account (`user-pal-1`, a doctor), so components using `useRole()` render without logging in.
- Do **not** mock the client layer in unit tests — call service functions directly when testing business logic.
- Test file naming: `featureName.test.ts` (logic), `featureName.test.tsx` (component/flow).

---

## Policy parser

`src/api/policyParser/` contains a hand-written recursive-descent parser with **no `eval()` or `new Function()`**. Policy expressions support:

- Logic: `&&`, `||` (no `NOT`, no word operators)
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Arithmetic: `+`, `-`, `*`, `/`, unary minus
- Numeric literals and identifiers (letters, digits, `_`, `.`), e.g. `PNRS_1`, `OSS.total`, `EQ5D.index`, `PNRS_week4`
- Parentheses for grouping

Identifiers resolve against a numeric scope built from the case's form answers and scores plus journey-step `scoreAliases` (`buildPolicyScopeWithAliases`). There are no function calls. Example: `PNRS_1 - PNRS_2 <= 0 && OSS.total < 30`.

Do not add `eval` or dynamic code execution under any circumstances.

---

## Journal renderer

`src/api/journalRenderer.ts` is a safe Mustache-like template renderer. It supports whitelisted tokens (`{{patient.displayName}}`, `{{scores.PNRS_1}}`, `{{triage.nextStep}}`, …), journey aliases (`{{score.ALIAS}}`, `{{label.ALIAS}}`) and `{{#if triggers.HIGH_PAIN}}…{{/if}}` blocks on whitelisted flags — no arbitrary code execution.

---

## Scripts

| Command                   | Purpose                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server at `http://localhost:5173`                                                                                       |
| `npm run build`           | Type-check + Vite production build                                                                                               |
| `npm run preview`         | Serve the production build                                                                                                       |
| `npm run deploy`          | Build and publish `dist/` to GitHub Pages                                                                                        |
| `npm test`                | Run all Vitest tests once                                                                                                        |
| `npm run test:watch`      | Vitest watch mode                                                                                                                |
| `npm run typecheck`       | `tsc --noEmit`                                                                                                                   |
| `npm run lint`            | ESLint with zero warnings allowed (runs with `--fix`)                                                                            |
| `npm run check`           | `typecheck` + `lint`                                                                                                             |
| `npm run format`          | Prettier on `src/`                                                                                                               |
| `npm run generate:i18n`   | Extract i18n keys into `src/i18n/locales/*/translation.json` — run after adding or changing UI text; updates both `sv` and `en`. |
| `npm run diagrams:render` | Render PlantUML diagrams to SVG via Docker (`npm run diagrams` cleans first)                                                     |
| `npm run barrel:generate` | Regenerate `index.ts` barrels under `src/components/`                                                                            |

Helper commands in `scripts/bin/` (put on PATH with `source setup.sh`): `duk-install [--clean] [--setup]`, `duk-build [check]`, `duk-publish [--check] [--yes]`, `duk-run [dev|preview|test]`.

---

## Routing

The router (`src/router/index.tsx`) uses `HashRouter` for static-site compatibility. All page components are **lazy-loaded**. `/login` is public; every other route is wrapped in `ProtectedApp`, which redirects to `/login` (remembering the original path) when there is no session and renders the page inside `AppShell`. Routes:

| Path                     | Page                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `/login`                 | Login (fake auth account picker)                                                                  |
| `/dashboard`             | Dashboard / Patientöversikt (default redirect)                                                    |
| `/cases/:id`             | CaseDetail                                                                                        |
| `/cases/:id/:triageMode` | CaseDetail on the Triage tab with contact mode preselected (`digital`, `phone`, `visit`, `close`) |
| `/patient`               | PatientView (self-service, role=PATIENT only)                                                     |
| `/patients`              | Patients list (clinicians, secretary)                                                             |
| `/patients/:id`          | PatientDetail (clinician)                                                                         |
| `/policy`                | PolicyEditor / Triagepolicyer                                                                     |
| `/journeys`              | JourneyEditor / Patientresor                                                                      |
| `/worklist`              | Worklist / Åtgärdslista (Active / Monitoring / Completed tabs)                                    |
| `/demo-tools`            | DemoTools (export, import, seed presets)                                                          |
| `*`                      | NotFound                                                                                          |

---

## Keyboard shortcuts

| Key            | Action                    |
| -------------- | ------------------------- |
| `/`            | Focus search on Dashboard |
| `g d`          | Navigate to Dashboard     |
| `↑ ↓`          | Navigate case rows        |
| `Home` / `End` | First/last case row       |

Keyboard shortcuts are registered with `useHotkeys` from `src/hooks/useHotkeys.ts`. Roving tab index for accessible arrow-key navigation uses `useRovingTabIndex`.

---

## Hard constraints (never violate)

1. **No `eval()` or `new Function()`** anywhere in the codebase.
2. **No direct `localStorage` access** outside `src/api/storage.ts` for application/domain state. Exceptions: the auth session in `src/auth/`, the editor undo stack in `src/api/undoHistory.ts`, and lightweight UI preferences (e.g. `useCollapsedSections`).
3. **No real patient data** — all names, personal numbers and clinical values are fictional.
4. **No network calls** — there is no backend; all async operations resolve against the in-memory store.
5. **No real authentication or credentials** — the fake login only picks a demo account. Keep auth behind `AuthProviderAdapter` / `getAuthProvider()` so a real provider (GrandID, SITHS, OIDC, SAML) can be swapped in.
6. **All SEED_STATE and seed builders must carry `schemaVersion: CURRENT_SCHEMA_VERSION`** — never omit this field.
7. **Both locale files must be updated together** — never add English strings without Swedish equivalents and vice versa.
8. **Keep the migration chain contiguous** — every integer from 0 to `CURRENT_SCHEMA_VERSION` must be reachable.
