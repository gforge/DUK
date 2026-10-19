import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Conservative (cast) treatment of a distal radius fracture.
 * Anchored on the injury date — there is no surgery, so the fracture itself is
 * the triggering event. Dashboard categories follow time since the injury:
 *   0–2 weeks ACUTE, 2–8 weeks SUBACUTE, later CONTROL.
 *
 * Timeline from injury (day 0):
 *   Day   1–3  — Cast check (numbness, swelling, pain)
 *   Day   7–10 — X-ray position check + cast questionnaire (XRAY review)
 *   Week  4–5  — Cast removal, PRWE-short
 *   Week  8    — Function check, PRWE-short
 *   6 months / 1 year — EQ-5D + PRWE-short
 *
 * If the day 7–10 X-ray shows secondary displacement the patient is operated and
 * switched to "Distala radiusfraktur — operativ" via startNextPhase (SURGERY_COMPLETED),
 * which re-anchors the follow-up on the surgery date.
 */
export const jtDistalRadiusConservative: JourneyTemplate = {
  id: 'jt-distal-radius-conservative',
  name: 'Distala radiusfraktur — konservativ (gips)',
  description:
    'Gipsbehandlad distal radiusfraktur. Gipskontroll dag 1–3, röntgenkontroll av frakturläge dag 7–10, gipsborttagning vecka 4–5. Vid sekundär dislokation opereras patienten och byter till det operativa programmet.',
  referenceDateLabel: 'Skadedatum',
  anchorEventType: 'INJURY',
  group: 'Frakturer',
  entries: [
    {
      id: 'jte-drc-1',
      label: 'Dag 1–3 – gipskontroll',
      offsetDays: 2,
      windowDays: 1,
      order: 1,
      templateId: 'qt-numbness-infection',
      dashboardCategory: 'ACUTE',
      scoreAliases: { PNRS_1: 'PNRS_baseline' },
      scoreAliasLabels: { PNRS_baseline: 'VAS (PNRS) vid dag 1–3' },
    },
    {
      id: 'jte-drc-2',
      label: 'Dag 7–10 – röntgenkontroll (frakturläge)',
      offsetDays: 8,
      windowDays: 2,
      order: 2,
      templateId: 'qt-cast-check',
      dashboardCategory: 'ACUTE',
      scoreAliases: { PNRS_2: 'PNRS_day8', PNRS_NIGHT: 'PNRS_NIGHT_day8' },
      scoreAliasLabels: {
        PNRS_day8: 'VAS (PNRS) vid dag 7–10',
        PNRS_NIGHT_day8: 'Nattsmärta (PNRS) vid dag 7–10',
      },
      reviewTypes: ['XRAY'],
    },
    {
      id: 'jte-drc-3',
      label: 'Vecka 4–5 – gipsborttagning',
      offsetDays: 32,
      windowDays: 3,
      order: 3,
      templateId: 'qt-function-prwe-short',
      dashboardCategory: 'SUBACUTE',
      scoreAliases: { PNRS_2: 'PNRS_week4', 'PRWE.total': 'PRWE_week4' },
      scoreAliasLabels: {
        PNRS_week4: 'VAS (PNRS) vid gipsborttagning',
        PRWE_week4: 'PRWE-short vid gipsborttagning',
      },
    },
    {
      id: 'jte-drc-4',
      label: 'Vecka 8 – funktionskontroll',
      offsetDays: 56,
      windowDays: 5,
      order: 4,
      templateId: 'qt-function-prwe-short',
      dashboardCategory: 'SUBACUTE',
      scoreAliases: { PNRS_2: 'PNRS_week8', 'PRWE.total': 'PRWE_week8' },
      scoreAliasLabels: {
        PNRS_week8: 'VAS (PNRS) vid vecka 8',
        PRWE_week8: 'PRWE-short vid vecka 8',
      },
    },
    {
      id: 'jte-drc-5',
      label: '6 månader',
      offsetDays: 180,
      windowDays: 14,
      order: 5,
      templateId: 'qt-eq5d-prwe-short',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'PRWE.total': 'PRWE_6m', 'EQ5D.index': 'EQ5D_6m', EQ_VAS: 'EQ_VAS_6m' },
      scoreAliasLabels: {
        PRWE_6m: 'PRWE-short vid 6 månader',
        EQ5D_6m: 'EQ-5D index vid 6 månader',
        EQ_VAS_6m: 'EQ VAS vid 6 månader',
      },
    },
    {
      id: 'jte-drc-6',
      label: '1 år',
      offsetDays: 365,
      windowDays: 14,
      order: 6,
      templateId: 'qt-eq5d-prwe-short',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'PRWE.total': 'PRWE_1yr', 'EQ5D.index': 'EQ5D_1yr', EQ_VAS: 'EQ_VAS_1yr' },
      scoreAliasLabels: {
        PRWE_1yr: 'PRWE-short vid 1 år',
        EQ5D_1yr: 'EQ-5D index vid 1 år',
        EQ_VAS_1yr: 'EQ VAS vid 1 år',
      },
    },
  ],
  instructions: [
    {
      id: 'jti-drc-1',
      journeyTemplateId: 'jt-distal-radius-conservative',
      instructionTemplateId: 'it-cast-care',
      label: 'Gipsperiod: Gipsvård och varningstecken',
      startDayOffset: 0,
      endDayOffset: 32,
      order: 1,
      tags: ['cast', 'wrist', 'acute'],
    },
    {
      id: 'jti-drc-2',
      journeyTemplateId: 'jt-distal-radius-conservative',
      instructionTemplateId: 'it-distal-radius',
      label: 'Efter gipsborttagning: Handledsfysioterapi',
      startDayOffset: 32,
      endDayOffset: 84,
      order: 2,
      tags: ['wrist', 'physio'],
    },
  ],
  createdAt: iso(daysAgo(60)),
}
