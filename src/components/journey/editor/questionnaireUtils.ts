import type { QuestionnaireTemplate, Question } from '@/api/schemas'

export const mkId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)

export function initQuestions(template?: QuestionnaireTemplate): Question[] {
  return template?.questions ?? []
}

export interface ScoringRowDraft {
  _id: string
  outputKey: string
  formula: 'SUM' | 'AVERAGE' | 'MAX' | 'DIRECT'
  inputKeys: string
  scale: number | ''
}

export function initScoringRows(template?: QuestionnaireTemplate): ScoringRowDraft[] {
  return (
    template?.scoringRules.map((r) => ({
      _id: mkId(),
      outputKey: r.outputKey,
      formula: r.formula,
      inputKeys: r.inputKeys.join(', '),
      scale: r.scale ?? '',
    })) ?? []
  )
}
