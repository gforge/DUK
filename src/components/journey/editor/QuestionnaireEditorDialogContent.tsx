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
import QuestionnaireEditorQuestionsTab from './QuestionnaireEditorQuestionsTab'
import QuestionnaireEditorScoringTab from './QuestionnaireEditorScoringTab'
import { mkId, initQuestions, initScoringRows, ScoringRowDraft } from './questionnaireUtils'
import { useQuestionnaireEditor } from './useQuestionnaireEditor'

interface Props {
  template?: QuestionnaireTemplate
  onSave: (t: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}

export default function QuestionnaireEditorDialog({ template, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isCreate = !template
  const {
    tab,
    setTab,
    name,
    setName,
    questions,
    scoringRows,
    questionKeys,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addScoringRow,
    updateScoringRow,
    deleteScoringRow,
    isValid,
    getSavePayload,
  } = useQuestionnaireEditor(template)

  // ── Validation & save ────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!isValid) return
    onSave({ id: template?.id, ...getSavePayload() })
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
            <QuestionnaireEditorQuestionsTab
              questions={questions}
              addQuestion={addQuestion}
              updateQuestion={updateQuestion}
              deleteQuestion={deleteQuestion}
            />
          )}

          {/* ── Scoring rules tab ──────────────────────────────────────────── */}
          {tab === 1 && (
            <QuestionnaireEditorScoringTab
              scoringRows={scoringRows}
              questionKeys={questionKeys}
              addScoringRow={addScoringRow}
              updateScoringRow={updateScoringRow}
              deleteScoringRow={deleteScoringRow}
            />
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
