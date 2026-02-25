**Journal Templating — Whitelist & Rules**

Overview

- Journal templates are rendered by a safe, Mustache-like renderer at `src/api/journalRenderer.ts`.
- Only whitelisted tokens and boolean flags are supported. No helpers, no expressions, no code execution.

Allowed token patterns

- `{{patient.displayName}}`, `{{patient.personalNumber}}`, `{{patient.dateOfBirth}}`
- `{{case.category}}`, `{{case.status}}`, `{{case.deadline}}`
- `{{scores.ALIAS}}` — numeric score values (aliases injected from journeys)
- `{{label.ALIAS}}` — human readable labels for scores or answers
- `{{policyWarnings.list}}` — formatted list of policy warnings

Conditionals

- `{{#if triggers.NOT_OPENED}}...{{/if}}` — allowed only for a small whitelist of flags (e.g., `triggers.NOT_OPENED`, `triggers.NO_RESPONSE`, `triggers.HIGH_PAIN`).
- Conditionals evaluate truthily only for boolean or existence checks; no nested expressions.

Security & authoring

- Templates are validated against `WHITELIST_TOKENS` inside `journalRenderer`. When creating new templates, ensure tokens are among the whitelist or update the whitelist in `journalRenderer`.
- Examples are seeded in `src/api/seed/journalTemplates.ts`.

Renderer behaviour

- Missing tokens are rendered as empty strings and a warning is logged to the audit (template render warnings).
- Approving a draft emits an audit event (JOURNAL_DRAFT_APPROVED) and sets `status=APPROVED`.
