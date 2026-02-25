import { iso, daysAgo } from './shared'
import type { ResearchModule } from '../schemas'

export const researchModules: ResearchModule[] = [
  {
    id: 'rm-move-2026',
    name: 'MOVE-2026 Supplementary PROMs',
    studyName: 'MOVE-2026',
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
