import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

export const jtKneeReferral: JourneyTemplate = {
  id: 'jt-knee-referral',
  name: 'Knäartros — Remissfas',
  description: 'Grundläggande kartläggning efter inkommen remiss, innan besök hos ortoped.',
  referenceDateLabel: 'Remissdatum',
  entries: [
    {
      id: 'jte-knee-ref-1',
      label: 'Remiss mottagen — basfrågor',
      offsetDays: 1,
      windowDays: 3,
      order: 1,
      templateId: 'qt-numbness-infection',
      dashboardCategory: 'ACUTE',
      icon: 'Assignment',
      scoreAliases: {},
      scoreAliasLabels: {},
    },
    {
      id: 'jte-knee-ref-2',
      label: 'Symtomkontroll inför besök',
      offsetDays: 7,
      windowDays: 3,
      order: 2,
      templateId: 'qt-wound-pain',
      dashboardCategory: 'SUBACUTE',
      icon: 'Assignment',
      scoreAliases: {},
      scoreAliasLabels: {},
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
