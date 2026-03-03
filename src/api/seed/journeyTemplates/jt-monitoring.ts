import { iso, daysAgo } from '../shared'
import type { JourneyTemplate } from '../../schemas'

export const jtMonitoring: JourneyTemplate = {
  id: 'jt-monitoring',
  name: 'Uppföljningsschema (halvår)',
  description:
    'Löpande halvårsuppföljning utan koppling till operation. Varje tillfälle upprepas automatiskt 6 månader efter att patienten besvarar formuläret.',
  referenceDateLabel: 'Uppföljningsstart',
  entries: [
    {
      id: 'jte-mon-1',
      label: '3 månader – baseline',
      offsetDays: 90,
      windowDays: 14,
      order: 1,
      templateId: 'qt-eq5d-oss',
      dashboardCategory: 'CONTROL',
      scoreAliases: { 'OSS.total': 'OSS_3m', 'EQ5D.index': 'EQ5D_3m', EQ_VAS: 'EQ_VAS_3m' },
      scoreAliasLabels: {
        OSS_3m: 'OSS-poäng vid 3 månader',
        EQ5D_3m: 'EQ-5D index vid 3 månader',
        EQ_VAS_3m: 'EQ VAS vid 3 månader',
      },
      instructionText:
        'Baslinjemätning. Svara på frågorna om din smärta, rörlighet och livskvalitet. Dina svar hjälper teamet att följa din återhämtning.',
    },
    {
      id: 'jte-mon-2',
      label: 'Halvårsuppföljning (återkommande)',
      offsetDays: 182,
      windowDays: 21,
      order: 2,
      templateId: 'qt-eq5d-oss',
      dashboardCategory: 'CONTROL',
      /** Recurs every 6 months after the patient submits the form. */
      recurrenceIntervalDays: 182,
      scoreAliases: { 'OSS.total': 'OSS_6m', 'EQ5D.index': 'EQ5D_6m', EQ_VAS: 'EQ_VAS_6m' },
      scoreAliasLabels: {
        OSS_6m: 'OSS-poäng (halvår)',
        EQ5D_6m: 'EQ-5D index (halvår)',
        EQ_VAS_6m: 'EQ VAS (halvår)',
      },
      instructionText:
        'Halvårsuppföljning. Besvara frågorna om smärta, funktion och livskvalitet. Nästa uppföljning schemaläggs automatiskt 6 månader efter att du svarat.',
    },
  ],
  createdAt: iso(daysAgo(30)),
}
