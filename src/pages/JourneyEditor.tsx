import React, { useState, useCallback } from 'react'
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AssignmentIcon from '@mui/icons-material/Assignment'
import UndoIcon from '@mui/icons-material/Undo'
import { useTranslation } from 'react-i18next'
import { useApi } from '../hooks/useApi'
import { useEditorUndo } from '../hooks/useEditorUndo'
import * as client from '../api/client'
import { useSnack } from '../store/snackContext'
import JourneyTemplatesTab from '../components/journey/editor/JourneyTemplatesTab'
import ResearchModulesTab from '../components/journey/editor/ResearchModulesTab'
import PatientJourneysTable from '../components/journey/editor/PatientJourneysTable'
import InstructionTemplatesTab from '../components/journey/editor/InstructionTemplatesTab'
import QuestionnaireTemplatesTab from '../components/journey/editor/QuestionnaireTemplatesTab'

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode
  value: number
  index: number
}) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`journey-tabpanel-${index}`}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function JourneyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [tab, setTab] = useState(0)

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
    if (!confirm(t('journey.editor.confirmDeleteTemplate', { name }))) return
    pushUndo(t('journey.editor.undoDelete', { name }))
    await client.deleteJourneyTemplate(templateId)
    showSnack(t('journey.editor.templateDeleted'), 'success')
    refetchJT()
  }

  // ── Research module handlers ───────────────────────────────────────────────

  const handleDeleteModule = async (moduleId: string, name: string) => {
    if (!confirm(t('journey.editor.confirmDeleteModule', { name }))) return
    pushUndo(t('journey.editor.undoDelete', { name }))
    await client.deleteResearchModule(moduleId)
    showSnack(t('journey.editor.moduleDeleted'), 'success')
    refetchRM()
  }

  const handleSaveModule = async (module: Parameters<typeof client.saveResearchModule>[0]) => {
    pushUndo(t('journey.editor.undoSave', { name: module.name }))
    await client.saveResearchModule(module)
    showSnack(t('journey.research.moduleSaved'), 'success')
    refetchRM()
  }

  // ── Instruction template handlers ─────────────────────────────────────────

  const handleDeleteInstruction = async (id: string, name: string) => {
    if (!confirm(t('journey.editor.confirmDeleteInstruction', { name }))) return
    pushUndo(t('journey.editor.undoDelete', { name }))
    await client.deleteInstructionTemplate(id)
    showSnack(t('journey.editor.instructionDeleted'), 'success')
    refetchIT()
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
    if (!confirm(t('journey.editor.confirmDeleteInstruction', { name }))) return
    pushUndo(t('journey.editor.undoDelete', { name }))
    await client.deleteQuestionnaireTemplate(id)
    showSnack(t('journey.editor.instructionDeleted'), 'success')
    refetchQT()
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

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <RouteIcon color="primary" />
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          {t('journey.editor.title')}
        </Typography>
        <Tooltip
          title={
            canUndo
              ? t('journey.editor.undoTooltip', { description: undoDescription, time: undoTime })
              : t('journey.editor.nothingToUndo')
          }
        >
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={undo}
              disabled={!canUndo}
            >
              {t('journey.editor.undo')}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('journey.editor.description')}
      </Alert>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<RouteIcon fontSize="small" />}
            iconPosition="start"
            label={t('journey.editor.tabTemplates')}
            id="journey-tab-0"
          />
          <Tab
            icon={<ScienceIcon fontSize="small" />}
            iconPosition="start"
            label={t('journey.editor.tabResearch')}
            id="journey-tab-1"
          />
          <Tab
            icon={<PeopleIcon fontSize="small" />}
            iconPosition="start"
            label={t('journey.editor.tabPatientJourneys')}
            id="journey-tab-2"
          />
          <Tab
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={t('journey.editor.tabInstructions')}
            id="journey-tab-3"
          />
          <Tab
            icon={<AssignmentIcon fontSize="small" />}
            iconPosition="start"
            label={t('journey.editor.tabQuestionnaires')}
            id="journey-tab-4"
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tab} index={0}>
            <JourneyTemplatesTab
              journeyTemplates={journeyTemplates}
              loading={jLoading}
              onDelete={handleDeleteTemplate}
              onRefresh={refetchJT}
            />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <ResearchModulesTab
              researchModules={researchModules}
              loading={rmLoading}
              questionnaires={null}
              onDelete={handleDeleteModule}
              onSave={handleSaveModule}
            />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <PatientJourneysTable
              patientJourneys={patientJourneys}
              loading={pjLoading}
              patients={patients}
              journeyTemplates={journeyTemplates}
              researchModules={researchModules}
            />
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <InstructionTemplatesTab
              instructionTemplates={instructionTemplates}
              loading={itLoading}
              onDelete={handleDeleteInstruction}
              onSave={handleSaveInstruction}
            />
          </TabPanel>
          <TabPanel value={tab} index={4}>
            <QuestionnaireTemplatesTab
              questionnaires={questionnaires}
              loading={qtLoading}
              onDelete={handleDeleteQuestionnaire}
              onSave={handleSaveQuestionnaire}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}
