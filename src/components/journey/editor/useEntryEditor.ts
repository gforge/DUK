import { useState } from 'react'

import type { JourneyTemplateEntry, QuestionnaireTemplate } from '@/api/schemas'
import type { AliasRow } from '@/components/journey/editor/entry-editor'
import { mkId } from '@/components/journey/editor/questionnaireUtils'
import { slugify, suggestWindowDays } from '@/utils'

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

export function useEntryEditor(
  entry: JourneyTemplateEntry | undefined,
  questionnaires: QuestionnaireTemplate[],
  _instructionTemplates: unknown[],
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
  const [recurringEnabled, setRecurringEnabled] = useState(
    entry?.recurrenceIntervalDays !== undefined,
  )
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number | ''>(
    entry?.recurrenceIntervalDays ?? '',
  )
  const [icon, setIcon] = useState<string | undefined>(entry?.icon)

  const selectedQT = questionnaires.find((q) => q.id === templateId) ?? null
  const qtOptions = questionnaires.map((q) => ({ id: q.id, name: q.name }))

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
      icon,
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
    recurringEnabled,
    setRecurringEnabled,
    recurrenceIntervalDays,
    setRecurrenceIntervalDays,
    icon,
    setIcon,
    selectedQT,
    qtOptions,
    isValid,
    handleSave,
    slugify,
    suggestWindowDays,
  }
}
