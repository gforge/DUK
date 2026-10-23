import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { EpisodeOfCare, Referral } from '@/api/schemas'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import UthoppDiagnosisDialog from './UthoppDiagnosisDialog'

interface ReferralCardProps {
  readonly episode: EpisodeOfCare
  readonly onChanged: () => void
}

/** Incoming referral with diagnoses supplied via uthopp from TakeCare. */
export default function ReferralCard({ episode, onChanged }: ReferralCardProps) {
  const { t } = useTranslation()
  const { currentUser } = useRole()
  const { showSnack } = useSnack()
  const [uthoppOpen, setUthoppOpen] = useState(false)
  const referral = episode.referral
  if (!referral) return null

  const handleUthopp = async (diagnoses: Referral['diagnoses']) => {
    await client.setReferralDiagnoses(
      episode.id,
      diagnoses,
      'UTHOPP',
      currentUser.id,
      currentUser.role,
    )
    setUthoppOpen(false)
    showSnack(t('referral.diagnosesSaved'), 'success')
    onChanged()
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="subtitle2">{t('referral.title')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t('referral.received', {
            date: referral.receivedAt.slice(0, 10),
            referrer: referral.referrer,
          })}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {referral.reason}
      </Typography>

      {referral.diagnoses.length > 0 ? (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {referral.diagnoses.map((d) => (
            <Chip key={d.code} size="small" label={`${d.code} ${d.text}`} />
          ))}
          {referral.diagnosisSource === 'UTHOPP' && (
            <Typography variant="caption" color="text.secondary">
              {t('referral.viaUthopp')}
            </Typography>
          )}
          <Button size="small" onClick={() => setUthoppOpen(true)} startIcon={<OpenInNewIcon />}>
            {t('referral.changeViaUthopp')}
          </Button>
        </Stack>
      ) : (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setUthoppOpen(true)}
              startIcon={<OpenInNewIcon />}
            >
              {t('referral.openUthopp')}
            </Button>
          }
        >
          {t('referral.diagnosisMissing')}
        </Alert>
      )}

      {uthoppOpen && (
        <UthoppDiagnosisDialog
          open
          initial={referral.diagnoses}
          onClose={() => setUthoppOpen(false)}
          onConfirm={handleUthopp}
        />
      )}
    </Paper>
  )
}
