import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Phase 3 of the hindfoot elective surgery pathway.
 * Post-operative follow-up after hindfoot surgery (fusion, osteotomy, etc.).
 *
 * Timeline from surgery (day 0):
 *   Day   7 — Wound control (digital)
 *   Day  14 — X-ray control + suture removal (digital + XRAY review)
 *   Day  42 — Cast removal + functional assessment (week 6)
 *   Day 180 — 6-month digital PROMs (EQ-5D + OSS)
 *   Day 365 — 1-year follow-up
 *   Day 730 — 2-year final follow-up
 */
export const jtHindfootPostop: JourneyTemplate = {
  id: 'jt-hindfoot-postop',
  name: 'Hindfoot — Postoperativ uppföljning',
  description:
    'Strukturerad rehabilitering och uppföljning efter hindfoot-kirurgi. Täcker sårkontroll, röntgen, gipsborttagning och långtidsuppföljning till 2 år.',
  referenceDateLabel: 'Operationsdatum',
  entries: [
    {
      id: 'jte-hf-po-1',
      label: 'Vecka 1 — sårkontroll',
      offsetDays: 7,
      windowDays: 2,
      order: 1,
      templateId: 'qt-wound-pain',
      dashboardCategory: 'ACUTE',
      scoreAliases: { PNRS_2: 'PNRS_week1' },
      scoreAliasLabels: { PNRS_week1: 'Smärta vid vecka 1' },
    },
    {
      id: 'jte-hf-po-2',
      label: 'Vecka 2 — röntgenkontroll och stygntagning',
      offsetDays: 14,
      windowDays: 3,
      order: 2,
      templateId: 'qt-wound-pain',
      dashboardCategory: 'ACUTE',
      scoreAliases: { PNRS_2: 'PNRS_week2' },
      scoreAliasLabels: { PNRS_week2: 'Smärta vid vecka 2' },
      reviewTypes: ['XRAY'],
    },
    {
      id: 'jte-hf-po-3',
      label: 'Vecka 6 — gipsborttagning och funktionskontroll',
      offsetDays: 42,
      windowDays: 5,
      order: 3,
      templateId: 'qt-function-oss',
      dashboardCategory: 'SUBACUTE',
      scoreAliases: { PNRS_2: 'PNRS_week6', 'OSS.total': 'OSS_week6' },
      scoreAliasLabels: {
        PNRS_week6: 'Smärta vid gipsborttagning',
        OSS_week6: 'OSS-poäng vid gipsborttagning',
      },
    },
    {
      id: 'jte-hf-po-4',
      label: '6 månader — digital uppföljning',
      offsetDays: 180,
      windowDays: 14,
      order: 4,
      templateId: 'qt-eq5d-oss',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'OSS.total': 'OSS_6m', 'EQ5D.index': 'EQ5D_6m', EQ_VAS: 'EQ_VAS_6m' },
      scoreAliasLabels: {
        OSS_6m: 'OSS-poäng vid 6 månader',
        EQ5D_6m: 'EQ-5D index vid 6 månader',
        EQ_VAS_6m: 'EQ VAS vid 6 månader',
      },
    },
    {
      id: 'jte-hf-po-5',
      label: '1 år — uppföljning',
      offsetDays: 365,
      windowDays: 14,
      order: 5,
      templateId: 'qt-eq5d-oss',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'OSS.total': 'OSS_1yr', 'EQ5D.index': 'EQ5D_1yr', EQ_VAS: 'EQ_VAS_1yr' },
      scoreAliasLabels: {
        OSS_1yr: 'OSS-poäng vid 1 år',
        EQ5D_1yr: 'EQ-5D index vid 1 år',
        EQ_VAS_1yr: 'EQ VAS vid 1 år',
      },
    },
    {
      id: 'jte-hf-po-6',
      label: '2 år — slutuppföljning',
      offsetDays: 730,
      windowDays: 14,
      order: 6,
      templateId: 'qt-eq5d-oss',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'OSS.total': 'OSS_2yr', 'EQ5D.index': 'EQ5D_2yr', EQ_VAS: 'EQ_VAS_2yr' },
      scoreAliasLabels: {
        OSS_2yr: 'OSS-poäng vid 2 år',
        EQ5D_2yr: 'EQ-5D index vid 2 år',
        EQ_VAS_2yr: 'EQ VAS vid 2 år',
      },
    },
  ],
  instructions: [
    {
      id: 'jti-hf-po-1',
      journeyTemplateId: 'jt-hindfoot-postop',
      instructionTemplateId: 'it-wound-care',
      label: 'Vecka 1–2: Sårvård och avlastning',
      startDayOffset: 0,
      endDayOffset: 14,
      order: 1,
      tags: ['wound', 'acute', 'hindfoot'],
    },
    {
      id: 'jti-hf-po-2',
      journeyTemplateId: 'jt-hindfoot-postop',
      instructionTemplateId: 'it-post-op-general',
      label: 'Vecka 2–6: Gipsperiod och avlastning',
      startDayOffset: 14,
      endDayOffset: 42,
      order: 2,
      tags: ['cast', 'hindfoot'],
    },
    {
      id: 'jti-hf-po-3',
      journeyTemplateId: 'jt-hindfoot-postop',
      instructionTemplateId: 'it-physio-week4-general',
      label: 'Vecka 6+: Mobilisering och träning',
      startDayOffset: 42,
      endDayOffset: 180,
      order: 3,
      tags: ['physio', 'subacute', 'hindfoot'],
    },
  ],
  createdAt: iso(daysAgo(60)),
}
