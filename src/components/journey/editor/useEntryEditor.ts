import { useState } from 'react'

import type {
  InstructionTemplate,
  JourneyTemplateEntry,
  QuestionnaireTemplate,
} from '@/api/schemas'
import type { AliasRow } from '@/components/journey/editor/entry-editor'
import { mkId } from '@/components/journey/editor/questionnaireUtils'
import { suggestWindowDays } from '@/utils/journeyUtils'
import { slugify } from '@/utils/slugify'

export type InstructionMode = 'NONE' | 'TEMPLATE' | 'FREETEXT'

function entryToAliasRows(entry?: JourneyTemplateEntry): AliasRow[] {
  if (!entry) return []
  return Object.entries(entry.scoreAliases ?? {}).map(([raw, alias]) => ({
    _id: mkId(),
    raw,
    alias,
    label: entry.scoreAliasLabels?.[alias] ?? '',
  }))
}

function deriveInstructionMode(entry?: JourneyTemplateEntry): InstructionMode {
  if (!entry) return 'NONE'
  if (entry.instructionTemplateId) return 'TEMPLATE'
  if (entry.instructionText) return 'FREETEXT'
  return 'NONE'
}

export function useEntryEditor(
  entry: JourneyTemplateEntry | undefined,
  questionnaires: QuestionnaireTemplate[],
  instructionTemplates: InstructionTemplate[],
) {
  const [label, setLabel] = useState(entry?.label ?? '')
  const [stepKey, setStepKey] = useState(entry?.stepKey ?? '')
  const [stepKeyLocked, setStepKeyLocked] = useState(!!entry?.stepKey)
  const [offsetDays, setOffsetDays] = useState<number | ''>(entry?.offsetDays ?? '')
  const [windowDays, setWindowDays] = useState<number | ''>(entry?.windowDays ?? 2)
  const [windowDaysManuallySet, setWindowDaysManuallySet] = useState(!!entry)
  const [dashboardCategory, setDashboardCategory] = useState<string>(
    entry?.dashboardCategory ?? 'CONTROL',
  )
  const [templateId, setTemplateId] = useState<string>(entry?.templateId ?? '')
  const [aliasRows, setAliasRows] = useState<AliasRow[]>(entryToAliasRows(entry))
  const [instructionMode, setInstructionMode] = useState<InstructionMode>(
    deriveInstructionMode(entry),
  )
  const [instructionTemplateId, setInstructionTemplateId] = useState<string>(
    entry?.instructionTemplateId ?? '',
  )
  const [instructionText, setInstructionText] = useState<string>(entry?.instructionText ?? '')
  const [recurringEnabled, setRecurringEnabled] = useState(
    entry?.recurrenceIntervalDays !== undefined,
  )
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number | ''>(
    entry?.recurrenceIntervalDays ?? '',
  )

  const selectedQT = questionnaires.find((q) => q.id === templateId) ?? null
  const qtOptions = questionnaires.map((q) => ({ id: q.id, name: q.name }))
  const itOptions = instructionTemplates.map((it) => ({ id: it.id, name: it.name }))
  const selectedIT = instructionTemplates.find((it) => it.id === instructionTemplateId) ?? null

  const isValid = label.trim() !== '' && offsetDays !== ''

  const handleAddAlias = (suggestedRaw?: string) => {
    const raw =
      suggestedRaw ||
      selectedQT?.scoringRules
        .map((r) => r.outputKey)
        .find((k) => !aliasRows.some((row) => row.raw === k)) ||
      ''
    setAliasRows((prev) => [...prev, { _id: mkId(), raw, alias: '', label: '' }])
  }

  const handleUpdateAlias = (id: string, field: 'raw' | 'alias' | 'label', value: string) => {
    setAliasRows((prev) => prev.map((row) => (row._id === id ? { ...row, [field]: value } : row)))
  }

  const handleDeleteAlias = (id: string) => {
    setAliasRows((prev) => prev.filter((row) => row._id !== id))
  }

  const handleSave = (): JourneyTemplateEntry | null => {
    if (!isValid) return null
    const scoreAliases: Record<string, string> = {}
    const scoreAliasLabels: Record<string, string> = {}
    for (const row of aliasRows) {
      if (row.raw.trim() && row.alias.trim()) {
        scoreAliases[row.raw.trim()] = row.alias.trim()
        if (row.label.trim()) scoreAliasLabels[row.alias.trim()] = row.label.trim()
      }
    }

    return {
      id: entry?.id ?? mkId(),
      label: label.trim(),
      stepKey: stepKey.trim() || undefined,
      offsetDays: Number(offsetDays),
      windowDays: windowDays !== '' ? Number(windowDays) : 2,
      order: entry?.order ?? 0,
      dashboardCategory: dashboardCategory as JourneyTemplateEntry['dashboardCategory'],
      templateId: templateId || undefined,
      scoreAliases,
      scoreAliasLabels,
      instructionTemplateId:
        instructionMode === 'TEMPLATE' && instructionTemplateId ? instructionTemplateId : undefined,
      instructionText:
        instructionMode === 'FREETEXT' && instructionText.trim()
          ? instructionText.trim()
          : undefined,
      recurrenceIntervalDays:
        recurringEnabled && recurrenceIntervalDays !== ''
          ? Number(recurrenceIntervalDays)
          : undefined,
    }
  }

  return {
    label,
    setLabel,
    stepKey,
    setStepKey,
    stepKeyLocked,
    setStepKeyLocked,
    offsetDays,
    setOffsetDays,
    windowDays,
    setWindowDays,
    windowDaysManuallySet,
    setWindowDaysManuallySet,
    dashboardCategory,
    setDashboardCategory,
    templateId,
    setTemplateId,
    aliasRows,
    handleAddAlias,
    handleUpdateAlias,
    handleDeleteAlias,
    instructionMode,
    setInstructionMode,
    instructionTemplateId,
    setInstructionTemplateId,
    instructionText,
    setInstructionText,
    recurringEnabled,
    setRecurringEnabled,
    recurrenceIntervalDays,
    setRecurrenceIntervalDays,
    selectedQT,
    qtOptions,
    itOptions,
    selectedIT,
    isValid,
    handleSave,
    slugify,
    suggestWindowDays,
  }
}
