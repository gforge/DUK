import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import PersonIcon from '@mui/icons-material/Person'
import ScienceIcon from '@mui/icons-material/Science'
import {
  Alert,
  Box,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import * as client from '@/api/client'
import {
  CasesSection,
  PatientJourneyResearchCard,
  PatientJourneysSection,
  PatientResponsibilityCard,
  PatientSummary,
} from '@/components/patients'
import { useJourneyStatusLabel } from '@/hooks/labels'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()
  const { showSnack } = useSnack()
  const navigate = useNavigate()

  const {
    data: patient,
    loading,
    error,
    refetch: refetchPatient,
  } = useApi(() => client.getPatient(id!), [id])
  const { data: cases } = useApi(() => client.getCasesByPatient(id!), [id])
  const { data: journeys, refetch: refetchJourneys } = useApi(
    () => client.getPatientJourneys(id!),
    [id],
  )
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: questionnaireTemplates } = useApi(() => client.getQuestionnaireTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: consents, refetch: refetchConsents } = useApi(
    () => client.getResearchConsents(id!),
    [id],
  )
  const { data: episodes } = useApi(() => client.getEpisodesOfCare(id!), [id])
  const { data: users } = useApi(() => client.getUsers(), [])

  const handleResearchChanged = () => {
    refetchJourneys()
    refetchConsents()
  }

  const physicianOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'DOCTOR').map((u) => ({ id: u.id, name: u.name })),
    [users],
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !patient) {
    return (
      <Box p={3}>
        <Alert severity="error">{t('patientDetail.notFound')}</Alert>
      </Box>
    )
  }

  const sortedCases = [...(cases ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedJourneys = [...(journeys ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const templateName = (templateId: string) =>
    journeyTemplates?.find((jt) => jt.id === templateId)?.name ?? templateId

  const journeyStatusColor = (status: string): 'primary' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'primary'
      case 'SUSPENDED':
        return 'warning'
      case 'COMPLETED':
      default:
        return 'default'
    }
  }

  const handlePatientResponsiblePhysicianChange = async (responsiblePhysicianUserId?: string) => {
    if (!id) return
    try {
      await client.updatePatientResponsiblePhysicianUser(id, responsiblePhysicianUserId)
      refetchPatient()
      showSnack(t('patientDetail.responsiblePhysicianUpdated'), 'success')
    } catch (err) {
      showSnack(`${t('common.error')}: ${String(err)}`, 'error')
    }
  }

  const handleJourneyResponsiblePhysicianChange = async (
    journeyId: string,
    responsiblePhysicianUserId?: string | null,
  ) => {
    try {
      await client.updateJourneyResponsiblePhysicianUser(journeyId, responsiblePhysicianUserId)
      refetchJourneys()
      showSnack(t('patientDetail.responsiblePhysicianUpdated'), 'success')
    } catch (err) {
      showSnack(`${t('common.error')}: ${String(err)}`, 'error')
    }
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          to="/patients"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <PersonIcon fontSize="small" />
          {t('patients.title')}
        </MuiLink>
        <Typography color="text.primary" fontWeight={600}>
          {patient.displayName}
        </Typography>
      </Breadcrumbs>

      {/* Patient summary */}
      <PatientSummary patient={patient} />

      <PatientResponsibilityCard
        patientResponsiblePhysicianUserId={patient.palId}
        physicianOptions={physicianOptions}
        onChange={handlePatientResponsiblePhysicianChange}
      />

      {/* Cases */}
      <CasesSection cases={sortedCases} onRowClick={(caseId) => navigate(`/cases/${caseId}`)} />

      <PatientJourneysSection
        journeys={journeys ?? []}
        episodes={episodes ?? []}
        journeyTemplates={journeyTemplates ?? []}
        questionnaireTemplates={questionnaireTemplates ?? []}
        physicianOptions={physicianOptions}
        patientResponsiblePhysicianUserId={patient.palId}
        onJourneyChanged={refetchJourneys}
        onJourneyResponsiblePhysicianChange={handleJourneyResponsiblePhysicianChange}
      />

      {/* Research studies per journey */}
      {researchModules && researchModules.length > 0 && sortedJourneys.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <ScienceIcon color="secondary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('patients.research.sectionTitle')}
            </Typography>
          </Stack>
          <Stack gap={3}>
            {sortedJourneys.map((j, idx) => (
              <Box key={j.id}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {templateName(j.journeyTemplateId)}
                  </Typography>
                  <Chip
                    label={getJourneyStatusLabel(j.status)}
                    size="small"
                    color={journeyStatusColor(j.status)}
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Stack>
                <PatientJourneyResearchCard
                  journey={j}
                  patientId={id!}
                  allModules={researchModules}
                  consents={consents ?? []}
                  onChanged={handleResearchChanged}
                />
                {idx < sortedJourneys.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
