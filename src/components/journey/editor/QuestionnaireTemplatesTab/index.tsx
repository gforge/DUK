import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { QuestionnaireTemplate } from '@/api/schemas'
import { QuestionnaireEditorDialog } from '@/components/journey/editor'
import { useQuestionTypeLabel } from '@/hooks/labels'

interface Props {
  questionnaires: QuestionnaireTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onSave: (t: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string }) => void
}

export function QuestionnaireTemplatesTab({ questionnaires, loading, onDelete, onSave }: Props) {
  const { t } = useTranslation()
  const getQuestionTypeLabel = useQuestionTypeLabel()
  // null = closed, undefined = create new, QuestionnaireTemplate = edit existing
  const [editTarget, setEditTarget] = useState<QuestionnaireTemplate | null | undefined>(null)

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
          {t('journey.editor.newQuestionnaire')}
        </Button>
      </Stack>

      {!questionnaires?.length ? (
        <Typography color="text.secondary">{t('journey.editor.noQuestionnaires')}</Typography>
      ) : (
        <Stack gap={1.5}>
          {questionnaires.map((qt) => (
            <Accordion key={qt.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, pr: 1 }}>
                  <AssignmentIcon color="action" fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {qt.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {qt.id}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${qt.questions.length} ${t('journey.qTemplate.questions')}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`${qt.scoringRules.length} ${t('journey.qTemplate.scoringRules')}`}
                    size="small"
                    variant="outlined"
                  />
                  <Tooltip title={t('journey.editor.editQuestionnaire')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTarget(qt)
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
                        onDelete(qt.id, qt.name)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack gap={2}>
                  {/* Questions table */}
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      {t('journey.qTemplate.questions')}
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('journey.qTemplate.questionKey')}</TableCell>
                          <TableCell>{t('journey.qTemplate.questionType')}</TableCell>
                          <TableCell>{t('journey.qTemplate.questionLabel')}</TableCell>
                          <TableCell>{t('journey.qTemplate.questionRequired')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {qt.questions.map((q) => (
                          <TableRow key={q.id} hover>
                            <TableCell>
                              <Typography variant="caption" fontFamily="monospace">
                                {q.key}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getQuestionTypeLabel(q.type)}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: 10, height: 18 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{q.label['sv'] || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{q.required ? '✓' : '—'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  {/* Scoring rules */}
                  {qt.scoringRules.length > 0 && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {t('journey.qTemplate.scoringRules')}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.75} mt={0.5}>
                        {qt.scoringRules.map((r, i) => (
                          <Chip
                            key={i}
                            label={`${r.outputKey} = ${r.formula}(${r.inputKeys.join(', ')})`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {editTarget !== null && (
        <QuestionnaireEditorDialog
          template={editTarget ?? undefined}
          onSave={(data: any) => {
            onSave(data)
            setEditTarget(null)
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  )
}
