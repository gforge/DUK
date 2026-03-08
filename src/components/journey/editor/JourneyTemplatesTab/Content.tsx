import AddIcon from '@mui/icons-material/Add'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyTemplate, JourneyTemplateEntry } from '@/api/schemas'
import { EntryEditorDialog } from '@/components/journey/editor'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'

import { JourneyTemplatesTabDialogs } from './JourneyTemplatesTabDialogs'
import { JourneyTemplatesTabList } from './JourneyTemplatesTabList'
import { TemplateInstructionsDialog } from './TemplateInstructionsDialog'

interface Props {
  journeyTemplates: JourneyTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onRefresh?: () => void
}

export function JourneyTemplatesTab({ journeyTemplates, loading, onDelete, onRefresh }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [deriveTarget, setDeriveTarget] = useState<JourneyTemplate | null>(null)
  const [syncTarget, setSyncTarget] = useState<JourneyTemplate | null>(null)
  const [templateInstructionsTarget, setTemplateInstructionsTarget] =
    useState<JourneyTemplate | null>(null)
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

  const handleDeleteInstruction = async (template: JourneyTemplate, instrId: string) => {
    const instructions = template.instructions.filter((i) => i.id !== instrId)
    try {
      await client.saveJourneyTemplate({ ...template, instructions })
      showSnack(t('journey.editor.entryDeleted'), 'success')
      onRefresh?.()
    } catch {
      showSnack(t('common.error'), 'error')
    }
  }

  // Close entry editor and optionally focus
  const handleCloseEntryEditor = () => setEntryEditState(null)

  if (loading && !journeyTemplates)
    return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />

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
          instructionTemplates={instructionTemplates ?? []}
          parentName={parentName}
          onDelete={onDelete}
          setSyncTarget={setSyncTarget}
          setEditTarget={setEditTarget}
          setDeriveTarget={setDeriveTarget}
          setTemplateInstructionsTarget={setTemplateInstructionsTarget}
          setEntryEditState={setEntryEditState}
          handleSaveEntry={handleSaveEntry}
          handleDeleteEntry={handleDeleteEntry}
          handleDeleteInstruction={handleDeleteInstruction}
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

      {entryEditState && (
        <EntryEditorDialog
          entry={entryEditState.entry}
          questionnaires={questionnaires ?? []}
          instructionTemplates={instructionTemplates ?? []}
          onSave={(saved) => handleSaveEntry(entryEditState.template, saved)}
          onClose={handleCloseEntryEditor}
        />
      )}

      {templateInstructionsTarget && instructionTemplates && (
        <TemplateInstructionsDialog
          template={templateInstructionsTarget}
          instructionTemplates={instructionTemplates}
          onClose={() => setTemplateInstructionsTarget(null)}
          onSaved={() => {
            setTemplateInstructionsTarget(null)
            onRefresh?.()
          }}
        />
      )}

      <Dialog open={!!entryDeleteConfirm} onClose={() => setEntryDeleteConfirm(null)}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('journey.editor.confirmDeleteTemplate', {
              name: entryDeleteConfirm?.template.name ?? '',
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryDeleteConfirm(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => executeDeleteEntry()}
            disableElevation
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
