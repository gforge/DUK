import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

/**
 * Phase 1 of the hindfoot elective surgery pathway.
 * Triggered when a referral is received. The patient fills in a brief intake
 * questionnaire (social situation, medications, allergies, pain baseline)
 * before the first orthopaedic visit.
 */
export const jtHindfootReferral: JourneyTemplate = {
  id: 'jt-hindfoot-referral',
  name: 'Hindfoot — Remissfas',
  description:
    'Basal kartläggning vid inkommen remiss. Patienten besvarar en kortfattad hälso- och livssituationsenkät innan ortopedbesök bokas.',
  referenceDateLabel: 'Remissdatum',
  entries: [
    {
      id: 'jte-hf-ref-1',
      label: 'Remiss mottagen — patientenkät',
      offsetDays: 1,
      windowDays: 7,
      order: 1,
      templateId: 'qt-preop-intake',
      dashboardCategory: 'ACUTE',
      scoreAliases: { PNRS_1: 'PNRS_referral' },
      scoreAliasLabels: { PNRS_referral: 'Smärta vid remiss' },
    },
  ],
  instructions: [
    {
      id: 'jti-hf-ref-1',
      journeyTemplateId: 'jt-hindfoot-referral',
      instructionTemplateId: 'it-pre-visit',
      label: 'Förberedelse inför ortopedbesök',
      startDayOffset: 0,
      endDayOffset: 30,
      order: 1,
      tags: ['pre-visit', 'referral'],
    },
  ],
  createdAt: iso(daysAgo(60)),
}
