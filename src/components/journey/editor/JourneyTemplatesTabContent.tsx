import React, { useState } from 'react'
import { Button, Skeleton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import * as client from '@/api/client'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'
import type { JourneyTemplate, JourneyTemplateEntry } from '@/api/schemas'
import JourneyTemplatesTabList from './JourneyTemplatesTabList'
import JourneyTemplatesTabDialogs from './JourneyTemplatesTabDialogs'

// helper moved from original file
function formatOffsetDays(
  days: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): {
  label: string
  tooltip: string
} {
  const tooltip = t('journey.offsetFormat.exactDays', { count: days })
  if (days >= 365)
    return { label: t('journey.offsetFormat.years', { count: Math.round(days / 365) }), tooltip }
  if (days >= 60)
    return { label: t('journey.offsetFormat.months', { count: Math.round(days / 30) }), tooltip }
  if (days >= 14)
    return { label: t('journey.offsetFormat.weeks', { count: Math.round(days / 7) }), tooltip }
  return { label: t('journey.offsetFormat.days', { count: days }), tooltip: '' }
}

interface Props {
  journeyTemplates: JourneyTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onRefresh?: () => void
}

export default function JourneyTemplatesTabContent({
  journeyTemplates,
  loading,
  onDelete,
  onRefresh,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [deriveTarget, setDeriveTarget] = useState<JourneyTemplate | null>(null)
  const [syncTarget, setSyncTarget] = useState<JourneyTemplate | null>(null)
  // null = closed, undefined = create new, JourneyTemplate = edit existing
  const [editTarget, setEditTarget] = useState<JourneyTemplate | null | undefined>(null)

  // Entry editing state: { templateId, entry? } — entry=undefined means create new
  const [entryEditState, setEntryEditState] = useState<{
    template: JourneyTemplate
    entry?: JourneyTemplateEntry
  } | null>(null)

  const [entryDeleteConfirm, setEntryDeleteConfirm] = useState<{
    template: JourneyTemplate
    entryId: string
  } | null>(null)

  const { data: questionnaires } = useApi(() => client.getQuestionnaireTemplates(), [])
  const { data: instructionTemplates } = useApi(() => client.getInstructionTemplates(), [])

  const handleSaveEntry = async (template: JourneyTemplate, saved: JourneyTemplateEntry) => {
    const existing = template.entries.find((e) => e.id === saved.id)
    const entries = existing
      ? template.entries.map((e) => (e.id === saved.id ? saved : e))
      : [...template.entries, { ...saved, order: template.entries.length }]
    try {
      await client.saveJourneyTemplate({ ...template, entries })
      showSnack(t('journey.editor.entrySaved'), 'success')
      onRefresh?.()
    } catch {
      showSnack(t('common.error'), 'error')
    }
    setEntryEditState(null)
  }

  const handleDeleteEntry = async (template: JourneyTemplate, entryId: string) => {
    setEntryDeleteConfirm({ template, entryId })
  }

  const executeDeleteEntry = async () => {
    if (!entryDeleteConfirm) return
    const { template, entryId } = entryDeleteConfirm
    setEntryDeleteConfirm(null)
    const entries = template.entries.filter((e) => e.id !== entryId)
    try {
      await client.saveJourneyTemplate({ ...template, entries })
      showSnack(t('journey.editor.entryDeleted'), 'success')
      onRefresh?.()
    } catch {
      showSnack(t('common.error'), 'error')
    }
  }

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />

  const parentName = (id: string | undefined) =>
    id ? journeyTemplates?.find((jt) => jt.id === id)?.name : undefined

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setEditTarget(undefined)}
        >
          {t('journey.editor.newTemplate')}
        </Button>
      </Stack>

      {journeyTemplates && journeyTemplates.length > 0 ? (
        <JourneyTemplatesTabList
          journeyTemplates={journeyTemplates}
          parentName={parentName}
          onDelete={onDelete}
          setSyncTarget={setSyncTarget}
          setEditTarget={setEditTarget}
          setDeriveTarget={setDeriveTarget}
          setEntryEditState={setEntryEditState}
          handleSaveEntry={handleSaveEntry}
          handleDeleteEntry={handleDeleteEntry}
        />
      ) : (
        <Typography color="text.secondary">{t('journey.editor.noTemplates')}</Typography>
      )}

      <JourneyTemplatesTabDialogs
        deriveTarget={deriveTarget}
        syncTarget={syncTarget}
        editTarget={editTarget}
        setDeriveTarget={setDeriveTarget}
        setSyncTarget={setSyncTarget}
        setEditTarget={setEditTarget}
        onRefresh={onRefresh}
      />
    </>
  )
}
