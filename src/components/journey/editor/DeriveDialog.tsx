import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyTemplate } from '@/api/schemas'
import { useSnack } from '@/store/snackContext'

interface Props {
  parentTemplate: JourneyTemplate
  onClose: () => void
  onDerived: () => void
}

export default function DeriveDialog({ parentTemplate, onClose, onDerived }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [name, setName] = useState(`${parentTemplate.name} ${t('journey.deriveCopy')}`)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await client.deriveJourneyTemplate(parentTemplate.id, name.trim())
      showSnack(t('journey.editor.templateSaved'), 'success')
      onDerived()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t('journey.editor.deriveDialogTitle', { name: parentTemplate.name })}
      </DialogTitle>
      <DialogContent>
        <TextField
          label={t('journey.editor.deriveName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          fullWidth
          autoFocus
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          disableElevation
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
