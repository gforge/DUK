# DUK — Clinical Triage Demo

A fully interactive clinical triage flow demonstration built with React, TypeScript and Material UI.

> **This is a demo application. It contains no real patient data, no real authentication (only a fake local login), and no network calls. All data is stored in browser `localStorage`.**

**[→ Live demo](https://gforge.github.io/DUK/)**

---

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

Alternatively, add the `duk-*` helper commands to your PATH (with tab completion):

```bash
source setup.sh                # this shell only; add --install to persist in ~/.bashrc
duk-install [--clean] [--setup] # npm install (or clean npm ci); --setup adds PATH + completion to ~/.bashrc
duk-build [check]              # build into dist/; check = typecheck+lint+tests first
duk-publish [--check] [--yes]  # build and publish to GitHub Pages (asks first)
duk-run [dev|preview|test]     # dev server (default), serve dist/, or watch tests
```

---

## Features

### Login & role-based views

The app opens on a fake login page (`/login`) where you pick a demo account. The session is kept in `localStorage` for 8 hours; log out (or change language) from the account menu behind the avatar in the top bar. The fake provider lives in `src/auth/` behind an `AuthProviderAdapter` interface so a real provider (GrandID, SITHS, OIDC, SAML) can be plugged in later.

| Role          | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| **Doctor**    | Patientöversikt, triage, journal approve, start next journey phase         |
| **Nurse**     | Patientöversikt, triage, journal drafts (no approve)                       |
| **Secretary** | Åtgärdslista (worklist) coordination, contact logistics, booking follow-up |
| **Patient**   | Patient portal: view own cases, answer forms, seek contact                 |

`PAL` (patient-responsible physician) is modeled as an ownership assignment, not as a separate user role.
Ownership can be set on patient level and journey level (with episode fallback).

Clinicians can also search patients by name or personal number from the top bar.

### Patientöversikt (`/dashboard`)

- One table section per category: **Acute**, **Sub-acute**, **Control** — collapsible (state is remembered), with expand/collapse all
- Filter by "All", "My patients" (PAL) or "Created by me"; sort by longest wait, priority or name
- Search by patient name or case/patient id
- Cases between journey phases and cases closed during the last 7 days can be shown as muted rows

### Case Detail / Triagera (5 tabs)

A case header shows patient, status and triggers, plus contact actions (contacted, reminder sent, call attempt — all audited).

1. **Forms** — View all submitted questionnaire responses with computed scores
2. **Journey** — Episode of care with referral info (referrer, reason, diagnoses via simulated TakeCare "uthopp"), all patient journeys, effective steps and timeline; pause/resume, modify, cancel, start next phase
3. **Triage** — Single-page triage form: contact mode (digital / phone / visit / close), competence (doctor / nurse / physio), recipient (any, PAL, one or more named people, or a care team), due date (accepts shorthands like `3d`, `2v`, `1/3`) and patient message, with a sticky decision summary. Also lab/X-ray reviews (pending reviews block triage) and advisory colleague review requests (second opinion)
4. **Journal** — Bookings, plus draft journal entries toggled per template (deselecting deletes the draft): preview, copy, approve (doctor)
5. **Audit Log** — Full activity history per case

### State Machine

```
NEW ──→ NEEDS_REVIEW ──→ TRIAGED ──→ FOLLOWING_UP ──→ CLOSED
 └───────────────────────↗
(every non-closed status can also go directly to CLOSED)
```

`NEW → NEEDS_REVIEW` happens when the patient submits a form; clinicians can triage or close a `NEW` case directly.

### Policy Engine

Safe expression evaluator (no `eval`, no `Function` constructor).

Supported syntax:

```
PNRS_1 >= 7
OSS.total < 22 && PNRS_2 > 5
EQ5D.index <= 0.5 || EQ_VAS < 30
(OSS.total + PNRS_1) > 25
```

Operators: `+ - * /`, `== != < <= > >=`, `&& ||` and parentheses.

Variables are the answer keys and computed scores of the case's form responses (e.g. `PNRS_1`, `PNRS_2`, `OSS.total`, `OKS.total`, `OHS.total`, `PRWE.total`, `MOXFQ.total`, `EQ5D.index`, `EQ_VAS`), plus journey-step score aliases (e.g. `PNRS_week4`, `EQ5D_6m`). Each rule is bound to a journey template and only evaluated when the patient has an active journey on it.

### Journal Templates

Safe Mustache-like renderer with whitelisted tokens only:

```
Patient: {{patient.displayName}}
Score: {{scores.PNRS_1}}
{{#if triggers.HIGH_PAIN}}High pain alert{{/if}}
```

### Demo Tools (`/demo-tools`)

- **Export** current app state as JSON
- **Import** a previously exported JSON state
- **Seed presets**: minimal hand-crafted seed, realistic cohort (~320 patients) or large faker seed (~1 000 patients), or clear all data

The demo data is versioned: an outdated stored demo is replaced by the current seed on startup, and demo dates are re-anchored to today so the examples never go stale.

### Åtgärdslista / Worklist (`/worklist`)

- Structured queue for operational follow-up tasks, in **Active**, **Monitoring** and **Completed** tabs
- Filters for contact type, competence, recipient (any / PAL / named / team), "Assigned to me" and "My patients"; groups per contact type are collapsible
- Tasks without a single owner (any, multi-person or team) can be claimed
- Completion dialog with next contact date and comments

### Patients (`/patients`, `/patients/:id`)

- Patient list and clinician detail page for longitudinal patient context (responsibility/PAL, journeys, cases)
- Complements the patient self-view (`/patient`)

### Patientresor / Journey Editor (`/journeys`)

- Journey templates grouped into care pathways with ordered phases, timeline, step list with inline instructions and a step editor drawer
- Tabs for research modules, patient journeys, instruction templates and questionnaires; editor changes can be undone

---

## Architecture

```
src/
├── api/
│   ├── schemas/            # Zod schemas — single source of truth for all types
│   ├── schemaVersion.ts    # CURRENT_SCHEMA_VERSION (v18) + CURRENT_DEMO_DATA_VERSION
│   ├── migrations.ts       # Contiguous migration chain for stored state
│   ├── bootstrap.ts        # Boot: migrate, replace outdated demo data, re-anchor dates
│   ├── storage.ts          # localStorage persistence + in-memory singleton store
│   ├── seed/               # Minimal hand-crafted demo data (incl. referral examples)
│   ├── seedRealistic/      # ~320-patient cohort; seedFaker.ts ~1 000 patients
│   ├── policyParser/       # Safe recursive-descent expression parser (no eval)
│   ├── journalRenderer.ts  # Safe Mustache-like template renderer
│   ├── service/            # All state mutations + business logic
│   └── client/             # Async wrapper with 100–400ms simulated delay
├── auth/                   # Replaceable fake auth provider + session types
├── i18n/
│   ├── index.ts            # i18next config (sv default, en available)
│   └── locales/
│       ├── sv/translation.json  # Swedish translations
│       └── en/translation.json  # English translations
├── store/
│   ├── roleContext.tsx     # Session/current user context (login, logout, isRole)
│   └── snackContext.tsx    # Global MUI Snackbar notifications
├── hooks/                  # useApi, useHotkeys, useRovingTabIndex, useFocusRestore,
│                           #   useNavItems, useWorklistQueue, useCollapsedSections, …
├── router/
│   └── index.tsx           # React Router v7 routes (login + protected app)
├── theme.ts                # MUI theme + design tokens
├── components/
│   ├── layout/             # AppShell, TopBar, SideNav, GlobalSearch
│   ├── common/             # Shared primitives: PageHeader, SectionCard, GridTable,
│   │                       #   SegmentedControl, Tag, StatusChip, RoleSwitcher (account menu), …
│   ├── dashboard/          # QueueColumn, CaseListItem, DashboardToolbar
│   ├── case/               # CaseHeader, ContactActions, tabs, triage/ form sections,
│   │                       #   ColleagueReviews, ClinicalReviewPanel, BookingsList
│   ├── journey/            # Timeline, dialogs and journey editor tabs
│   ├── patients/           # Patient table, detail sections, register/assign dialogs
│   ├── patientView/        # Patient portal components
│   ├── policy/             # Policy rules table and dialogs
│   ├── worklist/           # Worklist filters, groups, rows, completion dialog
│   └── demo/               # Seed, export and import panels
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── CaseDetail.tsx
    ├── PatientView.tsx
    ├── Patients.tsx
    ├── PatientDetail.tsx
    ├── PolicyEditor.tsx
    ├── JourneyEditor.tsx
    ├── Worklist.tsx
    ├── DemoTools.tsx
    └── NotFound.tsx
```

Selected shared components from `src/components/common` and `src/components/layout` are synced to claude.ai/design (config in `.design-sync/`, see `.design-sync/NOTES.md`).

### Design docs & diagrams

- The English design document and PlantUML sources are in `docs/design.md` and `docs/diagrams/`.
- Diagrams include component, state, class (ERD) and sequence diagrams that map to implementation files.

### Documentation map

Use this reading order for architecture and flow understanding:

1. `docs/design.md` — integrated narrative with inline diagrams.
2. `docs/design/data-model.md` — entities and relationships.
3. `docs/design/patient-journey.md` — journey lifecycle, pause/resume, parallel deduplication.
4. `docs/design/policy.md` — policy grammar, scope aliasing, evaluation flow.
5. `docs/design/templating.md` — journal template rendering.
6. `docs/user_stories.md` — user stories per role.
7. `docs/diagrams/*.puml` — source diagrams (render with `npm run diagrams:render`).

---

## Available Scripts

| Command                 | Description                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Start dev server at http://localhost:5173                                                                                                     |
| `npm run build`         | Type-check + build for production                                                                                                             |
| `npm run preview`       | Preview production build                                                                                                                      |
| `npm run deploy`        | Build and publish `dist/` to GitHub Pages (or use `duk-publish`)                                                                              |
| `npm test`              | Run all tests once                                                                                                                            |
| `npm run test:watch`    | Run tests in watch mode                                                                                                                       |
| `npm run check`         | Type-check + lint                                                                                                                             |
| `npm run format`        | Format source files with Prettier                                                                                                             |
| `npm run generate:i18n` | Extract i18n keys into `src/i18n/locales/*/translation.json` — run after adding or changing UI text; updates both `sv` and `en` locale files. |

---

## Keyboard Shortcuts

| Shortcut       | Action                          |
| -------------- | ------------------------------- |
| `/`            | Focus search box (on Dashboard) |
| `g d`          | Go to Dashboard                 |
| `↑ ↓`          | Navigate between case rows      |
| `Home` / `End` | Jump to first/last case row     |

---

## Technology Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool
- **MUI v9** — UI components
- **React Hook Form v7** + **Zod v4** — form validation
- **i18next** — internationalisation (sv/en)
- **React Router v7** — client-side routing
- **date-fns v4** — date formatting
- **Vitest** + **@testing-library/react** — tests

---

## Security Note

- No `eval()` or `new Function()` — the policy parser is a hand-written recursive descent parser
- No network calls — all API calls resolve against an in-memory store backed by localStorage
- No real authentication — the fake login only picks a demo account; it has no credentials and must be replaced by a real provider before any production use
- No real patient data — all names, personal numbers and clinical data are entirely fictional
