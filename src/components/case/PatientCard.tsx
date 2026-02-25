import React from 'react'
import { Paper, Stack, Box, Typography, Chip, Divider } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import TriggerChips from '../common/TriggerChips'
import AutoWarningsBadge from '../common/AutoWarningsBadge'
import type { Case, Patient } from '../../api/schemas'

interface PatientCardProps {
  patient: Patient
  caseData: Case
}

export default function PatientCard({ patient, caseData }: PatientCardProps) {
  const { t } = useTranslation()

  const lastOpened = patient.lastOpenedAt
    ? format(new Date(patient.lastOpenedAt), 'dd MMM yyyy HH:mm')
    : null

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        {/* Patient info */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
          <Box
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PersonIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {patient.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patient.personalNumber} · {patient.dateOfBirth}
            </Typography>
            {lastOpened ? (
              <Typography variant="caption" color="text.secondary">
                {t('patient.lastOpened')}: {lastOpened}
              </Typography>
            ) : (
              <Chip
                label={t('trigger.NOT_OPENED')}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

        {/* Case meta */}
        <Box flex={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ width: '45%', minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary">
                {t('case.category')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {t(`category.${caseData.category}`)}
              </Typography>
            </Box>
            <Box sx={{ width: '45%', minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary">
                {t('case.assignedTo')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {caseData.assignedRole ? t(`role.${caseData.assignedRole}`) : t('common.notSet')}
              </Typography>
            </Box>
            {caseData.nextStep && (
              <Box sx={{ width: '45%', minWidth: 100 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('triage.nextStep')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {t(`nextStep.${caseData.nextStep}`)}
                </Typography>
              </Box>
            )}
            {caseData.deadline && (
              <Box sx={{ width: '45%', minWidth: 100 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('case.deadline')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {format(new Date(caseData.deadline), 'dd MMM yyyy')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Triggers & warnings */}
        {(caseData.triggers.length > 0 || caseData.policyWarnings.length > 0) && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
            <Box flex={1}>
              {caseData.triggers.length > 0 && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('dashboard.triggers')}
                  </Typography>
                  <Box mt={0.5}>
                    <TriggerChips triggers={caseData.triggers} />
                  </Box>
                </Box>
              )}

              {caseData.policyWarnings.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {t('case.policyWarnings')}
                  </Typography>
                  <AutoWarningsBadge
                    warnings={caseData.policyWarnings}
                    lastActivityAt={caseData.lastActivityAt}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
      </Stack>

      {/* Internal note */}
      {caseData.internalNote && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('case.internalNote')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              {caseData.internalNote}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  )
}
