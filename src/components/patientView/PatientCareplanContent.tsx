import React, { useState } from 'react'
import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/hooks/useApi'
import * as client from '@/api/client'
import { JourneyTimeline } from '../journey'
import PatientClinicalReviews from './PatientClinicalReviews'
import ResearchStudiesSection from './ResearchStudiesSection'
import { useRole } from '@/store/roleContext'
import type { PatientJourney, JourneyTemplate } from '@/api/schemas'

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

const getStatusChipColor = (status: PatientJourney['status']) => {
  if (status === 'ACTIVE') return 'primary'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

interface Props {
  journeys: PatientJourney[]
  journeyTemplates: JourneyTemplate[] | null
  patientId: string
}

export default function PatientCareplan({
  journeys,
  journeyTemplates,
  patientId,
}: Readonly<Props>) {
  const { t } = useTranslation()
  const { currentUser } = useRole()
  const sortedJourneys = [...journeys].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const [selectedId, setSelectedId] = useState<string>(sortedJourneys[0]?.id ?? '')
  const selectedJourney =
    sortedJourneys.find((j) => j.id === selectedId) ?? sortedJourneys[0] ?? null

  const { data: effectiveSteps } = useApi(
    () => (selectedJourney ? client.getEffectiveSteps(selectedJourney.id) : Promise.resolve([])),
    [selectedJourney?.id],
  )

  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: consents, refetch: refetchConsents } = useApi(
    () => client.getResearchConsents(patientId),
    [patientId],
  )

  // Patient view is read-only for review ordering, but should show review outcomes.
  const { data: cases } = useApi(() => client.getCasesByPatient(patientId), [patientId])
  const journeyReviews =
    cases?.flatMap((c) => c.reviews ?? []).filter((review) => review.source === 'JOURNEY') ?? []

  const journeyName = selectedJourney
    ? journeyTemplates?.find((jt) => jt.id === selectedJourney.journeyTemplateId)?.name
    : undefined

  // Modules enrolled for the currently selected journey
  const enrolledModules =
    researchModules?.filter((rm) => selectedJourney?.researchModuleIds?.includes(rm.id)) ?? []
  const consentsList = consents ?? []

  return (
    <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, p: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <RouteIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patient.carePlan')}
        </Typography>
      </Stack>

      {sortedJourneys.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('patient.noCarePlan')}
        </Typography>
      ) : (
        <>
          {sortedJourneys.length > 1 && (
            <Tabs
              value={selectedId}
              onChange={(_, id) => setSelectedId(id as string)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}
            >
              {sortedJourneys.map((j) => {
                const tmpl = journeyTemplates?.find((jt) => jt.id === j.journeyTemplateId)
                return (
                  <Tab
                    key={j.id}
                    value={j.id}
                    label={
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <span>{tmpl?.name ?? j.journeyTemplateId}</span>
                        <Chip
                          label={t(`journey.journeyStatus.${j.status}`)}
                          size="small"
                          color={getStatusChipColor(j.status)}
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Stack>
                    }
                  />
                )
              })}
            </Tabs>
          )}
          <Box>
            <JourneyTimeline
              steps={effectiveSteps ?? []}
              formResponses={[]}
              reviews={journeyReviews}
              journeyName={sortedJourneys.length > 1 ? undefined : journeyName}
            />
          </Box>

          {/* Clinical reviews section */}
          <Box sx={{ mt: 2 }}>
            <PatientClinicalReviews patientId={patientId} />
          </Box>

          {/* Research studies section */}
          <ResearchStudiesSection
            patientId={patientId}
            enrolledModules={enrolledModules}
            consentsList={consentsList}
            currentUserRole={currentUser.role}
            onConsentsChanged={refetchConsents}
          />
        </>
      )}
    </Paper>
  )
}
