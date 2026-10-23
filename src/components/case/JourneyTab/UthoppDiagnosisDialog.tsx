import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Referral } from '@/api/schemas'

/** Diagnoses the simulated TakeCare launch offers — a small orthopaedic subset of ICD-10-SE. */
const UTHOPP_DIAGNOSES: Referral['diagnoses'] = [
  { code: 'M16.0', text: 'Primär koxartros, dubbelsidig' },
  { code: 'M16.1', text: 'Primär koxartros, ensidig' },
  { code: 'M17.0', text: 'Primär gonartros, dubbelsidig' },
  { code: 'M17.1', text: 'Primär gonartros, ensidig' },
  { code: 'M19.0', text: 'Primär artros i andra leder' },
  { code: 'S52.5', text: 'Fraktur på nedre änden av radius' },
  { code: 'S72.0', text: 'Fraktur på lårbenshalsen' },
]

interface UthoppDiagnosisDialogProps {
  readonly open: boolean
  readonly initial: Referral['diagnoses']
  readonly onClose: () => void
  readonly onConfirm: (diagnoses: Referral['diagnoses']) => Promise<void>
}

export default function UthoppDiagnosisDialog({
  open,
  initial,
  onClose,
  onConfirm,
}: UthoppDiagnosisDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>(() => initial.map((d) => d.code))
  const [saving, setSaving] = useState(false)

  const toggle = (code: string) =>
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onConfirm(UTHOPP_DIAGNOSES.filter((d) => selected.includes(d.code)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('referral.uthoppTitle')}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('referral.uthoppInfo')}
        </Alert>
        <Stack>
          {UTHOPP_DIAGNOSES.map((d) => (
            <FormControlLabel
              key={d.code}
              control={
                <Checkbox checked={selected.includes(d.code)} onChange={() => toggle(d.code)} />
              }
              label={`${d.code} ${d.text}`}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={saving || selected.length === 0}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {t('referral.uthoppConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
