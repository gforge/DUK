import ArticleIcon from '@mui/icons-material/Article'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PeopleIcon from '@mui/icons-material/People'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import UndoIcon from '@mui/icons-material/Undo'
import { Box, Button, Stack, Tab, Tabs, Tooltip } from '@mui/material'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import { ConfirmDialog, PageHeader } from '@/components/common'
import {
  InstructionTemplatesTab,
  JourneyTemplatesTab,
  PatientJourneysTable,
  QuestionnaireTemplatesTab,
  ResearchModulesTab,
} from '@/components/journey/editor'
import { useApi } from '@/hooks/useApi'
import { useEditorUndo } from '@/hooks/useEditorUndo'
import { useSnack } from '@/store/snackContext'
import { tokens } from '@/theme'

export default function JourneyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [tab, setTab] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const {
    data: journeyTemplates,
    loading: jLoading,
    refetch: refetchJT,
  } = useApi(() => client.getJourneyTemplates(), [])
  const {
    data: researchModules,
    loading: rmLoading,
    refetch: refetchRM,
  } = useApi(() => client.getResearchModules(), [])
  const { data: patientJourneys, loading: pjLoading } = useApi(
    () => client.getPatientJourneys(),
    [],
  )
  const { data: patients } = useApi(() => client.getPatients(), [])
  const {
    data: instructionTemplates,
    loading: itLoading,
    refetch: refetchIT,
  } = useApi(() => client.getInstructionTemplates(), [])
  const {
    data: questionnaires,
    loading: qtLoading,
    refetch: refetchQT,
  } = useApi(() => client.getQuestionnaireTemplates(), [])
  const refetchAll = useCallback(() => {
    refetchJT()
    refetchRM()
    refetchIT()
    refetchQT()
  }, [refetchJT, refetchRM, refetchIT, refetchQT])
  const {
    canUndo,
    undoDescription,
    undoTimestamp,
    push: pushUndo,
    undo,
  } = useEditorUndo({
    onAfterUndo: refetchAll,
  })
  // ── Journey template handlers ──────────────────────────────────────────────
  const handleDeleteTemplate = async (templateId: string, name: string) => {
    setConfirmAction({
      title: t('common.delete'),
      message: t('journey.editor.confirmDeleteTemplate', { name }),
      onConfirm: async () => {
        setConfirmAction(null)
        pushUndo(t('journey.editor.undoDelete', { name }))
        await client.deleteJourneyTemplate(templateId)
        showSnack(t('journey.editor.templateDeleted'), 'success')
        refetchJT()
      },
    })
  }
  // ── Research module handlers ───────────────────────────────────────────────
  const handleDeleteModule = async (moduleId: string, name: string) => {
    setConfirmAction({
      title: t('common.delete'),
      message: t('journey.editor.confirmDeleteModule', { name }),
      onConfirm: async () => {
        setConfirmAction(null)
        pushUndo(t('journey.editor.undoDelete', { name }))
        await client.deleteResearchModule(moduleId)
        showSnack(t('journey.editor.moduleDeleted'), 'success')
        refetchRM()
      },
    })
  }
  const handleSaveModule = async (module: Parameters<typeof client.saveResearchModule>[0]) => {
    pushUndo(t('journey.editor.undoSave', { name: module.name }))
    await client.saveResearchModule(module)
    showSnack(t('journey.research.moduleSaved'), 'success')
    refetchRM()
  }
  // ── Instruction template handlers ─────────────────────────────────────────
  const handleDeleteInstruction = async (id: string, name: string) => {
    setConfirmAction({
      title: t('common.delete'),
      message: t('journey.editor.confirmDeleteInstruction', { name }),
      onConfirm: async () => {
        setConfirmAction(null)
        pushUndo(t('journey.editor.undoDelete', { name }))
        await client.deleteInstructionTemplate(id)
        showSnack(t('journey.editor.instructionDeleted'), 'success')
        refetchIT()
      },
    })
  }
  const handleSaveInstruction = async (data: {
    id?: string
    name: string
    content: string
    tags: string[]
  }) => {
    pushUndo(t('journey.editor.undoSave', { name: data.name }))
    await client.saveInstructionTemplate(data)
    showSnack(t('journey.editor.instructionSaved'), 'success')
    refetchIT()
  }
  // ── Questionnaire template handlers ──────────────────────────────────────
  const handleDeleteQuestionnaire = async (id: string, name: string) => {
    setConfirmAction({
      title: t('common.delete'),
      message: t('journey.editor.confirmDeleteInstruction', { name }),
      onConfirm: async () => {
        setConfirmAction(null)
        pushUndo(t('journey.editor.undoDelete', { name }))
        await client.deleteQuestionnaireTemplate(id)
        showSnack(t('journey.editor.instructionDeleted'), 'success')
        refetchQT()
      },
    })
  }
  const handleSaveQuestionnaire = async (
    data: Parameters<typeof client.saveQuestionnaireTemplate>[0],
  ) => {
    pushUndo(t('journey.editor.undoSave', { name: data.name }))
    await client.saveQuestionnaireTemplate(data)
    showSnack(t('journey.editor.instructionSaved'), 'success')
    refetchQT()
  }
  // ── Undo timestamp display ─────────────────────────────────────────────────
  const undoTime = undoTimestamp
    ? new Date(undoTimestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : null
  const tabs = [
    { icon: <RouteIcon />, label: t('journey.editor.tabTemplates') },
    { icon: <ScienceIcon />, label: t('journey.editor.tabResearch') },
    { icon: <PeopleIcon />, label: t('journey.editor.tabPatientJourneys') },
    { icon: <ArticleIcon />, label: t('journey.editor.tabInstructions') },
    { icon: <AssignmentIcon />, label: t('journey.editor.tabQuestionnaires') },
  ]
  const panel = (index: number, children: React.ReactNode, card = true) => (
    <div
      role="tabpanel"
      hidden={tab !== index}
      id={`journey-tabpanel-${index}`}
      aria-labelledby={`journey-tab-${index}`}
    >
      {tab === index &&
        (card ? (
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: `1px solid ${tokens.border}`,
              borderRadius: 3,
              p: { xs: 2, sm: 2.5 },
            }}
          >
            {children}
          </Box>
        ) : (
          children
        ))}
    </div>
  )
  return (
    <Stack sx={{ gap: 2.5 }}>
      <PageHeader
        title={t('journey.editor.title')}
        subtitle={t('journey.editor.subtitle')}
        actions={
          <Tooltip
            title={
              canUndo
                ? t('journey.editor.undoTooltip', {
                    description: undoDescription ?? '',
                    time: undoTime ?? '',
                  })
                : t('journey.editor.nothingToUndo')
            }
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={undo}
                disabled={!canUndo}
                sx={{ borderRadius: 2, borderColor: tokens.inputBorder, color: tokens.text }}
              >
                {t('journey.editor.undo')}
              </Button>
            </span>
          </Tooltip>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        aria-label={t('journey.editor.title')}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 0,
          borderBottom: `1px solid ${tokens.border}`,
          '& .MuiTabs-flexContainer': { gap: 0.5 },
          '& .MuiTabs-indicator': { height: 2 },
          '& .MuiTab-root': {
            minHeight: 0,
            minWidth: 0,
            px: 1.75,
            py: 1.25,
            gap: 0.75,
            fontSize: 14,
            fontWeight: 400,
            textTransform: 'none',
            color: tokens.textSecondary,
            '& svg': { fontSize: 18 },
          },
          '& .MuiTab-root.Mui-selected': { color: tokens.primary, fontWeight: 600 },
        }}
      >
        {tabs.map((tb, i) => (
          <Tab
            key={tb.label}
            icon={tb.icon}
            iconPosition="start"
            label={tb.label}
            id={`journey-tab-${i}`}
            aria-controls={`journey-tabpanel-${i}`}
          />
        ))}
      </Tabs>

      {panel(
        0,
        <JourneyTemplatesTab
          journeyTemplates={journeyTemplates}
          loading={jLoading}
          onDelete={handleDeleteTemplate}
          onRefresh={refetchJT}
          patientJourneys={patientJourneys}
          questionnaires={questionnaires}
          instructionTemplates={instructionTemplates}
        />,
        false,
      )}
      {panel(
        1,
        <ResearchModulesTab
          researchModules={researchModules}
          loading={rmLoading}
          questionnaires={null}
          onDelete={handleDeleteModule}
          onSave={handleSaveModule}
        />,
      )}
      {panel(
        2,
        <PatientJourneysTable
          patientJourneys={patientJourneys}
          loading={pjLoading}
          patients={patients}
          journeyTemplates={journeyTemplates}
          researchModules={researchModules}
        />,
      )}
      {panel(
        3,
        <InstructionTemplatesTab
          instructionTemplates={instructionTemplates}
          loading={itLoading}
          onDelete={handleDeleteInstruction}
          onSave={handleSaveInstruction}
        />,
      )}
      {panel(
        4,
        <QuestionnaireTemplatesTab
          questionnaires={questionnaires}
          loading={qtLoading}
          onDelete={handleDeleteQuestionnaire}
          onSave={handleSaveQuestionnaire}
        />,
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </Stack>
  )
}
