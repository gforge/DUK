import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useSnack } from '../../store/snackContext'
import * as client from '../../api/client'
import { ConsentDialog, RevokeConsentDialog } from '../journey/ConsentDialog'
import type { PatientJourney, ResearchModule, Consent } from '../../api/schemas'

interface Props {
  readonly journey: PatientJourney
  readonly patientId: string
  readonly allModules: ResearchModule[]
  readonly consents: Consent[]
  readonly onChanged: () => void
}

export default function PatientJourneyResearchCard({
  journey,
  patientId,
  allModules,
  consents,
  onChanged,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()

  const [enrolling, setEnrolling] = useState(false)
  const [selectedNewModuleId, setSelectedNewModuleId] = useState('')
  const [consentTarget, setConsentTarget] = useState<ResearchModule | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Consent | null>(null)

  // Modules already enrolled for this journey
  const enrolledModules = allModules.filter((rm) => journey.researchModuleIds?.includes(rm.id))

  // Modules not yet enrolled — available for enrollment
  const availableModules = allModules.filter((rm) => !journey.researchModuleIds?.includes(rm.id))

  const handleEnrollAndConsent = async () => {
    if (!selectedNewModuleId) return
    const module = availableModules.find((rm) => rm.id === selectedNewModuleId)
    if (!module) return
    try {
      await client.enrollResearchModule(journey.id, module.id)
      onChanged()
      setEnrolling(false)
      setSelectedNewModuleId('')
      // Open consent dialog for the newly enrolled module
      setConsentTarget(module)
    } catch {
      showSnack(t('common.error'), 'error')
    }
  }

  const activeConsent = (moduleId: string) =>
    consents.find(
      (c) =>
        c.researchModuleId === moduleId &&
        c.patientJourneyId === journey.id &&
        c.revokedAt === null,
    ) ?? null

  return (
    <Box>
      {enrolledModules.length === 0 && !enrolling ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('patients.research.noStudies')}
        </Typography>
      ) : (
        <Stack gap={1} mb={enrolling || availableModules.length > 0 ? 1.5 : 0}>
          {enrolledModules.map((rm) => {
            const consent = activeConsent(rm.id)
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
                <Stack gap={0.25}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ScienceIcon fontSize="small" color="secondary" />
                    <Typography variant="body2" fontWeight={600}>
                      {rm.studyName}
                    </Typography>
                  </Stack>
                  {consent ? (
                    <Chip
                      label={t('patient.consentGranted', {
                        date: new Date(consent.grantedAt).toLocaleDateString(),
                      })}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start', height: 20, fontSize: 11 }}
                    />
                  ) : (
                    <Chip
                      label={t('patient.consentPending')}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start', height: 20, fontSize: 11 }}
                    />
                  )}
                </Stack>
                {consent ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => setRevokeTarget(consent)}
                  >
                    {t('patient.consentWithdraw')}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    disableElevation
                    onClick={() => setConsentTarget(rm)}
                  >
                    {t('patient.readAndConsent')}
                  </Button>
                )}
              </Stack>
            )
          })}
        </Stack>
      )}

      {/* Enroll a new module */}
      {availableModules.length > 0 && (
        <>
          {enrolledModules.length > 0 && <Divider sx={{ my: 1 }} />}
          {enrolling ? (
            <Stack direction="row" gap={1} alignItems="center">
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>{t('patients.research.selectStudy')}</InputLabel>
                <Select
                  value={selectedNewModuleId}
                  onChange={(e) => setSelectedNewModuleId(e.target.value)}
                  label={t('patients.research.selectStudy')}
                >
                  {availableModules.map((rm) => (
                    <MenuItem key={rm.id} value={rm.id}>
                      {rm.studyName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                disableElevation
                onClick={handleEnrollAndConsent}
                disabled={!selectedNewModuleId}
              >
                {t('patients.research.enrollAndConsent')}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEnrolling(false)
                  setSelectedNewModuleId('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </Stack>
          ) : (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setEnrolling(true)}
            >
              {t('patients.research.addStudy')}
            </Button>
          )}
        </>
      )}

      {/* Consent dialogs */}
      {consentTarget && (
        <ConsentDialog
          open
          onClose={() => setConsentTarget(null)}
          module={consentTarget}
          patientId={patientId}
          journeyId={journey.id}
          onGranted={() => {
            onChanged()
            setConsentTarget(null)
          }}
        />
      )}
      {revokeTarget && (
        <RevokeConsentDialog
          open
          onClose={() => setRevokeTarget(null)}
          consent={revokeTarget}
          studyName={allModules.find((rm) => rm.id === revokeTarget.researchModuleId)?.studyName ?? ''}
          onRevoked={() => {
            onChanged()
            setRevokeTarget(null)
          }}
        />
      )}
    </Box>
  )
}
