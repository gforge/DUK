import { Box, Skeleton, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateEntry,
  PatientJourney,
  QuestionnaireTemplate,
} from '@/api/schemas'
import { ConfirmDialog } from '@/components/common'
import { EntryEditorDrawer } from '@/components/journey/editor/EntryEditorDrawer'
import { useSnack } from '@/store/snackContext'
import { tokens } from '@/theme'

import { JourneyTemplatesTabDialogs } from './JourneyTemplatesTabDialogs'
import type { SearchHit } from './templateBrowser'
import { countActivePatients, findSearchHit, groupTemplates } from './templateBrowser'
import { TemplateDetail } from './TemplateDetail'
import { TemplateInstructionsDialog } from './TemplateInstructionsDialog'
import { TemplateListAside } from './TemplateListAside'

interface Props {
  journeyTemplates: JourneyTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onRefresh?: () => void
  patientJourneys: PatientJourney[] | null
  questionnaires: QuestionnaireTemplate[] | null
  instructionTemplates: InstructionTemplate[] | null
}

/**
 * "Resmallar" tab: grouped, searchable template list on the left and the
 * selected template (timeline + steps) on the right.
 */
export function JourneyTemplatesTab({
  journeyTemplates,
  loading,
  onDelete,
  onRefresh,
  patientJourneys,
  questionnaires,
  instructionTemplates,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set())
  const [deriveTarget, setDeriveTarget] = useState<JourneyTemplate | null>(null)
  const [syncTarget, setSyncTarget] = useState<JourneyTemplate | null>(null)
  const [templateInstructionsTarget, setTemplateInstructionsTarget] =
    useState<JourneyTemplate | null>(null)
  // null = closed, undefined = create new, JourneyTemplate = edit existing
  const [editTarget, setEditTarget] = useState<JourneyTemplate | null | undefined>(null)
  // Step editing: entry=undefined means create new
  const [entryEditState, setEntryEditState] = useState<{
    template: JourneyTemplate
    entry?: JourneyTemplateEntry
  } | null>(null)
  const [entryDeleteConfirm, setEntryDeleteConfirm] = useState<{
    template: JourneyTemplate
    entry: JourneyTemplateEntry
  } | null>(null)

  const templates = useMemo(() => journeyTemplates ?? [], [journeyTemplates])
  const groups = useMemo(() => groupTemplates(templates), [templates])
  const qtMap = useMemo(
    () => new Map((questionnaires ?? []).map((q) => [q.id, q])),
    [questionnaires],
  )
  const itMap = useMemo(
    () => new Map((instructionTemplates ?? []).map((i) => [i.id, i])),
    [instructionTemplates],
  )
  const patientCounts = useMemo(() => countActivePatients(patientJourneys), [patientJourneys])
  const hits = useMemo(() => {
    const map = new Map<string, SearchHit>()
    if (!query.trim()) return map
    for (const tpl of templates) {
      const hit = findSearchHit(tpl, query, { questionnaires: qtMap, instructionTemplates: itMap })
      if (hit) map.set(tpl.id, hit)
    }
    return map
  }, [templates, query, qtMap, itMap])

  const selected = templates.find((tpl) => tpl.id === selectedId) ?? groups[0]?.templates[0] ?? null

  const saveTemplate = async (
    template: JourneyTemplate,
    patch: Partial<JourneyTemplate>,
    successKey: 'journey.editor.entrySaved' | 'journey.editor.entryDeleted',
  ) => {
    try {
      await client.saveJourneyTemplate({ ...template, ...patch })
      showSnack(t(successKey), 'success')
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
    await saveTemplate(template, { entries }, 'journey.editor.entrySaved')
    setEntryEditState(null)
  }

  const executeDeleteEntry = async () => {
    if (!entryDeleteConfirm) return
    const { template, entry } = entryDeleteConfirm
    setEntryDeleteConfirm(null)
    const entries = template.entries.filter((e) => e.id !== entry.id)
    await saveTemplate(template, { entries }, 'journey.editor.entryDeleted')
  }

  const handleRemoveInstruction = async (template: JourneyTemplate, instrId: string) => {
    const instructions = template.instructions.filter((i) => i.id !== instrId)
    await saveTemplate(template, { instructions }, 'journey.editor.entryDeleted')
  }

  const toggleGroup = (key: string) =>
    setClosedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  if (loading && !journeyTemplates)
    return <Skeleton variant="rectangular" sx={{ borderRadius: 3, height: 320 }} />

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(240px,300px) minmax(0,1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <TemplateListAside
          groups={groups}
          selectedId={selected?.id ?? null}
          query={query}
          onQueryChange={setQuery}
          closedGroups={closedGroups}
          onToggleGroup={toggleGroup}
          onSelect={(tpl) => setSelectedId(tpl.id)}
          onCreate={() => setEditTarget(undefined)}
          hits={hits}
          patientCounts={patientCounts}
        />
        {selected ? (
          <TemplateDetail
            template={selected}
            templates={templates}
            groups={groups}
            patientCount={patientCounts.get(selected.id) ?? 0}
            questionnaires={qtMap}
            instructionTemplates={itMap}
            onSelect={(tpl) => setSelectedId(tpl.id)}
            onEdit={() => setEditTarget(selected)}
            onDelete={() => onDelete(selected.id, selected.name)}
            onDerive={() => setDeriveTarget(selected)}
            onSync={() => setSyncTarget(selected)}
            onEditInstructions={() => setTemplateInstructionsTarget(selected)}
            onRemoveInstruction={(id) => handleRemoveInstruction(selected, id)}
            onAddEntry={() => setEntryEditState({ template: selected })}
            onEditEntry={(entry) => setEntryEditState({ template: selected, entry })}
          />
        ) : (
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: `1px solid ${tokens.border}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography color="text.secondary">{t('journey.editor.noTemplates')}</Typography>
          </Box>
        )}
      </Box>

      <JourneyTemplatesTabDialogs
        deriveTarget={deriveTarget}
        syncTarget={syncTarget}
        editTarget={editTarget}
        setDeriveTarget={setDeriveTarget}
        setSyncTarget={setSyncTarget}
        setEditTarget={setEditTarget}
        onRefresh={onRefresh}
        onCreated={(tpl) => {
          setSelectedId(tpl.id)
          setQuery('')
        }}
      />

      {entryEditState && (
        <EntryEditorDrawer
          key={entryEditState.entry?.id ?? 'new'}
          entry={entryEditState.entry}
          templateName={entryEditState.template.name}
          questionnaires={questionnaires ?? []}
          instructionTemplates={instructionTemplates ?? []}
          onSave={(saved) => handleSaveEntry(entryEditState.template, saved)}
          onClose={() => setEntryEditState(null)}
          onDelete={(entry) => {
            setEntryEditState(null)
            setEntryDeleteConfirm({ template: entryEditState.template, entry })
          }}
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

      <ConfirmDialog
        open={!!entryDeleteConfirm}
        title={t('journey.editor.stepDrawer.deleteStep')}
        message={t('journey.editor.stepDrawer.confirmDelete', {
          name: entryDeleteConfirm?.entry.label ?? '',
        })}
        onConfirm={() => executeDeleteEntry()}
        onCancel={() => setEntryDeleteConfirm(null)}
      />
    </>
  )
}
