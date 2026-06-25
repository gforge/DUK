import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateInstruction,
} from '@/api/schemas'
import { useSnack } from '@/store/snackContext'

interface Props {
  template: JourneyTemplate
  instructionTemplates: InstructionTemplate[]
  onClose: () => void
  onSaved: () => void
}

export function TemplateInstructionsDialog({
  template,
  instructionTemplates,
  onClose,
  onSaved,
}: Readonly<Props>) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<JourneyTemplateInstruction[]>(() =>
    template.instructions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((i) => ({ ...i })),
  )

  const templateOptions = useMemo(
    () => instructionTemplates.map((it) => ({ id: it.id, name: it.name })),
    [instructionTemplates],
  )

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `jti-${Math.random().toString(36).slice(2, 10)}`,
        journeyTemplateId: template.id,
        instructionTemplateId: templateOptions[0]?.id ?? '',
        label: '',
        startDayOffset: 0,
        endDayOffset: undefined,
        order: prev.length,
        tags: [],
      },
    ])
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, order: idx })))
  }

  const patchRow = (id: string, patch: Partial<JourneyTemplateInstruction>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await client.saveJourneyTemplate({
        ...template,
        instructions: rows
          .filter((r) => r.instructionTemplateId)
          .map((r, idx) => ({ ...r, order: idx, journeyTemplateId: template.id })),
      })
      showSnack(t('journey.editor.templateSaved'), 'success')
      onSaved()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('journey.editor.tabInstructions')}</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ mt: 1 }}>
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('journey.noInstructions')}
            </Typography>
          )}

          {rows.map((row) => (
            <Stack key={row.id} direction="row" gap={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>{t('journey.entry.instructionFromTemplate')}</InputLabel>
                <Select
                  label={t('journey.entry.instructionFromTemplate')}
                  value={row.instructionTemplateId}
                  onChange={(e) => patchRow(row.id, { instructionTemplateId: e.target.value })}
                >
                  {templateOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label={t('journey.entry.label')}
                value={row.label ?? ''}
                onChange={(e) => patchRow(row.id, { label: e.target.value })}
                sx={{ minWidth: 220 }}
              />

              <TextField
                size="small"
                type="number"
                label={t('journey.offsetDays')}
                value={row.startDayOffset}
                onChange={(e) => patchRow(row.id, { startDayOffset: Number(e.target.value) })}
                sx={{ width: 120 }}
              />

              <TextField
                size="small"
                type="number"
                label={t('journey.window')}
                value={row.endDayOffset ?? ''}
                onChange={(e) =>
                  patchRow(row.id, {
                    endDayOffset: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                sx={{ width: 120 }}
              />

              <IconButton color="error" onClick={() => removeRow(row.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Button startIcon={<AddIcon />} onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
            {t('journey.editor.addInstruction')}
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} disableElevation>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
