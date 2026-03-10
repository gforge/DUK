import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RouteIcon from '@mui/icons-material/Route'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  EpisodeOfCare,
  JourneyTemplate,
  PatientJourney,
  QuestionnaireTemplate,
} from '@/api/schemas'
import { JourneyPanelContent } from '@/components/patients/JourneyPanel'
import { useJourneyStatusLabel } from '@/hooks/labels'

interface PhysicianOption {
  id: string
  name: string
}

interface Props {
  journeys: PatientJourney[]
  episodes: EpisodeOfCare[]
  journeyTemplates: JourneyTemplate[]
  questionnaireTemplates: QuestionnaireTemplate[]
  physicianOptions: PhysicianOption[]
  patientResponsiblePhysicianUserId?: string
  onJourneyChanged: () => void
  onJourneyResponsiblePhysicianChange: (
    journeyId: string,
    responsiblePhysicianUserId?: string | null,
  ) => void
}

export default function PatientJourneysSection({
  journeys,
  episodes,
  journeyTemplates,
  questionnaireTemplates,
  physicianOptions,
  patientResponsiblePhysicianUserId,
  onJourneyChanged,
  onJourneyResponsiblePhysicianChange,
}: Props) {
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()

  const episodeGroups = useMemo(() => {
    const jrns = [...journeys].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const journeysByEpisode: Record<string, PatientJourney[]> = {}
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
      return { episode: episodes.find((e) => e.id === epId), phases }
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

  const templateName = (templateId: string) =>
    journeyTemplates.find((jt) => jt.id === templateId)?.name ?? templateId

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
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <RouteIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patientDetail.journeys')}
        </Typography>
        <Chip label={journeys.length} size="small" variant="outlined" />
      </Stack>

      {journeys.length === 0 ? (
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
                      const resolvedResponsiblePhysicianUserId =
                        j.responsiblePhysicianUserId === null
                          ? ''
                          : (j.responsiblePhysicianUserId ??
                            episode?.responsibleUserId ??
                            patientResponsiblePhysicianUserId ??
                            '')

                      const phaseHeader = (
                        <Stack direction="row" alignItems="center" gap={1} mb={1} flexWrap="wrap">
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
                          <Box sx={{ flexGrow: 1 }} />
                          <FormControl
                            size="small"
                            sx={{ minWidth: { xs: '100%', sm: 300 } }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <InputLabel id={`journey-rp-${j.id}`}>
                              {t('patientDetail.journeyResponsiblePhysician')}
                            </InputLabel>
                            <Select
                              labelId={`journey-rp-${j.id}`}
                              label={t('patientDetail.journeyResponsiblePhysician')}
                              value={resolvedResponsiblePhysicianUserId ?? ''}
                              onChange={(e) =>
                                onJourneyResponsiblePhysicianChange(
                                  j.id,
                                  e.target.value ? String(e.target.value) : null,
                                )
                              }
                            >
                              <MenuItem value="">
                                <em>{t('common.notSet')}</em>
                              </MenuItem>
                              {physicianOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.id}>
                                  {opt.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      )

                      if (isActive || phases.length === 1) {
                        return (
                          <Box key={j.id} sx={{ pt: 1 }}>
                            {phaseHeader}
                            <JourneyPanelContent
                              journey={j}
                              journeyTemplates={journeyTemplates}
                              questionnaireTemplates={questionnaireTemplates}
                              onJourneyChanged={onJourneyChanged}
                            />
                          </Box>
                        )
                      }

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
                            {phaseHeader}
                            <JourneyPanelContent
                              journey={j}
                              journeyTemplates={journeyTemplates}
                              questionnaireTemplates={questionnaireTemplates}
                              onJourneyChanged={onJourneyChanged}
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
  )
}
