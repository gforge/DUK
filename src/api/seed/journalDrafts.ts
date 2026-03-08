import type { JournalDraft } from '../schemas'
import { daysAgo,iso } from './shared'

export const journalDrafts: JournalDraft[] = [
  {
    id: 'jd-1',
    caseId: 'case-1',
    templateId: 'jt-standard-sv',
    status: 'DRAFT',
    content:
      'Patient söker för smärta och svullnad i höger axel sedan 2 veckor. Anamnes och status tyder på rotatorkuffskada. Rekommenderar sjukgymnastik och återbesök.',
    createdByUserId: 'user-pal-1',
    createdAt: iso(daysAgo(1)),
    updatedAt: iso(daysAgo(1)),
  },
]
