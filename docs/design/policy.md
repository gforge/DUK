**Policy Evaluation — Language, Scope, And Runtime Flow**

This document explains how policy rules are authored, parsed, evaluated, and surfaced in case triage.

Read `../design.md` first for the full clinical flow.

## End-To-End Evaluation Flow

![Case Triage Policy Sequence](../diagrams/triage-policy-sequence.svg)

What this diagram shows:

- Triage triggers policy evaluation as part of case update handling.
- Scope is assembled from latest form responses and score aliases.
- Matching rules become `Case.policyWarnings`.

## Language Model

![Policy Grammar](../diagrams/policy-grammar.svg)

Supported categories:

- Arithmetic: `+ - * /`
- Comparison: `== != < <= > >=`
- Logical: `&& ||`
- Parenthesized expressions and identifiers

Design constraint:

- Parser is hand-written recursive descent; no `eval`, no dynamic execution.

## Alias-Aware Scope Construction

![Score Aliasing](../diagrams/score-aliasing.svg)

What this diagram shows:

- Raw score keys are transformed into stable aliases for policy authors.
- Aliases keep expressions readable and resilient to internal score key changes.

## Input Pipeline Context

![Form Submission Flow](../diagrams/form-submission-flow.svg)

Why this matters for policy:

- New form responses feed scoring.
- Scored outputs become policy scope inputs.
- Policy warnings feed back into queue and case visuals.

## Authoring Guidance

- Prefer clinically meaningful aliases over raw score key names.
- Keep rules short and composable.
- Validate edge cases where fields may be missing.
- Treat unknown identifiers as non-matching conditions.

## Key Code References

- `../../src/api/policyParser/tokens.ts`
- `../../src/api/policyParser/parser.ts`
- `../../src/api/service/policy.ts`
- `../../src/api/service/journeyResolver.ts`
