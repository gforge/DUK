import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
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

import type { QuestionnaireTemplate, ResearchModule } from '@/api/schemas'
import ModuleEditorDialog from '@/components/journey/editor/ModuleEditorDialog'

// dialog implementation moved to ModuleEditorDialog.tsx

// ─── Main Tab ────────────────────────────────────────────────────────────────

interface Props {
  researchModules: ResearchModule[] | null
  loading: boolean
  questionnaires: QuestionnaireTemplate[] | null
  onDelete: (id: string, name: string) => void
  onSave: (m: Omit<ResearchModule, 'id' | 'createdAt'> & { id?: string }) => void
}

export function ResearchModulesTab({
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
