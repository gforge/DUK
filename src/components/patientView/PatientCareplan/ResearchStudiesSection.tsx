import ScienceIcon from '@mui/icons-material/Science'
import { Button, Chip, Divider, Stack, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Consent, ResearchModule } from '@/api/schemas'
import { DeclineConsentDialog, GrantConsentDialog, RevokeConsentDialog } from '@/components/journey'

interface Props {
  patientId: string
  enrolledModules: ResearchModule[]
  consentsList: Consent[]
  currentUserRole: string
  onConsentsChanged: () => void
}

export function ResearchStudiesSection({
  patientId,
  enrolledModules,
  consentsList,
  currentUserRole,
  onConsentsChanged,
}: Props) {
  const { t } = useTranslation()

  const [manualConsentTarget, setManualConsentTarget] = useState<{
    module: ResearchModule
    journeyId: string
  } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Consent | null>(null)
  const [declineTarget, setDeclineTarget] = useState<{
    module: ResearchModule
    journeyId: string
    consentId?: string
    mode: 'decline' | 'withdraw'
  } | null>(null)

  const getActiveConsent = (moduleId: string, journeyId: string) =>
    consentsList.find(
      (c) =>
        c.researchModuleId === moduleId && c.patientJourneyId === journeyId && c.revokedAt === null,
    ) ?? null

  const firstPendingModule = enrolledModules.find((rm) => !getActiveConsent(rm.id, rm.id))

  // auto-open logic: this is called from consuming component so journeyId must
  // be provided via enrolledModules items or outside. For simplicity we always
  // show automatic consent dialog for the first pending module.
  const autoConsentTarget =
    firstPendingModule && !manualConsentTarget
      ? { module: firstPendingModule, journeyId: firstPendingModule.id }
      : null

  const consentTarget = manualConsentTarget ?? autoConsentTarget

  const handleConsentClose = () => {
    if (!manualConsentTarget) {
      // user dismissed auto-open; nothing else to do
    }
    setManualConsentTarget(null)
  }

  if (enrolledModules.length === 0) return null

  return (
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
          const activeConsent = getActiveConsent(rm.id, rm.id)
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
                  onClick={() =>
                    currentUserRole === 'PATIENT'
                      ? setDeclineTarget({
                          module: rm,
                          journeyId: rm.id,
                          consentId: activeConsent.id,
                          mode: 'withdraw',
                        })
                      : setRevokeTarget(activeConsent)
                  }
                >
                  {t('patient.consentWithdraw')}
                </Button>
              ) : (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    disableElevation
                    onClick={() => setManualConsentTarget({ module: rm, journeyId: rm.id })}
                  >
                    {t('patient.readAndConsent')}
                  </Button>
                  {currentUserRole === 'PATIENT' && (
                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      onClick={() =>
                        setDeclineTarget({
                          module: rm,
                          journeyId: rm.id,
                          mode: 'decline',
                        })
                      }
                    >
                      {t('journey.research.consent.decline')}
                    </Button>
                  )}
                </>
              )}
            </Stack>
          )
        })}
      </Stack>

      {/* Consent dialogs managed here */}
      {consentTarget && (
        <GrantConsentDialog
          open
          onClose={handleConsentClose}
          module={consentTarget.module}
          patientId={patientId}
          journeyId={consentTarget.journeyId}
          onGranted={() => {
            onConsentsChanged()
            setManualConsentTarget(null)
          }}
        />
      )}
      {revokeTarget && (
        <RevokeConsentDialog
          open
          onClose={() => setRevokeTarget(null)}
          consent={revokeTarget}
          studyName={
            enrolledModules.find((rm) => rm.id === revokeTarget.researchModuleId)?.studyName ?? ''
          }
          onRevoked={() => {
            onConsentsChanged()
            setRevokeTarget(null)
          }}
        />
      )}
      {declineTarget && (
        <DeclineConsentDialog
          open
          onClose={() => setDeclineTarget(null)}
          studyName={declineTarget.module.studyName}
          mode={declineTarget.mode}
          patientId={patientId}
          researchModuleId={declineTarget.module.id}
          journeyId={declineTarget.journeyId}
          consentId={declineTarget.consentId}
          onDone={() => {
            onConsentsChanged()
            setDeclineTarget(null)
          }}
        />
      )}
    </>
  )
}
