import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useTranslation } from 'react-i18next'
import type {
  ResearchModule,
  ResearchModuleEntry,
  QuestionnaireTemplate,
} from '@/api/schemas'

const mkId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)

type EntryMode = 'REPLACE' | 'ADDITIVE'

interface EntryDraft {
  _id: string
  label: string
  templateId: string
  mode: EntryMode
  replaceStepId: string
  offsetDays: number | ''
}

function moduleToEntryDrafts(module: ResearchModule): EntryDraft[] {
  return module.entries.map((e) => ({
    _id: e.id,
    label: e.label,
    templateId: e.templateId,
    mode: e.replaceStepId ? 'REPLACE' : 'ADDITIVE',
    replaceStepId: e.replaceStepId ?? '',
    offsetDays: e.offsetDays ?? '',
  }))
}

interface ModuleEditorDialogProps {
  module?: ResearchModule
  questionnaires: QuestionnaireTemplate[]
  onSave: (m: Omit<ResearchModule, 'id' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}

function ModuleEditorDialog({ module, questionnaires, onSave, onClose }: ModuleEditorDialogProps) {
  const { t } = useTranslation()
  const isCreate = !module

  const [name, setName] = useState(module?.name ?? '')
  const [studyName, setStudyName] = useState(module?.studyName ?? '')
  const [studyInfoMarkdown, setStudyInfoMarkdown] = useState(module?.studyInfoMarkdown ?? '')
  const [entryDrafts, setEntryDrafts] = useState<EntryDraft[]>(
    module ? moduleToEntryDrafts(module) : [],
  )

  const qtOptions = questionnaires.map((q) => ({ id: q.id, name: q.name }))

  const addEntry = () => {
    setEntryDrafts((prev) => [
      ...prev,
      {
        _id: mkId(),
        label: '',
        templateId: '',
        mode: 'ADDITIVE',
        replaceStepId: '',
        offsetDays: 0,
      },
    ])
  }

  const updateEntry = <K extends keyof EntryDraft>(id: string, field: K, value: EntryDraft[K]) => {
    setEntryDrafts((prev) => prev.map((e) => (e._id === id ? { ...e, [field]: value } : e)))
  }

  const deleteEntry = (id: string) => {
    setEntryDrafts((prev) => prev.filter((e) => e._id !== id))
  }

  const isValid = name.trim() !== '' && studyName.trim() !== ''

  const handleSave = () => {
    if (!isValid) return
    const entries: ResearchModuleEntry[] = entryDrafts
      .filter((e) => e.label.trim() && e.templateId)
      .map((e) => ({
        id: e._id,
        label: e.label.trim(),
        templateId: e.templateId,
        replaceStepId: e.mode === 'REPLACE' && e.replaceStepId ? e.replaceStepId : undefined,
        offsetDays: e.mode === 'ADDITIVE' && e.offsetDays !== '' ? Number(e.offsetDays) : undefined,
      }))
    onSave({
      id: module?.id,
      name: name.trim(),
      studyName: studyName.trim(),
      studyInfoMarkdown: studyInfoMarkdown.trim(),
      entries,
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isCreate ? t('journey.research.createModule') : t('journey.research.editModule')}
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 0.5 }}>
          <Stack direction="row" gap={2}>
            <TextField
              label={t('journey.template.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              required
              fullWidth
              autoFocus
            />
            <TextField
              label={t('journey.research.studyName')}
              value={studyName}
              onChange={(e) => setStudyName(e.target.value)}
              size="small"
              required
              fullWidth
            />
          </Stack>

          <TextField
            label={t('journey.research.studyInfo')}
            value={studyInfoMarkdown}
            onChange={(e) => setStudyInfoMarkdown(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={3}
            helperText={t('journey.research.studyInfoHint')}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="overline" color="text.secondary">
              {t('journey.research.entries')}
            </Typography>
            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addEntry}>
              {t('journey.research.addEntry')}
            </Button>
          </Stack>

          {entryDrafts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('journey.research.noEntries')}
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('journey.entry.label')}</TableCell>
                  <TableCell>{t('journey.questionnaire')}</TableCell>
                  <TableCell>{t('journey.research.entryMode')}</TableCell>
                  <TableCell>{t('journey.research.entryModeValue')}</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {entryDrafts.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell>
                      <TextField
                        value={e.label}
                        onChange={(ev) => updateEntry(e._id, 'label', ev.target.value)}
                        size="small"
                        variant="standard"
                        placeholder="Dag 14"
                        sx={{ minWidth: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        options={qtOptions}
                        value={qtOptions.find((q) => q.id === e.templateId) ?? null}
                        getOptionLabel={(o) => o.name}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, val) => updateEntry(e._id, 'templateId', val?.id ?? '')}
                        size="small"
                        sx={{ minWidth: 160 }}
                        renderInput={(params) => (
                          <TextField {...params} size="small" variant="standard" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={e.mode}
                        onChange={(_, v) => {
                          if (v) updateEntry(e._id, 'mode', v as EntryMode)
                        }}
                      >
                        <ToggleButton value="REPLACE" sx={{ fontSize: 10, py: 0.25, px: 1 }}>
                          {t('journey.research.replaces')}
                        </ToggleButton>
                        <ToggleButton value="ADDITIVE" sx={{ fontSize: 10, py: 0.25, px: 1 }}>
                          {t('journey.research.additive')}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell>
                      {e.mode === 'REPLACE' ? (
                        <TextField
                          value={e.replaceStepId}
                          onChange={(ev) => updateEntry(e._id, 'replaceStepId', ev.target.value)}
                          size="small"
                          variant="standard"
                          placeholder="step-id"
                          sx={{ minWidth: 100 }}
                          helperText={t('journey.research.replaceStepHint')}
                        />
                      ) : (
                        <TextField
                          value={e.offsetDays}
                          type="number"
                          onChange={(ev) =>
                            updateEntry(
                              e._id,
                              'offsetDays',
                              ev.target.value !== '' ? Number(ev.target.value) : '',
                            )
                          }
                          size="small"
                          variant="standard"
                          label={t('journey.entry.offsetDays')}
                          sx={{ width: 80 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => deleteEntry(e._id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid} disableElevation>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

interface Props {
  researchModules: ResearchModule[] | null
  loading: boolean
  questionnaires: QuestionnaireTemplate[] | null
  onDelete: (id: string, name: string) => void
  onSave: (m: Omit<ResearchModule, 'id' | 'createdAt'> & { id?: string }) => void
}

export default function ResearchModulesTab({
  researchModules,
  loading,
  questionnaires,
  onDelete,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [editTarget, setEditTarget] = useState<ResearchModule | null | undefined>(null)

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setEditTarget(undefined)}
        >
          {t('journey.research.createModule')}
        </Button>
      </Stack>

      {!researchModules?.length ? (
        <Typography color="text.secondary">{t('journey.editor.noModules')}</Typography>
      ) : (
        <Stack gap={1.5}>
          {researchModules.map((rm) => (
            <Accordion key={rm.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, pr: 1 }}>
                  <ScienceIcon color="secondary" fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {rm.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('journey.study')}: {rm.studyName}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${rm.entries.length} ${t('journey.entries')}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                  <Tooltip title={t('journey.research.editModule')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTarget(rm)
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(rm.id, rm.name)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('journey.step')}</TableCell>
                      <TableCell>{t('journey.type')}</TableCell>
                      <TableCell>{t('journey.questionnaire')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rm.entries.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {entry.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {entry.replaceStepId ? (
                            <Chip
                              label={`${t('journey.research.replaces')} ${entry.replaceStepId}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          ) : (
                            <Chip
                              label={`${t('journey.research.additive')} (day ${entry.offsetDays})`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{entry.templateId}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {editTarget !== null && (
        <ModuleEditorDialog
          module={editTarget ?? undefined}
          questionnaires={questionnaires ?? []}
          onSave={(data) => {
            onSave(data)
            setEditTarget(null)
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  )
}
