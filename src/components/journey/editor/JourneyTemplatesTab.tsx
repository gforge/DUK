import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RouteIcon from '@mui/icons-material/Route'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import SyncIcon from '@mui/icons-material/Sync'
import EditIcon from '@mui/icons-material/Edit'
import RepeatIcon from '@mui/icons-material/Repeat'
import { useTranslation } from 'react-i18next'
import * as client from '../../../api/client'
import { useApi } from '../../../hooks/useApi'
import { useSnack } from '../../../store/snackContext'
import ConfirmDialog from '../../common/ConfirmDialog'
import type { JourneyTemplate, JourneyTemplateEntry } from '../../../api/schemas'
import type { EntryDiff } from '../../../api/service/journeyTemplates'
import EntryEditorDialog from './EntryEditorDialog'

function formatOffsetDays(
  days: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): {
  label: string
  tooltip: string
} {
  const tooltip = t('journey.offsetFormat.exactDays', { count: days })
  if (days >= 365)
    return { label: t('journey.offsetFormat.years', { count: Math.round(days / 365) }), tooltip }
  if (days >= 60)
    return { label: t('journey.offsetFormat.months', { count: Math.round(days / 30) }), tooltip }
  if (days >= 14)
    return { label: t('journey.offsetFormat.weeks', { count: Math.round(days / 7) }), tooltip }
  return { label: t('journey.offsetFormat.days', { count: days }), tooltip: '' }
}

interface Props {
  journeyTemplates: JourneyTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onRefresh?: () => void
}

export default function JourneyTemplatesTab({
  journeyTemplates,
  loading,
  onDelete,
  onRefresh,
}: Props) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [deriveTarget, setDeriveTarget] = useState<JourneyTemplate | null>(null)
  const [syncTarget, setSyncTarget] = useState<JourneyTemplate | null>(null)
  // null = closed, undefined = create new, JourneyTemplate = edit existing
  const [editTarget, setEditTarget] = useState<JourneyTemplate | null | undefined>(null)

  // Entry editing state: { templateId, entry? } — entry=undefined means create new
  const [entryEditState, setEntryEditState] = useState<{
    template: JourneyTemplate
    entry?: JourneyTemplateEntry
  } | null>(null)

  const [entryDeleteConfirm, setEntryDeleteConfirm] = useState<{
    template: JourneyTemplate
    entryId: string
  } | null>(null)

  const { data: questionnaires } = useApi(() => client.getQuestionnaireTemplates(), [])
  const { data: instructionTemplates } = useApi(() => client.getInstructionTemplates(), [])

  const handleSaveEntry = async (template: JourneyTemplate, saved: JourneyTemplateEntry) => {
    const existing = template.entries.find((e) => e.id === saved.id)
    const entries = existing
      ? template.entries.map((e) => (e.id === saved.id ? saved : e))
      : [...template.entries, { ...saved, order: template.entries.length }]
    try {
      await client.saveJourneyTemplate({ ...template, entries })
      showSnack(t('journey.editor.entrySaved'), 'success')
      onRefresh?.()
    } catch {
      showSnack(t('common.error'), 'error')
    }
    setEntryEditState(null)
  }

  const handleDeleteEntry = async (template: JourneyTemplate, entryId: string) => {
    setEntryDeleteConfirm({ template, entryId })
  }

  const executeDeleteEntry = async () => {
    if (!entryDeleteConfirm) return
    const { template, entryId } = entryDeleteConfirm
    setEntryDeleteConfirm(null)
    const entries = template.entries.filter((e) => e.id !== entryId)
    try {
      await client.saveJourneyTemplate({ ...template, entries })
      showSnack(t('journey.editor.entryDeleted'), 'success')
      onRefresh?.()
    } catch {
      showSnack(t('common.error'), 'error')
    }
  }

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />

  const parentName = (id: string | undefined) =>
    id ? journeyTemplates?.find((jt) => jt.id === id)?.name : undefined

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setEditTarget(undefined)}
        >
          {t('journey.editor.newTemplate')}
        </Button>
      </Stack>

      {!journeyTemplates?.length ? (
        <Typography color="text.secondary">{t('journey.editor.noTemplates')}</Typography>
      ) : (
        <Stack gap={1.5}>
          {journeyTemplates.map((jt) => (
            <Accordion key={jt.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, pr: 1 }}>
                  <RouteIcon color="primary" fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={0.75}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {jt.name}
                      </Typography>
                      {jt.parentTemplateId && (
                        <Chip
                          label={`${t('journey.editor.derived')} ← ${parentName(jt.parentTemplateId) ?? '?'}`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      )}
                    </Stack>
                    {jt.description && (
                      <Typography variant="caption" color="text.secondary">
                        {jt.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={`${jt.entries.length} ${t('journey.steps')}`}
                    size="small"
                    variant="outlined"
                  />
                  {jt.parentTemplateId && (
                    <Tooltip title={t('journey.editor.syncFromParent')}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSyncTarget(jt)
                        }}
                      >
                        <SyncIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={t('journey.editor.editTemplate')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTarget(jt)
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('journey.editor.derive')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeriveTarget(jt)
                      }}
                    >
                      <ForkRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(jt.id, jt.name)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('journey.step')}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {t('journey.offsetDays')} / {t('journey.window')}
                        </TableCell>
                        <TableCell>{t('journey.questionnaire')}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            {t('journey.scoreAliases')}
                            <Tooltip title={t('journey.scoreAliasesHint')}>
                              <InfoOutlinedIcon fontSize="inherit" color="action" />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jt.entries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.label}
                            </Typography>
                            {entry.stepKey && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  display: 'block',
                                  mt: 0.25,
                                }}
                              >
                                {entry.stepKey}
                              </Typography>
                            )}
                            {entry.recurrenceIntervalDays !== undefined && (
                              <Chip
                                icon={<RepeatIcon />}
                                label={t('journey.template.recurrenceUnit', {
                                  count: entry.recurrenceIntervalDays,
                                })}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ fontSize: 10, height: 18, mt: 0.5 }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {(() => {
                              const { label, tooltip } = formatOffsetDays(entry.offsetDays, t)
                              return (
                                <Tooltip title={tooltip} disableHoverListener={!tooltip}>
                                  <span>
                                    <Typography variant="body2">{label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ±{entry.windowDays}d
                                    </Typography>
                                  </span>
                                </Tooltip>
                              )
                            })()}
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Typography variant="caption">{entry.templateId ?? '—'}</Typography>
                            {entry.instructionTemplateId && (
                              <Tooltip title={entry.instructionTemplateId}>
                                <Chip
                                  label={t('journey.editor.instruction')}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ fontSize: 10, height: 18, mt: 0.5, display: 'block' }}
                                />
                              </Tooltip>
                            )}
                            {!entry.instructionTemplateId && entry.instructionText && (
                              <Tooltip title={entry.instructionText}>
                                <Chip
                                  label={t('journey.editor.instruction')}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: 10, height: 18, mt: 0.5, display: 'block' }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {Object.entries(entry.scoreAliases).map(([raw, alias]) => {
                                const aliasLabel = entry.scoreAliasLabels?.[alias]
                                return (
                                  <Tooltip
                                    key={raw}
                                    title={
                                      aliasLabel ? `${t('journey.label')}: "${aliasLabel}"` : ''
                                    }
                                    disableHoverListener={!aliasLabel}
                                  >
                                    <Chip
                                      label={`${raw} → ${alias}`}
                                      size="small"
                                      variant="outlined"
                                      color={aliasLabel ? 'primary' : 'default'}
                                      sx={{ fontSize: 10, height: 18 }}
                                    />
                                  </Tooltip>
                                )
                              })}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title={t('journey.editor.editEntry')}>
                              <IconButton
                                size="small"
                                onClick={() => setEntryEditState({ template: jt, entry })}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('common.delete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteEntry(jt, entry.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setEntryEditState({ template: jt })}
                  >
                    {t('journey.editor.addEntry')}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Edit / Create Template Dialog */}
      {editTarget !== null && (
        <EditTemplateDialog
          template={editTarget ?? undefined}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            onRefresh?.()
          }}
        />
      )}

      {/* Add / Edit Entry Dialog */}
      {entryEditState !== null && (
        <EntryEditorDialog
          entry={entryEditState.entry}
          questionnaires={questionnaires ?? []}
          instructionTemplates={instructionTemplates ?? []}
          onSave={(saved) => handleSaveEntry(entryEditState.template, saved)}
          onClose={() => setEntryEditState(null)}
        />
      )}

      {/* Derive Dialog */}
      {deriveTarget && (
        <DeriveDialog
          parentTemplate={deriveTarget}
          onClose={() => setDeriveTarget(null)}
          onDerived={() => {
            setDeriveTarget(null)
            onRefresh?.()
          }}
        />
      )}

      {/* Sync From Parent Dialog */}
      {syncTarget && (
        <SyncFromParentDialog
          childTemplate={syncTarget}
          onClose={() => setSyncTarget(null)}
          onSynced={() => {
            setSyncTarget(null)
            onRefresh?.()
          }}
        />
      )}

      {/* Entry delete confirmation */}
      <ConfirmDialog
        open={!!entryDeleteConfirm}
        title={t('common.delete')}
        message={t('journey.editor.confirmDeleteEntry')}
        onConfirm={executeDeleteEntry}
        onCancel={() => setEntryDeleteConfirm(null)}
      />
    </>
  )

  // suppress unused Paper import warning
  void Paper
}

// ─── Derive Dialog ──────────────────────────────────────────────────────────────

function DeriveDialog({
  parentTemplate,
  onClose,
  onDerived,
}: {
  parentTemplate: JourneyTemplate
  onClose: () => void
  onDerived: () => void
}) {
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

// ─── Sync From Parent Dialog ────────────────────────────────────────────────────

function SyncFromParentDialog({
  childTemplate,
  onClose,
  onSynced,
}: {
  childTemplate: JourneyTemplate
  onClose: () => void
  onSynced: () => void
}) {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [diffs, setDiffs] = useState<EntryDiff[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadingDiff, setLoadingDiff] = useState(true)
  const [applying, setApplying] = useState(false)

  React.useEffect(() => {
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

// ─── Edit Template Dialog ────────────────────────────────────────────────────

function EditTemplateDialog({
  template,
  onClose,
  onSaved,
}: {
  template?: JourneyTemplate
  onClose: () => void
  onSaved: () => void
}) {
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
