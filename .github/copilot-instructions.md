# GitHub Copilot Instructions — DUK Clinical Triage Demo

## Project overview

**DUK** (Digital Uppföljning Klinisk) is a fully client-side React/TypeScript demo of a clinical triage workflow for orthopaedic follow-up. There is no backend, no authentication, and no real patient data — everything lives in browser `localStorage` backed by an in-memory singleton store. The live demo can be deployed to GitHub Pages.

Primary language of the UI is **Swedish**; English is the i18n fallback. Code, comments, and commit messages are in **English**.

---

## Technology stack

| Layer             | Library / version                                                                |
| ----------------- | -------------------------------------------------------------------------------- |
| UI framework      | React 19 + TypeScript 5                                                          |
| Build tool        | Vite 7                                                                           |
| Component library | MUI v7 (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`)           |
| Forms             | React Hook Form v7 + Zod v4 (`@hookform/resolvers`)                              |
| Routing           | React Router v7 (hash router — deployed as static site)                          |
| i18n              | i18next v25 + react-i18next v16                                                  |
| Dates             | date-fns v4                                                                      |
| Markdown          | react-markdown v10                                                               |
| Tests             | Vitest v2 + @testing-library/react v16 + @testing-library/user-event v14 + jsdom |
| Linting           | ESLint 10 + typescript-eslint + eslint-plugin-react-hooks                        |
| Formatting        | Prettier 3                                                                       |
| Fake data (dev)   | @faker-js/faker (devDependency, dynamically imported)                            |

---

## Repository layout

```
src/
├── api/
│   ├── schemaVersion.ts        # CURRENT_SCHEMA_VERSION integer — single source of truth
│   ├── schemas/                # Zod schemas — single source of truth for all types
│   │   ├── state.ts            # AppStateSchema (includes schemaVersion field)
│   │   ├── case.ts, patient.ts, users.ts, journal.ts, journey.ts, …
│   │   ├── enums.ts            # All shared enum literals
│   │   └── index.ts            # Re-exports everything
│   ├── migrations.ts           # Migration chain: runMigrations(raw) → MigrationResult
│   ├── storage.ts              # localStorage r/w + in-memory singleton (getStore/setStore/patchStore)
│   ├── seed/                   # Minimal hand-crafted seed (~10 patients)
│   │   └── index.ts            # SEED_STATE — stamped with CURRENT_SCHEMA_VERSION
│   ├── seedRealistic/          # Programmatic ~320-patient cohort (PRNG, no faker)
│   ├── seedFaker.ts            # ~1 000-patient faker seed (dynamically imported)
│   ├── service/                # Pure business logic — reads getStore(), writes setStore()/patchStore()
│   │   ├── cases.ts, patients.ts, journal.ts, policy.ts, …
│   │   ├── seed.ts             # exportState / importState / resetAndReseed
│   │   └── utils.ts            # uuid(), now(), evaluatePolicyRules(), computeScores(), …
│   ├── client/                 # Async wrappers adding 100–400 ms simulated delay
│   │   └── index.ts            # Re-exports all client functions
│   ├── policyParser/           # Hand-written recursive-descent expression parser (no eval)
│   └── journalRenderer.ts      # Safe Mustache-like template renderer
├── components/
│   ├── layout/                 # AppShell, TopBar, SideNav
│   ├── common/                 # StatusChip, RoleSwitcher, MigrationErrorOverlay, …
│   ├── dashboard/              # QueueColumn, CaseListItem, DashboardToolbar
│   ├── case/                   # PatientCard, TriageTab, FormResponsesTab, JournalTab, AuditLogTab, JourneyTab
│   ├── journey/                # JourneyTimeline, ModifyJourneyDialog, editor tabs
│   ├── policy/                 # PolicyRuleForm, PolicyRuleList
│   └── demo/                   # SeedPanel, ExportPanel, ImportPanel
├── hooks/
│   ├── useApi.ts               # Generic async hook: { data, loading, error, refetch }
│   ├── useHotkeys.ts           # Keyboard shortcut map
│   ├── useRovingTabIndex.ts    # A11y arrow-key navigation
│   └── useFocusRestore.ts      # Restore focus on back navigation
├── i18n/
│   ├── index.ts                # i18next initialisation (sv primary, en fallback)
│   └── locales/sv/ & en/       # translation.json files
├── pages/                      # Route-level components (lazy imported by router)
│   ├── Dashboard.tsx
│   ├── CaseDetail.tsx
│   ├── Patients.tsx
│   ├── PatientView.tsx
│   ├── PolicyEditor.tsx
│   ├── JourneyEditor.tsx
│   └── DemoTools.tsx
├── router/index.tsx            # HashRouter + lazy routes + AppShell wrapper
├── store/
│   ├── roleContext.tsx          # Global role/user (RoleProvider, useRole)
│   └── snackContext.tsx         # Global snackbar (SnackProvider, useSnack)
├── App.tsx                     # ThemeProvider + RoleProvider + SnackProvider; accepts migrationError prop
└── main.tsx                    # Boot: runMigrations → initStore or render MigrationErrorOverlay
docs/
├── design.md                   # English design document
├── user_stories.md
└── diagrams/                   # PlantUML sources (render with npm run diagrams:render)
```

---

## Data layer architecture

### Storage singleton

All state lives in one JSON blob at `localStorage` key `duk_app_state`. Access from application code goes through `src/api/storage.ts` — no other file uses `localStorage` directly. The module exposes:

- `loadState()` → `unknown | null` (raw parse — no validation, callers own migration)
- `saveState(state)`, `clearState()`
- `initStore(state)` — first write (called once in `main.tsx`)
- `getStore()` → `AppState` (in-memory cache, throws if not initialised)
- `setStore(state)`, `patchStore(updater)` — write-through cache + localStorage
- `resetStore()` — clears memory and localStorage

### Schema versioning & migrations

`CURRENT_SCHEMA_VERSION` in `src/api/schemaVersion.ts` is an integer that must be bumped whenever `AppStateSchema` changes in a breaking way. Every seed sets `schemaVersion: CURRENT_SCHEMA_VERSION`.

At boot, `main.tsx` calls `runMigrations(raw)` from `src/api/migrations.ts`:

- Returns `{ ok: true, state: AppState }` on success (migrates v0 → v1 → … → current).
- Returns `{ ok: false, reason, storedVersion, rawState }` when migration is impossible (downgrade or no chain).
- On failure, `<App migrationError={...}>` renders `<MigrationErrorOverlay>` — a full-screen blocking UI with download-as-JSON and clear-and-restart actions.

**When adding a schema migration:**

1. Increment `CURRENT_SCHEMA_VERSION`.
2. Add a `{ from: N, to: N+1, up: (s) => ({...s, newField: default}) }` entry to the `MIGRATIONS` array in `src/api/migrations.ts`.
3. Keep the chain contiguous.

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
- Import with `import * as client from '../api/client'` in page and component files.

---

## Schemas & types

All types derive from Zod schemas in `src/api/schemas/`. Never write manual type definitions for domain objects — always use `z.infer<typeof SomeSchema>`.

Key schemas:

- `AppStateSchema` — flat object with 15 top-level fields + `schemaVersion: z.number().int().default(0)`
- `CaseSchema` — `id`, `patientId`, `category` (`ACUTE|SUBACUTE|CONTROL`), `status` (`NEW|NEEDS_REVIEW|TRIAGED|FOLLOWING_UP|CLOSED`), `triggers[]`, `policyWarnings[]`, etc.
- `PatientSchema` — `id`, `displayName`, `personalNumber` (Swedish), `dateOfBirth`, `palId?`, etc.
- `UserSchema` — `id`, `name`, `role` (`PATIENT|NURSE|DOCTOR|PAL`)
- `JourneyTemplateSchema` — template for a follow-up journey with ordered entries (`offsetDays`, `windowDays`, `scoreAliases`, etc.)
- `PatientJourneySchema` — active assignment of a template to a patient with `status` (`ACTIVE|COMPLETED|CANCELLED`) and `modifications[]`
- `PolicyRuleSchema` — `id`, `name`, `expression` (parsed by policyParser), `severity`, `enabled`
- All enum values are in `src/api/schemas/enums.ts`

---

## Components

### Conventions

- All components are named exports except page-level components (default exports).
- Props interfaces are defined inline above the component: `interface Props { ... }`.
- Use MUI components exclusively — do not introduce CSS files, Tailwind, or other styling libraries.
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
const { role, user } = useRole()
```

`role` is `'PATIENT' | 'NURSE' | 'DOCTOR' | 'PAL'`. PAL is a Doctor with restricted patient filter. Guard admin-only UI with `role !== 'PATIENT'`.

### Notifications

```tsx
const { showSnack } = useSnack()
showSnack(t('some.key'), 'success') // 'success' | 'error' | 'info' | 'warning'
```

---

## Internationalisation (i18n)

- **Swedish** (`sv`) is the primary locale; **English** (`en`) is the fallback.
- Translation files: `src/i18n/locales/sv/translation.json` and `src/i18n/locales/en/translation.json`.
- Always add keys to **both** locale files when adding new UI text. Never inline raw strings in JSX.
- Key naming convention: `camelCaseSection.camelCaseKey` — e.g. `patient.displayName`, `case.status`, `demoTools.exportTitle`.
- For enums rendered in the UI, use the pattern `t('enumSection.ENUM_VALUE')` — e.g. `t('status.NEW')`, `t('category.ACUTE')`.
- Run `npm run generate:i18n` to extract missing keys (uses i18next-cli).

---

## Testing

- Test files live in `src/tests/`.
- Use **Vitest** globals (`describe`, `it`, `expect`, `vi`) — no explicit imports needed.
- Use `@testing-library/react` for component tests. The setup file is `src/tests/setup.ts`.
- For storage-dependent tests, call `initStore(SEED_STATE)` before the test and `resetStore()` in `afterEach`.
- Do **not** mock the client layer in unit tests — call service functions directly when testing business logic.
- Test file naming: `featureName.test.ts` (logic), `featureName.test.tsx` (component/flow).

---

## Policy parser

`src/api/policyParser/` contains a hand-written recursive-descent parser with **no `eval()` or `new Function()`**. Policy expressions support:

- Boolean logic: `AND`, `OR`, `NOT`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Field access: `trigger.HIGH_PAIN`, `score.PNRS > 7`
- Functions: `hasFormResponse()`, `daysSince()`, `count()`
- Parentheses for grouping

Do not add `eval` or dynamic code execution under any circumstances.

---

## Journal renderer

`src/api/journalRenderer.ts` is a safe Mustache-like template renderer. Variables are `{{variableName}}`. It only processes whitelisted variables from the current scope — no arbitrary code execution.

---

## Scripts

| Command                   | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Vite dev server at `http://localhost:5173` |
| `npm run build`           | Type-check + Vite production build         |
| `npm test`                | Run all Vitest tests once                  |
| `npm run test:watch`      | Vitest watch mode                          |
| `npm run typecheck`       | `tsc --noEmit`                             |
| `npm run lint`            | ESLint with zero warnings allowed          |
| `npm run format`          | Prettier on `src/`                         |
| `npm run generate:i18n`   | Extract i18n keys                          |
| `npm run diagrams:render` | Render PlantUML diagrams to SVG via Docker |

---

## Routing

The router (`src/router/index.tsx`) uses `HashRouter` for static-site compatibility. All page components are **lazy-loaded**. Routes:

| Path              | Page                         |
| ----------------- | ---------------------------- |
| `/dashboard`      | Dashboard (default redirect) |
| `/cases/:id`      | CaseDetail                   |
| `/patients`       | Patients list                |
| `/patients/:id`   | PatientView                  |
| `/policy`         | PolicyEditor                 |
| `/journey-editor` | JourneyEditor                |
| `/demo-tools`     | DemoTools                    |

---

## Keyboard shortcuts

| Key            | Action                    |
| -------------- | ------------------------- |
| `/`            | Focus search on Dashboard |
| `g d`          | Navigate to Dashboard     |
| `g c`          | Navigate to current Case  |
| `↑ ↓`          | Navigate queue items      |
| `Home` / `End` | First/last queue item     |

Keyboard shortcuts are registered with `useHotkeys` from `src/hooks/useHotkeys.ts`. Roving tab index for accessible arrow-key navigation uses `useRovingTabIndex`.

---

## Hard constraints (never violate)

1. **No `eval()` or `new Function()`** anywhere in the codebase.
2. **No direct `localStorage` access** outside `src/api/storage.ts`.
3. **No real patient data** — all names, personal numbers and clinical values are fictional.
4. **No network calls** — there is no backend; all async operations resolve against the in-memory store.
5. **No authentication logic** — role switching is purely for demo purposes.
6. **All SEED_STATE and seed builders must carry `schemaVersion: CURRENT_SCHEMA_VERSION`** — never omit this field.
7. **Both locale files must be updated together** — never add English strings without Swedish equivalents and vice versa.
8. **Keep the migration chain contiguous** — every integer from 0 to `CURRENT_SCHEMA_VERSION` must be reachable.
