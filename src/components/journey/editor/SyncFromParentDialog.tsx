import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import React, { useEffect,useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { JourneyTemplate } from '@/api/schemas'
import type { EntryDiff } from '@/api/service/journeyTemplates'
import { useSnack } from '@/store/snackContext'

interface Props {
  childTemplate: JourneyTemplate
  onClose: () => void
  onSynced: () => void
}

export default function SyncFromParentDialog({ childTemplate, onClose, onSynced }: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [diffs, setDiffs] = useState<EntryDiff[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadingDiff, setLoadingDiff] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    let cancelled = false
    client.computeParentDiff(childTemplate.id).then((d) => {
      if (cancelled) return
      setDiffs(d)
      setSelected(new Set(d.map((di) => di.entryId)))
      setLoadingDiff(false)
    })
    return () => {
      cancelled = true
    }
  }, [childTemplate.id])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await client.applyParentDiff(childTemplate.id, Array.from(selected))
      showSnack(t('journey.editor.syncApplied'), 'success')
      onSynced()
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setApplying(false)
    }
  }

  const diffColor: Record<string, 'success' | 'error' | 'warning'> = {
    ADDED: 'success',
    REMOVED: 'error',
    CHANGED: 'warning',
  }

  const diffLabel: Record<string, string> = {
    ADDED: t('journey.editor.diffAdded'),
    REMOVED: t('journey.editor.diffRemoved'),
    CHANGED: t('journey.editor.diffChanged'),
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('journey.editor.syncDialogTitle')}</DialogTitle>
      <DialogContent>
        {loadingDiff ? (
          <Skeleton variant="rectangular" height={100} />
        ) : !diffs || diffs.length === 0 ? (
          <Typography color="text.secondary">{t('journey.editor.syncNoChanges')}</Typography>
        ) : (
          <Stack gap={1} sx={{ mt: 1 }}>
            {diffs.map((d) => (
              <FormControlLabel
                key={d.entryId}
                control={
                  <Checkbox
                    checked={selected.has(d.entryId)}
                    onChange={() => toggle(d.entryId)}
                    size="small"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Chip
                      label={diffLabel[d.type]}
                      size="small"
                      color={diffColor[d.type]}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                    <Typography variant="body2">{d.label}</Typography>
                  </Stack>
                }
              />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={applying || !diffs?.length || selected.size === 0}
          disableElevation
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
