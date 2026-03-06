import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as client from '@/api/client'
import { useSnack } from '@/store/snackContext'
import type { JourneyTemplate } from '@/api/schemas'

interface Props {
  template?: JourneyTemplate
  onClose: () => void
  onSaved: () => void
}

export default function EditTemplateDialog({ template, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [referenceDateLabel, setReferenceDateLabel] = useState(
    template?.referenceDateLabel ?? t('journey.referenceDateDefault'),
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await client.saveJourneyTemplate(
        template
          ? {
              ...template,
              name: name.trim(),
              description: description.trim() || undefined,
              referenceDateLabel: referenceDateLabel.trim() || t('journey.referenceDateDefault'),
            }
          : {
              name: name.trim(),
              description: description.trim() || undefined,
              referenceDateLabel: referenceDateLabel.trim() || t('journey.referenceDateDefault'),
              entries: [],
            },
      )
      showSnack(t('journey.editor.templateSaved'), 'success')
      onSaved()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {template ? t('journey.editor.editTemplate') : t('journey.editor.createTemplate')}
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField
            label={t('journey.template.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            required
          />
          <TextField
            label={t('journey.template.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label={t('journey.template.referenceDateLabel')}
            value={referenceDateLabel}
            onChange={(e) => setReferenceDateLabel(e.target.value)}
            size="small"
            fullWidth
            required
            helperText={t('journey.template.referenceDateLabelHint')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          disableElevation
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
