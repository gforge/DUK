import type { FormSeries } from '../schemas'
import { daysAgo, iso } from './shared'

export const formSeries: FormSeries[] = [
  {
    id: 'fs-1',
    name: 'Akut uppföljningsserie (0–2 veckor)',
    entries: [
      { templateId: 'qt-numbness-infection', offsetDays: 1, order: 1 },
      { templateId: 'qt-wound-pain', offsetDays: 10, order: 2 },
    ],
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'fs-2',
    name: 'Subakut uppföljningsserie (3–8 veckor)',
    entries: [
      { templateId: 'qt-wound-pain', offsetDays: 10, order: 1 },
      { templateId: 'qt-function-oss', offsetDays: 28, order: 2 },
      { templateId: 'qt-function-oss', offsetDays: 49, order: 3 },
    ],
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'fs-3',
    name: 'Långtids-PROM-serie (6 mån / 1 år)',
    entries: [
      { templateId: 'qt-function-oss', offsetDays: 42, order: 1 },
      { templateId: 'qt-eq5d-oss', offsetDays: 180, order: 2 },
      { templateId: 'qt-eq5d-oss', offsetDays: 365, order: 3 },
    ],
    createdAt: iso(daysAgo(100)),
  },
]
