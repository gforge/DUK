## Plan: TriageDecision Refactor, Shared Worklist, Secretary Access

Refactor triage into a clear two-step decision model where triage primarily describes patient next step, while assignment is secondary metadata. Keep Dashboard handoff UX (remain briefly, move to bottom, highlight, disappear), Worklist intake UX (new-row highlight + count pulse), and secretary access scope (Worklist + Patients list/read-only patient detail + limited CaseDetail). Keep existing frontend architecture (React + MUI + service/client/useApi + i18n) and avoid unnecessary complexity.

**Target Domain Model**

```ts
type ContactMode = 'DIGITAL' | 'PHONE' | 'VISIT' | 'CLOSE'
type CareRole = 'DOCTOR' | 'NURSE' | 'PHYSIO' | null
type AssignmentMode = 'ANY' | 'PAL' | 'NAMED' | null

interface TriageDecision {
  contactMode: ContactMode
  careRole: CareRole
  assignmentMode: AssignmentMode
  assignedUserId?: string | null
  dueAt?: string | null
  note?: string | null
}
```

**Domain Rules**

1. `CLOSE` is terminal: no `careRole`, no `assignmentMode`, normally no Worklist item.
2. `PAL` is valid only when `careRole === 'DOCTOR'`.
3. `NAMED` is valid for `DOCTOR`, `NURSE`, and `PHYSIO`.
4. `ANY` means no specific person target.
5. `assignedUserId` is used only when `assignmentMode === 'NAMED'`.

**Worklist Semantics (Primary = Work Category, Not Role Ownership)**

1. Derive shared queue category from `contactMode`:
   - `VISIT` => visit-related work
   - `PHONE` => phone follow-up work
   - `DIGITAL` => digital follow-up workImpleme
   - `CLOSE` => no Worklist item in normal cases
2. Use `careRole` and `assignmentMode` as secondary metadata for display/filtering.
3. Keep claim as optional secondary ownership (`claimed by me`), not primary partitioning.

**Implementation Steps**

1. Phase 1: Data model refactor foundation.
2. Add new enums/schemas for `ContactMode`, `CareRole`, `AssignmentMode`, and `TriageDecision` in schema layer.
3. Embed `triageDecision` in case model while keeping backward compatibility during migration period.
4. Implement schema validation rules (including cross-field constraints) in Zod/refinement helpers.
5. Add migration path from old triage fields (`nextStep`, `assignedRole`, etc.) to `triageDecision`.
6. Update service-layer triage APIs to accept and persist `TriageDecision`.
7. Keep existing client API wrappers stable where possible; add adapter layer if needed.
8. Phase 2: Triage UX refactor (two-step flow).
9. Replace current 2x3 action grid with Step 1 contact mode selection: Digital, Telefon, Besok, Avslut.
10. Add Step 2 configuration (for non-close outcomes): care role, assignment mode, optional named person, due date, note.
11. Enforce UI-level constraints dynamically:
    - hide Step 2 entirely for `CLOSE`
    - show `PAL` option only when care role is doctor
    - show person picker only for `NAMED`
12. Preserve optimistic-feeling UX and existing snack/error patterns.
13. Phase 3: Worklist derivation and filters.
14. Refactor Worklist grouping to queue-category-first (visit, phone, digital).
15. Add secondary filters: doctor-related, nurse-related, physio-related, PAL items, claimed by me, my patients.
16. Keep optional role filter as helper only; it must not define base queue ownership.
17. Keep secretary access broad for administrative work; do not require role-mode switching to see relevant items.
18. Phase 4: Handoff and intake animations.
19. Keep Dashboard post-triage retention bucket: row remains briefly, moves to bottom, highlights, then disappears.
20. Keep Worklist intake signals: new row highlight + count pulse on increment.
21. Ensure transitions avoid teleportation and preserve orientation.
22. Phase 5: Secretary role/access consistency.
23. Keep secretary scope from prior plan: Worklist + Patients list/read-only patient detail + limited CaseDetail.
24. Enforce permissions with role checks on actions, not queue ownership model.
25. Phase 6: i18n, tests, validation.
26. Add all new strings in both `sv` and `en` locale files.
27. Add tests for schema rules, migration mapping, triage form rules, worklist derivation/filtering, and secretary permissions.
28. Run typecheck/lint/tests and manual role-switch walkthroughs.

**Affected Components and Modules**

- `/home/max/workspace/duk/src/api/schemas/enums.ts` - add `ContactMode`, `CareRole`, `AssignmentMode` enums and `SECRETARY` role if not already present.
- `/home/max/workspace/duk/src/api/schemas/case.ts` - introduce `TriageDecisionSchema` and integrate into case schema.
- `/home/max/workspace/duk/src/api/migrations.ts` - add contiguous migration from current schema version to triageDecision model.
- `/home/max/workspace/duk/src/api/schemaVersion.ts` - bump current schema version if migration added.
- `/home/max/workspace/duk/src/api/service/cases.ts` - refactor triage write/read logic to persist `triageDecision` and derive status/work semantics.
- `/home/max/workspace/duk/src/api/client/cases.ts` - update triage payload typing and keep async wrappers consistent.
- `/home/max/workspace/duk/src/components/case/TriageTab/index.tsx` - replace current action matrix with two-step triage flow UI.
- `/home/max/workspace/duk/src/components/case/triage/*` - refactor selector/details components for new contact mode + role/assignment flow.
- `/home/max/workspace/duk/src/pages/Worklist.tsx` - derive grouping from `triageDecision.contactMode`; implement category-first and secondary filters.
- `/home/max/workspace/duk/src/components/worklist/GroupSection.tsx` - update group labels/counts for category-first sections.
- `/home/max/workspace/duk/src/components/worklist/WorklistRow.tsx` - display care role/assignment metadata and claim state as secondary attributes.
- `/home/max/workspace/duk/src/pages/Dashboard.tsx` - keep triaged retention orchestration for handoff UX.
- `/home/max/workspace/duk/src/components/dashboard/QueueColumn.tsx` - keep move-to-bottom/highlight/disappear behavior for triaged rows.
- `/home/max/workspace/duk/src/components/dashboard/sortCases.ts` - keep urgency sorting with temporary triaged-row placement rule.
- `/home/max/workspace/duk/src/hooks/useNavItems.ts` - ensure secretary nav visibility scope remains as agreed.
- `/home/max/workspace/duk/src/pages/Patients.tsx` - enforce secretary read-only expectations.
- `/home/max/workspace/duk/src/pages/PatientDetail.tsx` and `/home/max/workspace/duk/src/pages/CaseDetail.tsx` - keep limited secretary actions/tabs.
- `/home/max/workspace/duk/src/store/roleContext.tsx` - ensure demo role switch includes secretary.
- `/home/max/workspace/duk/src/hooks/labels/useRoleLabel.ts` - role label completeness including secretary.
- `/home/max/workspace/duk/src/i18n/locales/sv/translation.json` - add Swedish labels/options/help text for new triage flow.
- `/home/max/workspace/duk/src/i18n/locales/en/translation.json` - add matching English labels/options/help text.
- `/home/max/workspace/duk/src/tests/triage.test.ts` - domain rules and service mapping for `TriageDecision`.
- `/home/max/workspace/duk/src/tests/triage.flow.test.tsx` - two-step triage UI flow and validation behavior.
- `/home/max/workspace/duk/src/tests/*worklist*.test*` - queue-category derivation and filter behavior.

**Verification**

1. Automated: run `npm run typecheck`, `npm run lint`, `npm test`.
2. Migration check: load old stored state and confirm triage data maps correctly to `triageDecision`.
3. Manual triage flow:
   - Besok + Lakare + PAL (only if a PAL is set in the system, otherwise fallback to ANY, or let user pick a specific doctor from a autocomplete list)
   - Besok + Lakare + Specifik person
   - Telefon + Sjukskoterska + Valfri
   - Digital + Fysioterapeut + Specifik person
   - Avslut (no step 2)
4. Manual handoff UX: triaged row briefly remains in dashboard, moves to bottom, highlights, then disappears.
5. Manual Worklist UX: new items highlight and worklist count pulses.
6. Manual secretary UX: sees shared administrative work categories without role-first queue partitioning.
7. Regression checks: patient role restrictions unchanged; clinician workflows still valid.

**Decisions Captured**

1. Triage is patient-next-step-first, not recipient-first.
2. Worklist is shared queue-category-first; role and assignment are secondary metadata.
3. Claiming is optional secondary ownership.
4. Secretary access remains enabled but Worklist is not modeled as secretary-only.
5. Preserve current Dashboard and Worklist animation goals.

**Further Considerations**

1. Keep old fields temporarily only if needed for migration safety; remove after stabilization to avoid dual-model drift.
2. Consider centralizing triage decision -> work category derivation in a pure helper used by both service and UI.
3. If backend parity is planned later, keep `TriageDecision` shape API-friendly and audit-friendly.
