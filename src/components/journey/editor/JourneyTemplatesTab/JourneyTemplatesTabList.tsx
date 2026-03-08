import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import RouteIcon from '@mui/icons-material/Route'
import SyncIcon from '@mui/icons-material/Sync'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate, JourneyTemplateEntry } from '@/api/schemas'
import { useOffsetFormat } from '@/hooks/useOffsetFormat'

interface Props {
  journeyTemplates: JourneyTemplate[]
  parentName: (id?: string) => string | undefined
  onDelete: (id: string, name: string) => void
  setSyncTarget: (jt: JourneyTemplate) => void
  setEditTarget: (jt: JourneyTemplate | undefined) => void
  setDeriveTarget: (jt: JourneyTemplate) => void
  setEntryEditState: React.Dispatch<
    React.SetStateAction<{
      template: JourneyTemplate
      entry?: JourneyTemplateEntry
    } | null>
  >
  handleSaveEntry: (template: JourneyTemplate, saved: JourneyTemplateEntry) => void
  handleDeleteEntry: (template: JourneyTemplate, entryId: string) => void
}

export function JourneyTemplatesTabList({
  journeyTemplates,
  parentName,
  onDelete,
  setSyncTarget,
  setEditTarget,
  setDeriveTarget,
  setEntryEditState: _setEntryEditState,
  handleSaveEntry: _handleSaveEntry,
  handleDeleteEntry: _handleDeleteEntry,
}: Props) {
  const { t } = useTranslation()
  const formatOffset = useOffsetFormat()

  return (
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
                      <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 160 }}>
                        {(() => {
                          const f = formatOffset(entry.offsetDays)
                          return (
                            <Stack>
                              <Tooltip title={f.tooltip || ''}>
                                <Typography variant="body2" fontWeight={600}>
                                  {f.label}
                                </Typography>
                              </Tooltip>
                              <Typography variant="caption" color="text.secondary">
                                {entry.windowDays !== undefined ? `±${entry.windowDays}` : ''}
                              </Typography>
                            </Stack>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{entry.templateId}</Typography>
                      </TableCell>
                      <TableCell>{/* score aliases column left intentionally minimal */}</TableCell>
                      <TableCell sx={{ width: 80 }}>
                        <Stack direction="row" gap={0.5} justifyContent="flex-end">
                          <Tooltip title={t('common.edit')}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                _setEntryEditState({ template: jt, entry })
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
                                _handleDeleteEntry(jt, entry.id)
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}
