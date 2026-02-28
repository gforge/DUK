import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import { useSnack } from '../../store/snackContext'
import { useRole } from '../../store/roleContext'
import JourneyTimeline from '../journey/JourneyTimeline'
import ModifyJourneyDialog from '../journey/ModifyJourneyDialog'
import JourneyModHistory from './journey/JourneyModHistory'
import { ConsentDialog, RevokeConsentDialog } from '../journey/ConsentDialog'
import type { Case, JourneyModification, ResearchModule, Consent } from '../../api/schemas'

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, SUSPENDED: 1, COMPLETED: 2 }

interface JourneyTabProps {
  caseData: Case
}

export default function JourneyTab({ caseData }: JourneyTabProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()

  const [modifyOpen, setModifyOpen] = useState(false)
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false)
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)
  const [consentDialogModule, setConsentDialogModule] = useState<ResearchModule | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<{
    consent: Consent
    module: ResearchModule
  } | null>(null)
  const [pauseLoading, setPauseLoading] = useState(false)

  const {
    data: journeys,
    loading: journeysLoading,
    refetch: refetchJourneys,
  } = useApi(() => client.getPatientJourneys(caseData.patientId), [caseData.patientId])

  const { data: formResponses } = useApi(() => client.getFormResponses(caseData.id), [caseData.id])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: questionnaireTemplates } = useApi(() => client.getQuestionnaireTemplates(), [])
  const { data: allConsents, refetch: refetchConsents } = useApi(
    () => client.getResearchConsents(caseData.patientId),
    [caseData.patientId],
  )

  // Sort: ACTIVE first, then SUSPENDED, then COMPLETED; newest first within each group
  const sortedJourneys = useMemo(() => {
    if (!journeys) return []
    return [...journeys].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [journeys])

  // Auto-select first journey when data loads or when the list changes
  useEffect(() => {
    if (sortedJourneys.length > 0 && !selectedJourneyId) {
      setSelectedJourneyId(sortedJourneys[0].id)
    }
  }, [sortedJourneys, selectedJourneyId])

  const selectedJourney =
    sortedJourneys.find((j) => j.id === selectedJourneyId) ?? sortedJourneys[0] ?? null

  const { data: effectiveSteps, refetch: refetchSteps } = useApi(
    () => (selectedJourney ? client.getEffectiveSteps(selectedJourney.id) : Promise.resolve([])),
    [selectedJourney?.id],
  )

  const currentTemplate = journeyTemplates?.find(
    (jt) => jt.id === selectedJourney?.journeyTemplateId,
  )

  const enrolledModules = researchModules?.filter((rm) =>
    selectedJourney?.researchModuleIds.includes(rm.id),
  )

  // ------- Pause / Resume -------

  const handlePause = useCallback(async () => {
    if (!selectedJourney) return
    setPauseLoading(true)
    try {
      await client.pauseJourney(selectedJourney.id)
      showSnack(t('journey.pauseSuccess'), 'success')
      refetchJourneys()
      refetchSteps()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setPauseLoading(false)
      setPauseConfirmOpen(false)
    }
  }, [selectedJourney, showSnack, t, refetchJourneys, refetchSteps])

  const handleResume = useCallback(async () => {
    if (!selectedJourney) return
    setPauseLoading(true)
    try {
      await client.resumeJourney(selectedJourney.id)
      showSnack(t('journey.resumeSuccess'), 'success')
      refetchJourneys()
      refetchSteps()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setPauseLoading(false)
    }
  }, [selectedJourney, showSnack, t, refetchJourneys, refetchSteps])

  // ------- Modify journey -------

  const handleModify = useCallback(
    async (
      type: 'ADD_STEP' | 'REMOVE_STEP' | 'SWITCH_TEMPLATE',
      payload: {
        reason: string
        entry?: { label: string; offsetDays: number; windowDays: number; templateId: string }
        stepId?: string
        newTemplateId?: string
        previousTemplateId?: string
        previousStartDate?: string
        newStartDate?: string
      },
    ) => {
      if (!selectedJourney || !currentUser) return
      const modification: Omit<JourneyModification, 'id' | 'addedAt'> = {
        type,
        addedByUserId: currentUser.id,
        reason: payload.reason,
        ...(payload.stepId ? { stepId: payload.stepId } : {}),
        ...(payload.newTemplateId ? { newTemplateId: payload.newTemplateId } : {}),
        ...(payload.previousTemplateId ? { previousTemplateId: payload.previousTemplateId } : {}),
        ...(payload.previousStartDate ? { previousStartDate: payload.previousStartDate } : {}),
        ...(payload.newStartDate ? { newStartDate: payload.newStartDate } : {}),
        ...(payload.entry
          ? {
              entry: {
                id: `step-${Date.now()}`,
                label: payload.entry.label,
                offsetDays: payload.entry.offsetDays,
                windowDays: payload.entry.windowDays,
                order: payload.entry.offsetDays,
                templateId: payload.entry.templateId,
                scoreAliases: {},
                scoreAliasLabels: {},
                dashboardCategory: 'CONTROL' as const,
              },
            }
          : {}),
      }
      await client.modifyPatientJourney(selectedJourney.id, modification)
      showSnack(t('journey.modify.saved'), 'success')
      refetchJourneys()
      refetchSteps()
    },
    [selectedJourney, currentUser, showSnack, t, refetchJourneys, refetchSteps],
  )

  // ------- Pause banner helper -------

  const pausedDays = selectedJourney?.pausedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(selectedJourney.pausedAt).getTime()) / 86_400_000),
      )
    : 0

  // ------- Loading / empty states -------

  if (journeysLoading) {
    return (
      <Stack gap={1}>
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Stack>
    )
  }

  if (sortedJourneys.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {t('journey.noActiveJourney')}
      </Alert>
    )
  }

  // ------- Render -------

  return (
    <Box>
      {/* Journey selector tabs (shown only when there are multiple journeys) */}
      {sortedJourneys.length > 1 && (
        <Tabs
          value={selectedJourney?.id ?? false}
          onChange={(_, id) => setSelectedJourneyId(id as string)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
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

      {selectedJourney && (
        <>
          {/* Journey header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
            <Stack gap={0.5}>
              <Stack direction="row" alignItems="center" gap={1}>
                <RouteIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  {currentTemplate?.name ?? selectedJourney.journeyTemplateId}
                </Typography>
                {sortedJourneys.length === 1 && (
                  <Chip
                    label={t(`journey.journeyStatus.${selectedJourney.status}`)}
                    size="small"
                    color={
                      selectedJourney.status === 'ACTIVE'
                        ? 'primary'
                        : selectedJourney.status === 'SUSPENDED'
                          ? 'warning'
                          : 'default'
                    }
                    variant="outlined"
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {t('journey.startDate')}: {selectedJourney.startDate}
                {selectedJourney.totalPausedDays > 0 &&
                  ` · ${t('journey.pausedDaysShort', { days: selectedJourney.totalPausedDays })}`}
              </Typography>
            </Stack>

            <Stack direction="row" gap={1}>
              {selectedJourney.status === 'ACTIVE' && (
                <>
                  <Tooltip title={t('journey.pause')}>
                    <Button
                      startIcon={pauseLoading ? <CircularProgress size={14} /> : <PauseIcon />}
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => setPauseConfirmOpen(true)}
                      disabled={pauseLoading}
                    >
                      {t('journey.pause')}
                    </Button>
                  </Tooltip>
                  <Button
                    startIcon={<EditIcon />}
                    size="small"
                    variant="outlined"
                    onClick={() => setModifyOpen(true)}
                  >
                    {t('journey.modify.action')}
                  </Button>
                </>
              )}
              {selectedJourney.status === 'SUSPENDED' && (
                <Button
                  startIcon={pauseLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />}
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={handleResume}
                  disabled={pauseLoading}
                >
                  {t('journey.resume')}
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Paused banner */}
          {selectedJourney.status === 'SUSPENDED' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {pausedDays === 0
                ? t('journey.pausedBannerToday')
                : t('journey.pausedBanner', { days: pausedDays, count: pausedDays })}
            </Alert>
          )}

          {/* Research module chips with consent actions */}
          {enrolledModules && enrolledModules.length > 0 && (
            <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
              {enrolledModules.map((rm) => {
                const consent = allConsents?.find(
                  (c) =>
                    c.researchModuleId === rm.id &&
                    c.patientJourneyId === selectedJourney.id &&
                    c.revokedAt === null,
                )
                return (
                  <React.Fragment key={rm.id}>
                    <Chip
                      icon={<ScienceIcon />}
                      label={rm.name}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    {consent ? (
                      <Chip
                        icon={<CheckCircleOutlineIcon />}
                        label={t('journey.research.consent.granted', {
                          date: consent.grantedAt.slice(0, 10),
                        })}
                        size="small"
                        color="success"
                        variant="outlined"
                        onDelete={() => setRevokeTarget({ consent, module: rm })}
                        deleteIcon={
                          <Tooltip title={t('journey.research.consent.revoke')}>
                            <BlockIcon fontSize="small" />
                          </Tooltip>
                        }
                        sx={{ height: 24, fontSize: 11 }}
                      />
                    ) : (
                      <Chip
                        label={t('journey.research.consent.grant')}
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={() => setConsentDialogModule(rm)}
                        sx={{ cursor: 'pointer', height: 24, fontSize: 11 }}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </Stack>
          )}

          {/* Timeline */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <JourneyTimeline
              steps={effectiveSteps ?? []}
              formResponses={formResponses ?? []}
              journeyName={currentTemplate?.description}
            />
          </Paper>

          <JourneyModHistory
            modifications={selectedJourney.modifications}
            journeyTemplates={journeyTemplates}
          />

          {/* Dialogs */}
          {modifyOpen && journeyTemplates && questionnaireTemplates && effectiveSteps && (
            <ModifyJourneyDialog
              open={modifyOpen}
              onClose={() => setModifyOpen(false)}
              journeyId={selectedJourney.id}
              currentTemplateId={selectedJourney.journeyTemplateId}
              currentTemplateName={currentTemplate?.name ?? ''}
              currentStartDate={selectedJourney.startDate}
              steps={effectiveSteps}
              journeyTemplates={journeyTemplates}
              questionnaireTemplates={questionnaireTemplates}
              onModify={handleModify}
            />
          )}

          {consentDialogModule && (
            <ConsentDialog
              open
              onClose={() => setConsentDialogModule(null)}
              module={consentDialogModule}
              patientId={caseData.patientId}
              journeyId={selectedJourney.id}
              onGranted={refetchConsents}
            />
          )}

          {revokeTarget && (
            <RevokeConsentDialog
              open
              onClose={() => setRevokeTarget(null)}
              consent={revokeTarget.consent}
              studyName={revokeTarget.module.studyName}
              onRevoked={refetchConsents}
            />
          )}

          {/* Pause confirmation dialog */}
          <Dialog open={pauseConfirmOpen} onClose={() => setPauseConfirmOpen(false)} maxWidth="xs">
            <DialogTitle>{t('journey.pauseConfirmTitle')}</DialogTitle>
            <DialogContent>
              <Typography variant="body2">{t('journey.pauseConfirmBody')}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPauseConfirmOpen(false)} disabled={pauseLoading}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handlePause}
                color="warning"
                variant="contained"
                disabled={pauseLoading}
                startIcon={pauseLoading ? <CircularProgress size={16} /> : <PauseIcon />}
              >
                {t('journey.pause')}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  )
}
