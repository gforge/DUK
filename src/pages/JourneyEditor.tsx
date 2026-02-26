import React, { useState } from 'react'
import { Alert, Box, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { useTranslation } from 'react-i18next'
import { useApi } from '../hooks/useApi'
import * as client from '../api/client'
import { useSnack } from '../store/snackContext'
import JourneyTemplatesTab from '../components/journey/editor/JourneyTemplatesTab'
import ResearchModulesTab from '../components/journey/editor/ResearchModulesTab'
import PatientJourneysTable from '../components/journey/editor/PatientJourneysTable'
import InstructionTemplatesTab from '../components/journey/editor/InstructionTemplatesTab'

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

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!confirm(t('journey.editor.confirmDeleteTemplate', { name }))) return
    await client.deleteJourneyTemplate(templateId)
    showSnack(t('journey.editor.templateDeleted'), 'success')
    refetchJT()
  }

  const handleDeleteModule = async (moduleId: string, name: string) => {
    if (!confirm(t('journey.editor.confirmDeleteModule', { name }))) return
    await client.deleteResearchModule(moduleId)
    showSnack(t('journey.editor.moduleDeleted'), 'success')
    refetchRM()
  }

  const handleDeleteInstruction = async (id: string, name: string) => {
    if (!confirm(t('journey.editor.confirmDeleteInstruction', { name }))) return
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
    await client.saveInstructionTemplate(data)
    showSnack(t('policy.ruleSaved'), 'success')
    refetchIT()
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <RouteIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          {t('journey.editor.title')}
        </Typography>
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
              onDelete={handleDeleteModule}
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
        </Box>
      </Paper>
    </Box>
  )
}
