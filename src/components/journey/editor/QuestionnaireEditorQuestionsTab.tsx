import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Select,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useTranslation } from 'react-i18next'
import type { Question } from '@/api/schemas'

interface Props {
  questions: Question[]
  addQuestion: () => void
  updateQuestion: <K extends keyof Question>(id: string, field: K, value: Question[K]) => void
  deleteQuestion: (id: string) => void
}

export default function QuestionnaireEditorQuestionsTab({
  questions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
}: Props) {
  const { t } = useTranslation()

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={addQuestion} variant="outlined">
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
                      {(['SCALE', 'BOOLEAN', 'TEXT', 'SELECT', 'NUMBER'] as const).map((tp) => (
                        <MenuItem key={tp} value={tp}>
                          {t(`questionType.${tp}`)}
                        </MenuItem>
                      ))}
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
                        onClick={() => updateQuestion(q.id, 'label', { ...q.label, en: '' })}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateQuestion(q.id, 'required', e.target.checked)
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => deleteQuestion(q.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}
