import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyTemplate } from '@/api/schemas'
import { useSnack } from '@/store/snackContext'
interface Props {
  template?: JourneyTemplate
  onClose: () => void
  onSaved: (saved: JourneyTemplate) => void
}
export default function EditTemplateDialog({ template, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [referenceDateLabel, setReferenceDateLabel] = useState(
    template?.referenceDateLabel ?? t('journey.referenceDateDefault'),
  )
  const [group, setGroup] = useState(template?.group ?? '')
  const [phaseOrder, setPhaseOrder] = useState<number | ''>(template?.phaseOrder ?? '')
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const grouping = {
        group: group.trim() || undefined,
        phaseOrder: phaseOrder === '' || phaseOrder < 1 ? undefined : Math.round(phaseOrder),
      }
      const saved = await client.saveJourneyTemplate(
        template
          ? {
              ...template,
              name: name.trim(),
              description: description.trim() || undefined,
              referenceDateLabel: referenceDateLabel.trim() || t('journey.referenceDateDefault'),
              ...grouping,
            }
          : {
              name: name.trim(),
              description: description.trim() || undefined,
              referenceDateLabel: referenceDateLabel.trim() || t('journey.referenceDateDefault'),
              entries: [],
              ...grouping,
            },
      )
      showSnack(t('journey.editor.templateSaved'), 'success')
      onSaved(saved)
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Dialog open onClose={onClose} fullWidth sx={{ maxWidth: 'xs' }}>
      <DialogTitle>
        {template ? t('journey.editor.editTemplate') : t('journey.editor.createTemplate')}
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ mt: 1, gap: 2 }}>
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
          <TextField
            label={t('journey.template.group')}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            size="small"
            fullWidth
            helperText={t('journey.template.groupHint')}
          />
          <TextField
            label={t('journey.template.phaseOrder')}
            type="number"
            value={phaseOrder}
            onChange={(e) => setPhaseOrder(e.target.value === '' ? '' : Number(e.target.value))}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
            helperText={t('journey.template.phaseOrderHint')}
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
