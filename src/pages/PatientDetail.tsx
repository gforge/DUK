import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { CasesSection, PatientJourneyResearchCard, PatientSummary } from '@/components/patients'
import { JourneyPanelContent } from '@/components/patients/JourneyPanel'
import { useJourneyStatusLabel } from '@/hooks/labels'
import { useApi } from '@/hooks/useApi'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()
  const navigate = useNavigate()

  const { data: patient, loading, error } = useApi(() => client.getPatient(id!), [id])
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

  const handleResearchChanged = () => {
    refetchJourneys()
    refetchConsents()
  }

  const episodeGroups = useMemo(() => {
    const eps = episodes ?? []
    const jrns = [...(journeys ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const journeysByEpisode: Record<string, typeof jrns> = {}
    const episodeOrder: string[] = []
    for (const j of jrns) {
      if (!journeysByEpisode[j.episodeId]) {
        journeysByEpisode[j.episodeId] = []
        episodeOrder.push(j.episodeId)
      }
      journeysByEpisode[j.episodeId].push(j)
    }
    const groups = episodeOrder.map((epId) => {
      const phases = [...journeysByEpisode[epId]].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      )
      return { episode: eps.find((e) => e.id === epId), phases }
    })
    return groups.sort((a, b) => {
      const aHasActive = a.phases.some((j) => j.status === 'ACTIVE' || j.status === 'SUSPENDED')
      const bHasActive = b.phases.some((j) => j.status === 'ACTIVE' || j.status === 'SUSPENDED')
      if (aHasActive !== bHasActive) return aHasActive ? -1 : 1
      const aLatest = a.phases[a.phases.length - 1]?.startDate ?? ''
      const bLatest = b.phases[b.phases.length - 1]?.startDate ?? ''
      return bLatest.localeCompare(aLatest)
    })
  }, [journeys, episodes])

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

  const templateName = (templateId: string) =>
    journeyTemplates?.find((jt) => jt.id === templateId)?.name ?? templateId

  const sortedCases = [...(cases ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedJourneys = [...(journeys ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

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

      {/* Cases */}
      <CasesSection cases={sortedCases} onRowClick={(caseId) => navigate(`/cases/${caseId}`)} />

      {/* Journeys — grouped by episode */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <RouteIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('patientDetail.journeys')}
          </Typography>
          <Chip label={sortedJourneys.length} size="small" variant="outlined" />
        </Stack>

        {sortedJourneys.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('patientDetail.noJourneys')}
          </Typography>
        ) : (
          <Stack gap={1}>
            {episodeGroups.map(({ episode, phases }) => {
              const hasActivePhase = phases.some(
                (j) => j.status === 'ACTIVE' || j.status === 'SUSPENDED',
              )
              const episodeLabel = episode?.label || t('patientDetail.episode')
              return (
                <Accordion
                  key={episode?.id ?? phases[0]?.episodeId}
                  variant="outlined"
                  defaultExpanded={hasActivePhase}
                  sx={{ borderRadius: '8px !important' }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, pr: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {episodeLabel}
                      </Typography>
                      <Chip
                        label={t('patientDetail.phases', { count: phases.length })}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1, pt: 0 }}>
                    <Stack gap={1.5}>
                      {phases.map((j) => {
                        const isActive = j.status === 'ACTIVE' || j.status === 'SUSPENDED'
                        // Active phases and single-phase episodes: render directly
                        if (isActive || phases.length === 1) {
                          return (
                            <Box key={j.id} sx={{ pt: 1 }}>
                              {phases.length > 1 && (
                                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {templateName(j.journeyTemplateId)}
                                  </Typography>
                                  <Chip
                                    label={getJourneyStatusLabel(j.status)}
                                    size="small"
                                    color={journeyStatusColor(j.status)}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: 11 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {j.startDate}
                                  </Typography>
                                </Stack>
                              )}
                              <JourneyPanelContent
                                journey={j}
                                journeyTemplates={journeyTemplates ?? []}
                                questionnaireTemplates={questionnaireTemplates ?? []}
                                onJourneyChanged={refetchJourneys}
                              />
                            </Box>
                          )
                        }
                        // Completed phase in multi-phase episode: inner collapsed accordion
                        return (
                          <Accordion
                            key={j.id}
                            variant="outlined"
                            defaultExpanded={false}
                            sx={{ borderRadius: '6px !important', '&:before': { display: 'none' } }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                gap={1}
                                sx={{ flex: 1, pr: 1 }}
                              >
                                <Typography variant="body2">
                                  {templateName(j.journeyTemplateId)}
                                </Typography>
                                <Chip
                                  label={getJourneyStatusLabel(j.status)}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 'auto' }}
                                >
                                  {j.startDate}
                                </Typography>
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              <JourneyPanelContent
                                journey={j}
                                journeyTemplates={journeyTemplates ?? []}
                                questionnaireTemplates={questionnaireTemplates ?? []}
                                onJourneyChanged={refetchJourneys}
                              />
                            </AccordionDetails>
                          </Accordion>
                        )
                      })}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Stack>
        )}
      </Paper>

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
