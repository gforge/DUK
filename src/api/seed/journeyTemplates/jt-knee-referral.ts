import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Referral phase for knee osteoarthritis. Same structure as the hip referral:
 * generic basic information form plus the knee-specific OKS-short.
 */
export const jtKneeReferral: JourneyTemplate = {
  id: 'jt-knee-referral',
  name: 'Knäartros — Remissfas',
  description:
    'Skickas när remissen registrerats. Basformulär (läkemedel, boende, allergier) och knäspecifikt formulär besvaras inför besök hos ortoped.',
  referenceDateLabel: 'Remissdatum',
  group: 'Knäartros',
  phaseOrder: 1,
  entries: [
    {
      id: 'jte-knee-ref-1',
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
      id: 'jte-knee-ref-2',
      label: 'Knäfunktion (OKS-kort)',
      // Available from registration (day 0), to be answered by day 10
      offsetDays: 10,
      windowDays: 10,
      order: 2,
      templateId: 'qt-function-oks-short',
      dashboardCategory: 'CONTROL',
      icon: 'Assignment',
      scoreAliases: { 'OKS.total': 'OKS_referral' },
      scoreAliasLabels: { OKS_referral: 'OKS vid remiss' },
    },
  ],
  instructions: [
    {
      id: 'jti-knee-ref-1',
      journeyTemplateId: 'jt-knee-referral',
      instructionTemplateId: 'it-knee-previsit',
      label: 'Förberedelse inför ortopedbesök',
      startDayOffset: 0,
      endDayOffset: 14,
      order: 1,
      tags: ['pre-visit'],
      icon: 'MedicalServices',
    },
  ],
  createdAt: iso(daysAgo(180)),
}
