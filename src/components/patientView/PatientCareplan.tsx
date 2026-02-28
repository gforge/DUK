import React, { useState } from 'react'
import { Box, Button, Chip, Divider, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import JourneyTimeline from '../journey/JourneyTimeline'
import { ConsentDialog, RevokeConsentDialog } from '../journey/ConsentDialog'
import type { PatientJourney, JourneyTemplate, ResearchModule, Consent } from '../../api/schemas'

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

interface Props {
  journeys: PatientJourney[]
  journeyTemplates: JourneyTemplate[] | null
  patientId: string
}

export default function PatientCareplan({ journeys, journeyTemplates, patientId }: Props) {
  const { t } = useTranslation()

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

  const [consentTarget, setConsentTarget] = useState<{
    module: ResearchModule
    journeyId: string
  } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Consent | null>(null)

  const journeyName = selectedJourney
    ? journeyTemplates?.find((jt) => jt.id === selectedJourney.journeyTemplateId)?.name
    : undefined

  // Modules enrolled for the currently selected journey
  const enrolledModules =
    researchModules?.filter((rm) => selectedJourney?.researchModuleIds?.includes(rm.id)) ?? []

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
                          color={
                            j.status === 'ACTIVE'
                              ? 'primary'
                              : j.status === 'SUSPENDED'
                                ? 'warning'
                                : 'default'
                          }
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
              journeyName={sortedJourneys.length > 1 ? undefined : journeyName}
            />
          </Box>

          {/* Research studies section */}
          {enrolledModules.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" gap={1} mb={1}>
                <ScienceIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('patient.researchStudies')}
                </Typography>
              </Stack>
              <Stack gap={1.5}>
                {enrolledModules.map((rm) => {
                  const activeConsent = consents?.find(
                    (c) =>
                      c.researchModuleId === rm.id &&
                      c.patientJourneyId === selectedJourney?.id &&
                      c.revokedAt === null,
                  )
                  return (
                    <Stack
                      key={rm.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1.5,
                        py: 1,
                      }}
                    >
                      <Stack gap={0}>
                        <Typography variant="body2" fontWeight={600}>
                          {rm.studyName}
                        </Typography>
                        {activeConsent ? (
                          <Chip
                            label={t('patient.consentGranted', {
                              date: new Date(activeConsent.grantedAt).toLocaleDateString(),
                            })}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ mt: 0.5, alignSelf: 'flex-start', height: 20, fontSize: 11 }}
                          />
                        ) : (
                          <Chip
                            label={t('patient.consentPending')}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ mt: 0.5, alignSelf: 'flex-start', height: 20, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                      {activeConsent ? (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => setRevokeTarget(activeConsent)}
                        >
                          {t('patient.consentWithdraw')}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          disableElevation
                          onClick={() =>
                            setConsentTarget({
                              module: rm,
                              journeyId: selectedJourney?.id ?? '',
                            })
                          }
                        >
                          {t('patient.readAndConsent')}
                        </Button>
                      )}
                    </Stack>
                  )
                })}
              </Stack>
            </>
          )}
        </>
      )}

      {/* Consent dialogs */}
      {consentTarget && (
        <ConsentDialog
          open
          onClose={() => setConsentTarget(null)}
          module={consentTarget.module}
          patientId={patientId}
          journeyId={consentTarget.journeyId}
          onGranted={() => {
            refetchConsents()
            setConsentTarget(null)
          }}
        />
      )}
      {revokeTarget && (
        <RevokeConsentDialog
          open
          onClose={() => setRevokeTarget(null)}
          consent={revokeTarget}
          studyName={
            researchModules?.find((rm) => rm.id === revokeTarget.researchModuleId)?.studyName ?? ''
          }
          onRevoked={() => {
            refetchConsents()
            setRevokeTarget(null)
          }}
        />
      )}
    </Paper>
  )
}
