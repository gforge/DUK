import type { JournalDraft, JournalTemplate, Role } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getJournalDrafts = (caseId: string): Promise<JournalDraft[]> =>
  withDelay(() => service.getJournalDrafts(caseId))

export const getJournalTemplates = (): Promise<JournalTemplate[]> =>
  withDelay(() => service.getJournalTemplates())

export const getJournalTemplatesByLanguage = (language: string): Promise<JournalTemplate[]> =>
  withDelay(() => service.getJournalTemplatesByLanguage(language))

export const generateJournalDraft = (
  caseId: string,
  templateId: string,
  userId: string,
  userRole: Role,
  language?: string,
): Promise<JournalDraft> =>
  withDelay(() => service.generateJournalDraft(caseId, templateId, userId, userRole, language))

export const approveJournalDraft = (
  draftId: string,
  userId: string,
  userRole: Role,
): Promise<JournalDraft> => withDelay(() => service.approveJournalDraft(draftId, userId, userRole))
