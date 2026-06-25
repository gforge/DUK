import type { JourneyTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

export const jtKneeSurgeryQueue: JourneyTemplate = {
  id: 'jt-knee-surgery-queue',
  name: 'Knäartros — Väntelista operation',
  description:
    'Uppföljning under väntetid på knäoperation: hälsodeklaration vid start, kvartalsvisa kontroller.',
  referenceDateLabel: 'Datum för köplats',
  entries: [
    {
      id: 'jte-knee-sq-1',
      label: 'Hälsodeklaration',
      offsetDays: 0,
      windowDays: 5,
      order: 1,
      templateId: 'qt-numbness-infection',
      dashboardCategory: 'ACUTE',
      icon: 'MonitorHeart',
      scoreAliases: {},
      scoreAliasLabels: {},
      reviewTypes: ['LAB'],
    },
    {
      id: 'jte-knee-sq-2',
      label: 'Kvartalskontroll',
      offsetDays: 90,
      windowDays: 7,
      order: 2,
      templateId: 'qt-function-oss',
      dashboardCategory: 'CONTROL',
      icon: 'MonitorHeart',
      recurrenceIntervalDays: 90,
      scoreAliases: {},
      scoreAliasLabels: {},
    },
  ],
  instructions: [
    {
      id: 'jti-knee-sq-1',
      journeyTemplateId: 'jt-knee-surgery-queue',
      instructionTemplateId: 'it-knee-waitinglist',
      label: 'Information under väntetid',
      startDayOffset: 0,
      order: 1,
      tags: ['waiting-list'],
      icon: 'HourglassEmpty',
    },
  ],
  createdAt: iso(daysAgo(180)),
}
