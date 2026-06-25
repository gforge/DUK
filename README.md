# DUK — Clinical Triage Demo

A fully interactive clinical triage flow demonstration built with React, TypeScript and Material UI.

> **This is a demo application. It contains no real patient data, no authentication, and no network calls. All data is stored in browser `localStorage`.**

**[→ Live demo](https://gforge.github.io/DUK/)**

---

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Features

### Role-based views

Switch role from the top bar to experience each perspective:

| Role          | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| **Doctor**    | Dashboard, triage, journal approve                          |
| **Nurse**     | Dashboard, triage, journal view                             |
| **Secretary** | Worklist coordination, contact logistics, booking follow-up |
| **Patient**   | Patient portal: view own cases, open app, seek contact      |

`PAL` (patient-responsible physician) is modeled as an ownership assignment, not as a separate user role.
Ownership can be set on patient level and journey level (with episode fallback).

### Dashboard

- Three queues: **Acute**, **Sub-acute**, **Control**
- Filter by "All", "Assigned to me", or "Created by me"
- Search patients by name
- Keyboard shortcut `/` to focus search, `g d` to go to Dashboard

### Case Detail (5 tabs)

1. **Forms** — View all submitted questionnaire responses with computed scores
2. **Journey** — View and manage assigned journeys, effective steps, and timeline
3. **Triage** — Clinician decision form (next step, deadline, role assignment, patient message)
4. **Journal** — Generate draft journal entries from templates, preview, copy, approve
5. **Audit Log** — Full activity history per case

### State Machine

```
NEW → NEEDS_REVIEW → TRIAGED → FOLLOWING_UP → CLOSED
                              ↘ CLOSED
```

### Policy Engine

Safe expression evaluator (no `eval`, no `Function` constructor).

Supported syntax:

```
PNRS_1 >= 7
OSS.total < 22 && PNRS_2 > 5
EQ5D.index <= 0.5 || EQ_VAS < 30
(OSS.total + PNRS_1) > 25
```

Available variables: `PNRS_1`, `PNRS_2`, `OSS.total`, `EQ5D.index`, `EQ_VAS`, `OSS.function`, `OSS.pain`

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
- **Reset & Re-seed** back to the original demo data

### Worklist (`/worklist`)

- Structured queue for operational follow-up tasks
- Filters for category, assigned role, responsible-physician and ownership views
- Completion dialog with scheduling metadata and comments

### Patient Detail (`/patients/:id`)

- Clinician detail page for longitudinal patient context
- Complements list view (`/patients`) and patient self-view (`/patient`)

---

## Architecture

```
src/
├── api/
│   ├── schemas.ts          # Zod schemas — single source of truth for all types
│   ├── storage.ts          # localStorage persistence + in-memory singleton store
│   ├── seed.ts             # Demo data: 10 patients, 10 cases, 8 form responses
│   ├── policyParser.ts     # Safe recursive-descent expression parser (no eval)
│   ├── journalRenderer.ts  # Safe Mustache-like template renderer
│   ├── service.ts          # All state mutations + business logic
│   └── client.ts           # Async wrapper with 100–400ms simulated delay
├── i18n/
│   ├── index.ts            # i18next config (sv primary, en fallback)
│   └── locales/
│       ├── sv/translation.json  # Swedish translations
│       └── en/translation.json  # English translations
├── store/
│   ├── roleContext.tsx     # Global role/user switching context
│   └── snackContext.tsx    # Global MUI Snackbar notifications
├── hooks/
│   ├── useApi.ts           # Generic async data-fetching hook
│   ├── useRovingTabIndex.ts# A11y arrow-key navigation
│   ├── useHotkeys.ts       # Keyboard shortcuts
│   └── useFocusRestore.ts  # Focus restoration on back navigation
├── router/
│   └── index.tsx           # React Router v7 routes
├── components/
│   ├── layout/             # AppShell, TopBar, SideNav
│   ├── common/             # RoleSwitcher, LanguageSwitcher, StatusChip
│   ├── dashboard/          # QueueColumn, CaseListItem
│   └── case/               # PatientCard, FormResponsesTab, TriageTab,
│                           #   JournalTab, AuditLogTab
└── pages/
    ├── Dashboard.tsx
    ├── CaseDetail.tsx
    ├── PatientView.tsx
    ├── Patients.tsx
    ├── PatientDetail.tsx
    ├── PolicyEditor.tsx
    ├── JourneyEditor.tsx
    ├── Worklist.tsx
    └── DemoTools.tsx
```

### Design docs & diagrams

- The English design document and PlantUML sources are in `docs/design.md` and `docs/diagrams/`.
- Diagrams include component, state, class (ERD) and sequence diagrams that map to implementation files.

### Documentation map

Use this reading order for architecture and flow understanding:

1. `docs/design.md` — integrated narrative with inline diagrams.
2. `docs/design/patient-journey.md` — journey lifecycle, pause/resume, parallel deduplication.
3. `docs/design/policy.md` — policy grammar, scope aliasing, evaluation flow.
4. `docs/diagrams/*.puml` — source diagrams (render with `npm run diagrams:render`).

---

## Available Scripts

| Command                 | Description                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Start dev server at http://localhost:5173                                                                                                     |
| `npm run build`         | Type-check + build for production                                                                                                             |
| `npm run preview`       | Preview production build                                                                                                                      |
| `npm test`              | Run all tests once                                                                                                                            |
| `npm run test:watch`    | Run tests in watch mode                                                                                                                       |
| `npm run format`        | Format source files with Prettier                                                                                                             |
| `npm run generate:i18n` | Extract i18n keys into `src/i18n/locales/*/translation.json` — run after adding or changing UI text; updates both `sv` and `en` locale files. |

---

## Keyboard Shortcuts

| Shortcut       | Action                                 |
| -------------- | -------------------------------------- |
| `/`            | Focus search box (on Dashboard)        |
| `g d`          | Go to Dashboard                        |
| `g c`          | Go to current Case (if on a case page) |
| `↑ ↓`          | Navigate within queue columns          |
| `Home` / `End` | Jump to first/last item in queue       |

---

## Technology Stack

- **React 19** + **TypeScript**
- **Vite 7** — build tool
- **MUI v7** — UI components
- **React Hook Form v7** + **Zod** — form validation
- **i18next** — internationalisation (sv/en)
- **React Router v7** — client-side routing
- **date-fns v4** — date formatting
- **Vitest** + **@testing-library/react** — tests

---

## Security Note

- No `eval()` or `new Function()` — the policy parser is a hand-written recursive descent parser
- No network calls — all API calls resolve against an in-memory store backed by localStorage
- No authentication — role switching is for demo purposes only
- No real patient data — all names, personal numbers and clinical data are entirely fictional
