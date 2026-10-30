import type { ResearchModule } from '../schemas'
import { daysAgo, iso } from './shared'

export const researchModules: ResearchModule[] = [
  {
    id: 'rm-move-2026',
    name: 'MOVE-2026 kompletterande PROM',
    studyName: 'MOVE-2026',
    studyInfoMarkdown:
      '## MOVE-2026\n\nDenna studie utvärderar utfallet efter höftledsoperation under 24 månader.\n\nDeltagande är frivilligt och kan avbrytas när som helst utan att det påverkar din vård.',
    entries: [
      {
        id: 'rme-move-1',
        label: 'Vecka 4 (MOVE-2026-formulär)',
        replaceStepId: 'jte-std-3',
        templateId: 'qt-eq5d-oss',
      },
      { id: 'rme-move-2', label: '3 månader (forskning)', offsetDays: 90, templateId: 'qt-eq5d-oss' },
    ],
    createdAt: iso(daysAgo(100)),
  },
]
