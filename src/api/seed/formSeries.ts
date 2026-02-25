import { iso, daysAgo } from './shared'
import type { FormSeries } from '../schemas'

export const formSeries: FormSeries[] = [
  {
    id: 'fs-1',
    name: 'Acute follow-up series (0-2 weeks)',
    entries: [
      { templateId: 'qt-numbness-infection', offsetDays: 1, order: 1 },
      { templateId: 'qt-wound-pain', offsetDays: 10, order: 2 },
    ],
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'fs-2',
    name: 'Subacute follow-up series (3-8 weeks)',
    entries: [
      { templateId: 'qt-wound-pain', offsetDays: 10, order: 1 },
      { templateId: 'qt-function-oss', offsetDays: 28, order: 2 },
      { templateId: 'qt-function-oss', offsetDays: 49, order: 3 },
    ],
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'fs-3',
    name: 'Long-term PROMs series (6m / 1yr)',
    entries: [
      { templateId: 'qt-function-oss', offsetDays: 42, order: 1 },
      { templateId: 'qt-eq5d-oss', offsetDays: 180, order: 2 },
      { templateId: 'qt-eq5d-oss', offsetDays: 365, order: 3 },
    ],
    createdAt: iso(daysAgo(100)),
  },
]
