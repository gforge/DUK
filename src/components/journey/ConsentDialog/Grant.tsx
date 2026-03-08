import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import * as client from '@/api/client'
import type { ResearchModule } from '@/api/schemas'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import { DeclineConsentDialog } from './Decline'

interface ConsentDialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly module: ResearchModule
  readonly patientId: string
  readonly journeyId: string
  readonly onGranted: () => void
}

export function GrantConsentDialog({
  open,
  onClose,
  module,
  patientId,
  journeyId,
  onGranted,
}: ConsentDialogProps) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { currentUser } = useRole()
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const handleGrant = async () => {
    if (!checked || saving) return
    setSaving(true)
    try {
      await client.grantConsent(patientId, module.id, journeyId, currentUser.id)
      showSnack(t('journey.research.consent.grantSuccess'), 'success')
      onGranted()
      onClose()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('journey.research.consent.dialogTitle', { studyName: module.studyName })}
        </DialogTitle>
        <DialogContent>
          {module.studyInfoMarkdown ? (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                borderLeft: 3,
                borderColor: 'primary.light',
                '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
                '& h2': { typography: 'subtitle1', fontWeight: 700 },
                '& h3': { typography: 'subtitle2', fontWeight: 600 },
              }}
            >
              <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>
                {t('journey.research.consent.infoLabel')}
              </Typography>
              <ReactMarkdown>{module.studyInfoMarkdown}</ReactMarkdown>
            </Box>
          ) : null}

          <Divider sx={{ my: 1.5 }} />

          <FormControlLabel
            control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
            label={
              <Typography variant="body2">
                {t(
                  currentUser.role === 'PATIENT'
                    ? 'journey.research.consent.checkboxPatient'
                    : 'journey.research.consent.checkbox',
                )}
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          {currentUser.role === 'PATIENT' && (
            <Button color="warning" onClick={() => setDeclineOpen(true)} disabled={saving}>
              {t('journey.research.consent.decline')}
            </Button>
          )}
          <Button
            onClick={handleGrant}
            variant="contained"
            disabled={!checked || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {t('journey.research.consent.grant')}
          </Button>
        </DialogActions>
      </Dialog>

      <DeclineConsentDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        studyName={module.studyName}
        mode="decline"
        patientId={patientId}
        researchModuleId={module.id}
        journeyId={journeyId}
        onDone={() => {
          onGranted()
          onClose()
        }}
      />
    </>
  )
}
