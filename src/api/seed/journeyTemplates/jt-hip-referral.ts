import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Referral phase for hip osteoarthritis.
 * Assigning the journey sends both forms at once: the generic basic
 * information form (medications, living situation, allergies — analogous to
 * the anaesthesia health declaration) and the hip-specific OHS-short, so the
 * visit can focus on the core clinical question.
 */
export const jtHipReferral: JourneyTemplate = {
  id: 'jt-hip-referral',
  name: 'Höftartros — Remissfas',
  description:
    'Skickas när remissen registrerats. Basformulär (läkemedel, boende, allergier) och höftspecifikt formulär besvaras inför besök hos ortoped.',
  referenceDateLabel: 'Remissdatum',
  entries: [
    {
      id: 'jte-hip-ref-1',
      label: 'Basformulär inför besök',
      // Available from registration (day 0), to be answered by day 10
      offsetDays: 10,
      windowDays: 10,
      order: 1,
      templateId: 'qt-preop-intake',
      dashboardCategory: 'CONTROL',
      icon: 'Assignment',
      scoreAliases: { PNRS_1: 'PNRS_referral' },
      scoreAliasLabels: { PNRS_referral: 'Smärta vid remiss' },
    },
    {
      id: 'jte-hip-ref-2',
      label: 'Höftfunktion (OHS-kort)',
      // Available from registration (day 0), to be answered by day 10
      offsetDays: 10,
      windowDays: 10,
      order: 2,
      templateId: 'qt-function-ohs-short',
      dashboardCategory: 'CONTROL',
      icon: 'Assignment',
      scoreAliases: { 'OHS.total': 'OHS_referral' },
      scoreAliasLabels: { OHS_referral: 'OHS vid remiss' },
    },
  ],
  instructions: [
    {
      id: 'jti-hip-ref-1',
      journeyTemplateId: 'jt-hip-referral',
      instructionTemplateId: 'it-pre-visit',
      label: 'Förberedelse inför ortopedbesök',
      startDayOffset: 0,
      endDayOffset: 30,
      order: 1,
      tags: ['pre-visit', 'referral'],
      icon: 'MedicalServices',
    },
  ],
  createdAt: iso(daysAgo(60)),
}
