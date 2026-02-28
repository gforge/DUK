import { iso, daysAgo } from './shared'
import type { ResearchModule } from '../schemas'

export const researchModules: ResearchModule[] = [
  {
    id: 'rm-move-2026',
    name: 'MOVE-2026 Supplementary PROMs',
    studyName: 'MOVE-2026',
    studyInfoMarkdown:
      '## MOVE-2026\n\nDenna studie utvärderar utsäkten efter höftledsoperation under 24 månader.\n\nDeltagande är frivilligt och kan avbräkts när som helst utan att det påverkar din vård.',
    entries: [
      {
        id: 'rme-move-1',
        label: 'Week 4 (MOVE-2026 form)',
        replaceStepId: 'jte-std-3',
        templateId: 'qt-eq5d-oss',
      },
      { id: 'rme-move-2', label: '3 months (research)', offsetDays: 90, templateId: 'qt-eq5d-oss' },
    ],
    createdAt: iso(daysAgo(100)),
  },
]
