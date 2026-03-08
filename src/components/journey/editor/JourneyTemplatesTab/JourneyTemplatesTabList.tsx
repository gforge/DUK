import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import RepeatIcon from '@mui/icons-material/Repeat'
import RouteIcon from '@mui/icons-material/Route'
import SyncIcon from '@mui/icons-material/Sync'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Collapse,
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
import ReactMarkdown from 'react-markdown'

import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateEntry,
  JourneyTemplateInstruction,
} from '@/api/schemas'
import { useOffsetFormat } from '@/hooks/useOffsetFormat'
import { JourneyIcon } from '@/utils/journeyIcons'

interface Props {
  journeyTemplates: JourneyTemplate[]
  instructionTemplates: InstructionTemplate[]
  parentName: (id?: string) => string | undefined
  onDelete: (id: string, name: string) => void
  setSyncTarget: (jt: JourneyTemplate) => void
  setEditTarget: (jt: JourneyTemplate | undefined) => void
  setDeriveTarget: (jt: JourneyTemplate) => void
  setTemplateInstructionsTarget: (jt: JourneyTemplate) => void
  setEntryEditState: React.Dispatch<
    React.SetStateAction<{
      template: JourneyTemplate
      entry?: JourneyTemplateEntry
    } | null>
  >
  handleSaveEntry: (template: JourneyTemplate, saved: JourneyTemplateEntry) => void
  handleDeleteEntry: (template: JourneyTemplate, entryId: string) => void
  handleDeleteInstruction: (template: JourneyTemplate, instrId: string) => void
}

type MergedRow =
  | { kind: 'entry'; item: JourneyTemplateEntry }
  | { kind: 'instruction'; item: JourneyTemplateInstruction }

export function JourneyTemplatesTabList({
  journeyTemplates,
  instructionTemplates,
  parentName,
  onDelete,
  setSyncTarget,
  setEditTarget,
  setDeriveTarget,
  setTemplateInstructionsTarget,
  setEntryEditState: _setEntryEditState,
  handleSaveEntry: _handleSaveEntry,
  handleDeleteEntry: _handleDeleteEntry,
  handleDeleteInstruction: _handleDeleteInstruction,
}: Props) {
  const { t } = useTranslation()
  const formatOffset = useOffsetFormat()

  const instrNameMap = new Map(instructionTemplates.map((it) => [it.id, it.name]))
  const instrContentMap = new Map(instructionTemplates.map((it) => [it.id, it.content]))

  const [expandedInstrs, setExpandedInstrs] = React.useState<Set<string>>(new Set())
  const toggleInstrExpand = (id: string) =>
    setExpandedInstrs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const getMergedRows = (jt: JourneyTemplate): MergedRow[] => {
    const rows: MergedRow[] = [
      ...jt.entries.map((item): MergedRow => ({ kind: 'entry', item })),
      ...jt.instructions.map((item): MergedRow => ({ kind: 'instruction', item })),
    ]
    return rows.sort((a, b) => {
      const offsetA = a.kind === 'entry' ? a.item.offsetDays : a.item.startDayOffset
      const offsetB = b.kind === 'entry' ? b.item.offsetDays : b.item.startDayOffset
      if (offsetA !== offsetB) return offsetA - offsetB
      // entries before instructions at the same offset
      return a.kind === 'entry' ? -1 : 1
    })
  }

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
              {jt.instructions.length > 0 && (
                <Chip
                  label={`${jt.instructions.length} ${t('journey.editor.tabInstructions')}`}
                  size="small"
                  variant="outlined"
                />
              )}
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
              <Tooltip title={t('journey.editor.tabInstructions')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTemplateInstructionsTarget(jt)
                  }}
                >
                  <LibraryBooksIcon fontSize="small" />
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
                  {getMergedRows(jt).map((row) => {
                    if (row.kind === 'entry') {
                      const entry = row.item
                      const f = formatOffset(entry.offsetDays)
                      return (
                        <TableRow key={`entry-${entry.id}`} hover>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <JourneyIcon icon={entry.icon} fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight={600}>
                                {entry.label}
                              </Typography>
                            </Stack>
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
                            <Stack>
                              <Tooltip title={f.tooltip || ''}>
                                <Typography variant="body2" fontWeight={600}>
                                  {f.label}
                                </Typography>
                              </Tooltip>
                              <Typography variant="caption" color="text.secondary">
                                {entry.windowDays !== undefined ? `±${entry.windowDays}d` : ''}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{entry.templateId}</Typography>
                          </TableCell>
                          <TableCell />
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
                      )
                    }

                    // instruction row
                    const instr = row.item
                    const instrLabel =
                      instr.label ??
                      instrNameMap.get(instr.instructionTemplateId) ??
                      instr.instructionTemplateId
                    const instrContent = instrContentMap.get(instr.instructionTemplateId) ?? ''
                    const startF = formatOffset(instr.startDayOffset)
                    const endF =
                      instr.endDayOffset !== undefined ? formatOffset(instr.endDayOffset) : null
                    const isExpanded = expandedInstrs.has(instr.id)
                    return (
                      <React.Fragment key={`instr-${instr.id}`}>
                        <TableRow
                          hover
                          sx={{ bgcolor: 'action.hover', cursor: 'pointer' }}
                          onClick={() => toggleInstrExpand(instr.id)}
                        >
                          <TableCell sx={{ minWidth: 120 }}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <ExpandMoreIcon
                                fontSize="small"
                                color="action"
                                sx={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(-90deg)',
                                  transition: 'transform 0.15s',
                                  flexShrink: 0,
                                }}
                              />
                              <JourneyIcon icon={instr.icon} fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight={600} color="text.secondary">
                                {instrLabel}
                              </Typography>
                            </Stack>
                            <Chip
                              label={t('journey.editor.tabInstructions').replace(/s$/, '')}
                              size="small"
                              variant="outlined"
                              color="info"
                              sx={{ fontSize: 10, height: 18, mt: 0.5, ml: 3 }}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 160 }}>
                            <Stack>
                              <Tooltip title={startF.tooltip || ''}>
                                <Typography variant="body2" fontWeight={600}>
                                  {startF.label}
                                </Typography>
                              </Tooltip>
                              {endF && (
                                <Typography variant="caption" color="text.secondary">
                                  → {endF.label}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell sx={{ width: 80 }}>
                            <Stack
                              direction="row"
                              gap={0.5}
                              justifyContent="flex-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip title={t('common.edit')}>
                                <IconButton
                                  size="small"
                                  onClick={() => setTemplateInstructionsTarget(jt)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('common.delete')}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => _handleDeleteInstruction(jt, instr.id)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                            <Collapse in={isExpanded} unmountOnExit>
                              <Box
                                sx={{
                                  py: 1.5,
                                  px: 2,
                                  ml: 3,
                                  borderLeft: 2,
                                  borderColor: 'info.light',
                                  '& p': { my: 0.5, typography: 'body2' },
                                  '& ul, & ol': { my: 0.5, pl: 2.5 },
                                  '& li': { my: 0.25 },
                                }}
                              >
                                {instrContent ? (
                                  <ReactMarkdown>{instrContent}</ReactMarkdown>
                                ) : (
                                  <Typography variant="body2" color="text.disabled">
                                    {t('journey.instructionFallback')}
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}
