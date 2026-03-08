import { useState } from 'react'

import type { Question,QuestionnaireTemplate } from '@/api/schemas'

import { initQuestions, initScoringRows, mkId, ScoringRowDraft } from './questionnaireUtils'

export function useQuestionnaireEditor(template?: QuestionnaireTemplate) {
  const [tab, setTab] = useState(0)
  const [name, setName] = useState(template?.name ?? '')
  const [questions, setQuestions] = useState<Question[]>(initQuestions(template))
  const [scoringRows, setScoringRows] = useState<ScoringRowDraft[]>(initScoringRows(template))

  const questionKeys = questions.map((q) => q.key)

  // question helpers
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: mkId(),
        key: '',
        type: 'SCALE',
        label: { sv: '' },
        required: true,
        min: 0,
        max: 10,
      },
    ])
  }

  const updateQuestion = <K extends keyof Question>(id: string, field: K, value: Question[K]) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  // scoring
  const addScoringRow = () => {
    setScoringRows((prev) => [
      ...prev,
      { _id: mkId(), outputKey: '', formula: 'SUM', inputKeys: '', scale: '' },
    ])
  }

  const updateScoringRow = <K extends keyof ScoringRowDraft>(
    id: string,
    field: K,
    value: ScoringRowDraft[K],
  ) => {
    setScoringRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)))
  }

  const deleteScoringRow = (id: string) => {
    setScoringRows((prev) => prev.filter((r) => r._id !== id))
  }

  const isValid = name.trim() !== ''

  const getSavePayload = () => {
    const scoringRules = scoringRows
      .filter((r) => r.outputKey.trim() && r.inputKeys.trim())
      .map((r) => ({
        outputKey: r.outputKey.trim(),
        formula: r.formula,
        inputKeys: r.inputKeys
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        scale: r.scale !== '' ? Number(r.scale) : undefined,
      }))

    const cleanedQuestions: Question[] = questions
      .filter((q) => q.key.trim() && Object.values(q.label).some((v) => v.trim()))
      .map((q) => ({
        ...q,
        key: q.key.trim(),
        label: Object.fromEntries(
          Object.entries(q.label)
            .map(([k, v]) => [k, v.trim()] as [string, string])
            .filter(([, v]) => v),
        ),
        options: q.type === 'SELECT' && q.options?.length ? q.options : undefined,
        min: q.type === 'SCALE' || q.type === 'NUMBER' ? q.min : undefined,
        max: q.type === 'SCALE' || q.type === 'NUMBER' ? q.max : undefined,
      }))

    return {
      name: name.trim(),
      questions: cleanedQuestions,
      scoringRules,
    }
  }

  return {
    tab,
    setTab,
    name,
    setName,
    questions,
    setQuestions,
    scoringRows,
    setScoringRows,
    questionKeys,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addScoringRow,
    updateScoringRow,
    deleteScoringRow,
    isValid,
    getSavePayload,
  }
}
