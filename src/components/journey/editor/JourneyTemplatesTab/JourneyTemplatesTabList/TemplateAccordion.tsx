import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
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

import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateEntry,
  JourneyTemplateInstruction,
} from '@/api/schemas'

import { EntryRow } from './EntryRow'
import { InstructionRow } from './InstructionRow'

type MergedRow =
  | { kind: 'entry'; item: JourneyTemplateEntry }
  | { kind: 'instruction'; item: JourneyTemplateInstruction }

function getMergedRows(jt: JourneyTemplate): MergedRow[] {
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

interface Props {
  jt: JourneyTemplate
  instructionTemplates: InstructionTemplate[]
  parentName: (id?: string) => string | undefined
  onDelete: (id: string, name: string) => void
  setSyncTarget: (jt: JourneyTemplate) => void
  setEditTarget: (jt: JourneyTemplate | undefined) => void
  setDeriveTarget: (jt: JourneyTemplate) => void
  setTemplateInstructionsTarget: (jt: JourneyTemplate) => void
  setEntryEditState: React.Dispatch<
    React.SetStateAction<{ template: JourneyTemplate; entry?: JourneyTemplateEntry } | null>
  >
  handleDeleteEntry: (template: JourneyTemplate, entryId: string) => void
  handleDeleteInstruction: (template: JourneyTemplate, instrId: string) => void
}

export function TemplateAccordion({
  jt,
  instructionTemplates,
  parentName,
  onDelete,
  setSyncTarget,
  setEditTarget,
  setDeriveTarget,
  setTemplateInstructionsTarget,
  setEntryEditState,
  handleDeleteEntry,
  handleDeleteInstruction,
}: Props) {
  const { t } = useTranslation()

  const instrNameMap = new Map(instructionTemplates.map((it) => [it.id, it.name]))
  const instrContentMap = new Map(instructionTemplates.map((it) => [it.id, it.content]))

  return (
    <Accordion variant="outlined" sx={{ borderRadius: '8px !important' }}>
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
              {getMergedRows(jt).map((row) =>
                row.kind === 'entry' ? (
                  <EntryRow
                    key={`entry-${row.item.id}`}
                    jt={jt}
                    entry={row.item}
                    setEntryEditState={setEntryEditState}
                    handleDeleteEntry={handleDeleteEntry}
                  />
                ) : (
                  <InstructionRow
                    key={`instr-${row.item.id}`}
                    jt={jt}
                    instr={row.item}
                    instrName={
                      instrNameMap.get(row.item.instructionTemplateId) ??
                      row.item.instructionTemplateId
                    }
                    instrContent={instrContentMap.get(row.item.instructionTemplateId) ?? ''}
                    setTemplateInstructionsTarget={setTemplateInstructionsTarget}
                    handleDeleteInstruction={handleDeleteInstruction}
                  />
                ),
              )}
            </TableBody>
          </Table>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
