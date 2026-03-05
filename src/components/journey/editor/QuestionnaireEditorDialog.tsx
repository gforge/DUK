import React, { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useTranslation } from 'react-i18next'
import type { QuestionnaireTemplate, Question } from '@/api/schemas'

const mkId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)

interface ScoringRowDraft {
  _id: string
  outputKey: string
  formula: 'SUM' | 'AVERAGE' | 'MAX' | 'DIRECT'
  inputKeys: string
  scale: number | ''
}

interface Props {
  template?: QuestionnaireTemplate
  onSave: (t: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}

function initQuestions(template?: QuestionnaireTemplate): Question[] {
  return template?.questions ?? []
}

function initScoringRows(template?: QuestionnaireTemplate): ScoringRowDraft[] {
  return (
    template?.scoringRules.map((r) => ({
      _id: mkId(),
      outputKey: r.outputKey,
      formula: r.formula,
      inputKeys: r.inputKeys.join(', '),
      scale: r.scale ?? '',
    })) ?? []
  )
}

export default function QuestionnaireEditorDialog({ template, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isCreate = !template
  const [tab, setTab] = useState(0)
  const [name, setName] = useState(template?.name ?? '')
  const [questions, setQuestions] = useState<Question[]>(initQuestions(template))
  const [scoringRows, setScoringRows] = useState<ScoringRowDraft[]>(initScoringRows(template))

  const questionKeys = questions.map((q) => q.key)

  // ── Question helpers ─────────────────────────────────────────────────────────

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: mkId(),
        key: '',
        type: 'SCALE',
        label: { sv: '' },
        required: true,
        min: 0,
        max: 10,
      },
    ])
  }

  const updateQuestion = <K extends keyof Question>(id: string, field: K, value: Question[K]) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  // ── Scoring rule helpers ─────────────────────────────────────────────────────

  const addScoringRow = () => {
    setScoringRows((prev) => [
      ...prev,
      { _id: mkId(), outputKey: '', formula: 'SUM', inputKeys: '', scale: '' },
    ])
  }

  const updateScoringRow = <K extends keyof ScoringRowDraft>(
    id: string,
    field: K,
    value: ScoringRowDraft[K],
  ) => {
    setScoringRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)))
  }

  const deleteScoringRow = (id: string) => {
    setScoringRows((prev) => prev.filter((r) => r._id !== id))
  }

  // ── Validation & save ────────────────────────────────────────────────────────

  const isValid = name.trim() !== ''

  const handleSave = () => {
    if (!isValid) return
    const scoringRules = scoringRows
      .filter((r) => r.outputKey.trim() && r.inputKeys.trim())
      .map((r) => ({
        outputKey: r.outputKey.trim(),
        formula: r.formula,
        inputKeys: r.inputKeys
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        scale: r.scale !== '' ? Number(r.scale) : undefined,
      }))

    const cleanedQuestions: Question[] = questions
      .filter((q) => q.key.trim() && Object.values(q.label).some((v) => v.trim()))
      .map((q) => ({
        ...q,
        key: q.key.trim(),
        label: Object.fromEntries(
          Object.entries(q.label)
            .map(([k, v]) => [k, v.trim()] as [string, string])
            .filter(([, v]) => v),
        ),
        options: q.type === 'SELECT' && q.options?.length ? q.options : undefined,
        min: q.type === 'SCALE' || q.type === 'NUMBER' ? q.min : undefined,
        max: q.type === 'SCALE' || q.type === 'NUMBER' ? q.max : undefined,
      }))

    onSave({
      id: template?.id,
      name: name.trim(),
      questions: cleanedQuestions,
      scoringRules,
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isCreate ? t('journey.editor.createQuestionnaire') : t('journey.editor.editQuestionnaire')}
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <Stack gap={2} sx={{ mt: 0.5 }}>
          <TextField
            label={t('journey.qTemplate.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            required
            sx={{ maxWidth: 440 }}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={t('journey.qTemplate.questions')} />
              <Tab label={t('journey.qTemplate.scoringRules')} />
            </Tabs>
          </Box>

          {/* ── Questions tab ──────────────────────────────────────────────── */}
          {tab === 0 && (
            <Box>
              <Stack direction="row" justifyContent="flex-end" mb={1}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addQuestion}
                  variant="outlined"
                >
                  {t('journey.qTemplate.addQuestion')}
                </Button>
              </Stack>
              {questions.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  {t('journey.qTemplate.noQuestions')}
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('journey.qTemplate.questionKey')}</TableCell>
                      <TableCell>{t('journey.qTemplate.questionType')}</TableCell>
                      <TableCell>{t('journey.qTemplate.questionText')}</TableCell>
                      <TableCell>{t('journey.qTemplate.minMax')}</TableCell>
                      <TableCell>{t('journey.qTemplate.questionRequired')}</TableCell>
                      <TableCell sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>
                          <TextField
                            value={q.key}
                            onChange={(e) => updateQuestion(q.id, 'key', e.target.value)}
                            size="small"
                            variant="standard"
                            placeholder="PNRS_1"
                            sx={{ minWidth: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                            <Select
                              value={q.type}
                              onChange={(e) =>
                                updateQuestion(q.id, 'type', e.target.value as Question['type'])
                              }
                            >
                              {(['SCALE', 'BOOLEAN', 'TEXT', 'SELECT', 'NUMBER'] as const).map(
                                (tp) => (
                                  <MenuItem key={tp} value={tp}>
                                    {t(`questionType.${tp}`)}
                                  </MenuItem>
                                ),
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Stack gap={0.5}>
                            {Object.entries(q.label.sv != null ? q.label : { sv: '' }).map(
                              ([lang, text]) => (
                                <Stack key={lang} direction="row" alignItems="center" gap={0.5}>
                                  <Chip
                                    label={lang.toUpperCase()}
                                    size="small"
                                    sx={{ fontSize: 10, height: 20, px: 0 }}
                                  />
                                  <TextField
                                    value={text}
                                    onChange={(e) =>
                                      updateQuestion(q.id, 'label', {
                                        ...q.label,
                                        [lang]: e.target.value,
                                      })
                                    }
                                    size="small"
                                    variant="standard"
                                    placeholder="Smärta nu (0–10)"
                                    sx={{ minWidth: 140 }}
                                  />
                                  {Object.keys(q.label).length > 1 && (
                                    <Tooltip title={t('journey.qTemplate.removeLang')}>
                                      <IconButton
                                        size="small"
                                        aria-label={t('journey.qTemplate.removeLang')}
                                        onClick={() => {
                                          const updated = { ...q.label }
                                          delete updated[lang]
                                          updateQuestion(q.id, 'label', updated)
                                        }}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Stack>
                              ),
                            )}
                            {!('en' in q.label) && (
                              <Button
                                size="small"
                                variant="text"
                                sx={{
                                  fontSize: 11,
                                  py: 0,
                                  px: 0.5,
                                  alignSelf: 'flex-start',
                                  minWidth: 0,
                                }}
                                onClick={() =>
                                  updateQuestion(q.id, 'label', { ...q.label, en: '' })
                                }
                              >
                                + EN
                              </Button>
                            )}
                          </Stack>
                          {q.type === 'SELECT' && (
                            <TextField
                              value={q.options?.map((o) => o.value).join(', ') ?? ''}
                              onChange={(e) =>
                                updateQuestion(
                                  q.id,
                                  'options',
                                  e.target.value
                                    .split(',')
                                    .map((v) => ({ value: v.trim(), label: { sv: v.trim() } }))
                                    .filter((o) => o.value),
                                )
                              }
                              size="small"
                              variant="standard"
                              helperText={t('journey.qTemplate.optionsHint')}
                              sx={{ minWidth: 160, mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {(q.type === 'SCALE' || q.type === 'NUMBER') && (
                            <Stack direction="row" gap={0.5}>
                              <TextField
                                value={q.min ?? ''}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    'min',
                                    e.target.value !== '' ? Number(e.target.value) : undefined,
                                  )
                                }
                                label="min"
                                type="number"
                                size="small"
                                variant="standard"
                                sx={{ width: 55 }}
                              />
                              <TextField
                                value={q.max ?? ''}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    'max',
                                    e.target.value !== '' ? Number(e.target.value) : undefined,
                                  )
                                }
                                label="max"
                                type="number"
                                size="small"
                                variant="standard"
                                sx={{ width: 55 }}
                              />
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={q.required}
                            onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteQuestion(q.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* ── Scoring rules tab ──────────────────────────────────────────── */}
          {tab === 1 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  {t('journey.qTemplate.scoringHint', { keys: questionKeys.join(', ') || '—' })}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addScoringRow}
                  variant="outlined"
                >
                  {t('journey.qTemplate.addScoringRule')}
                </Button>
              </Stack>
              {scoringRows.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  {t('journey.qTemplate.noScoringRules')}
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('journey.qTemplate.outputKey')}</TableCell>
                      <TableCell>{t('journey.qTemplate.formula')}</TableCell>
                      <TableCell>{t('journey.qTemplate.inputKeys')}</TableCell>
                      <TableCell>{t('journey.qTemplate.scale')}</TableCell>
                      <TableCell sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scoringRows.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>
                          <TextField
                            value={r.outputKey}
                            onChange={(e) => updateScoringRow(r._id, 'outputKey', e.target.value)}
                            size="small"
                            variant="standard"
                            placeholder="OSS.total"
                            sx={{ minWidth: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" variant="standard" sx={{ minWidth: 95 }}>
                            <Select
                              value={r.formula}
                              onChange={(e) =>
                                updateScoringRow(
                                  r._id,
                                  'formula',
                                  e.target.value as ScoringRowDraft['formula'],
                                )
                              }
                            >
                              {(['SUM', 'AVERAGE', 'MAX', 'DIRECT'] as const).map((f) => (
                                <MenuItem key={f} value={f}>
                                  {f}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={r.inputKeys}
                            onChange={(e) => updateScoringRow(r._id, 'inputKeys', e.target.value)}
                            size="small"
                            variant="standard"
                            placeholder="key1, key2"
                            helperText={t('journey.qTemplate.inputKeysHint')}
                            sx={{ minWidth: 160 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={r.scale}
                            onChange={(e) =>
                              updateScoringRow(
                                r._id,
                                'scale',
                                e.target.value !== '' ? Number(e.target.value) : '',
                              )
                            }
                            type="number"
                            size="small"
                            variant="standard"
                            placeholder="48"
                            sx={{ width: 60 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteScoringRow(r._id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
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
