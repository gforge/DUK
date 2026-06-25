import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Phase 2 of the hindfoot elective surgery pathway.
 * Active from when the patient is placed on the surgical waiting list until surgery.
 *
 * Timeline from queue placement (day 0):
 *   Day  60 — 2-month status check: has anything changed (new disease, medication)?
 *   Day  90 — 3-month interest check: does the patient still want surgery?
 *   Day 120 — Hälsodeklaration inför anestesi (slim pre-anaesthesia health declaration)
 *
 * The health declaration at day 120 uses qt-health-declaration, which shares
 * several field keys with qt-preop-intake (HEIGHT, WEIGHT, MEDICATIONS, ALLERGIES,
 * SMOKING) to enable future pre-population from the referral-phase response.
 */
export const jtHindfootWaitinglist: JourneyTemplate = {
  id: 'jt-hindfoot-waitinglist',
  name: 'Hindfoot — Väntelista operation',
  description:
    'Uppföljning under väntetid för hindfoot-kirurgi. Statuscheck vid 2 månader, intressekontroll vid 3 månader och hälsodeklaration inför anestesi vid 4 månader.',
  referenceDateLabel: 'Datum för köplats',
  entries: [
    {
      id: 'jte-hf-wl-1',
      label: '2 månader — statusuppdatering',
      offsetDays: 60,
      windowDays: 7,
      order: 1,
      templateId: 'qt-waitinglist-status',
      dashboardCategory: 'CONTROL',
      scoreAliases: { PNRS_1: 'PNRS_wl_2m' },
      scoreAliasLabels: { PNRS_wl_2m: 'Smärta vid 2-månaderskontroll' },
    },
    {
      id: 'jte-hf-wl-2',
      label: '3 månader — operationsintresse',
      offsetDays: 90,
      windowDays: 7,
      order: 2,
      templateId: 'qt-surgery-interest',
      dashboardCategory: 'CONTROL',
      scoreAliases: { PNRS_1: 'PNRS_wl_3m' },
      scoreAliasLabels: { PNRS_wl_3m: 'Smärta vid 3-månaderskontroll' },
    },
    {
      id: 'jte-hf-wl-3',
      label: '4 månader — hälsodeklaration inför anestesi',
      offsetDays: 120,
      windowDays: 14,
      order: 3,
      templateId: 'qt-health-declaration',
      dashboardCategory: 'CONTROL',
      scoreAliases: {},
      scoreAliasLabels: {},
      reviewTypes: ['LAB'],
    },
  ],
  instructions: [
    {
      id: 'jti-hf-wl-1',
      journeyTemplateId: 'jt-hindfoot-waitinglist',
      instructionTemplateId: 'it-waitinglist-info',
      label: 'Information och råd under väntetid',
      startDayOffset: 0,
      order: 1,
      tags: ['waiting-list', 'hindfoot'],
    },
  ],
  createdAt: iso(daysAgo(60)),
}
