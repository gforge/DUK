import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import type {
  JourneyTemplateEntry,
  QuestionnaireTemplate,
  InstructionTemplate,
} from '../../../api/schemas'
import { AliasRow, ScoreAliasEditor } from './entry-editor'
import { slugify } from '../../../utils/slugify'
import { suggestWindowDays } from '../../../utils/journeyUtils'

type InstructionMode = 'NONE' | 'TEMPLATE' | 'FREETEXT'

interface Props {
  entry?: JourneyTemplateEntry
  questionnaires: QuestionnaireTemplate[]
  instructionTemplates: InstructionTemplate[]
  onSave: (entry: JourneyTemplateEntry) => void
  onClose: () => void
}

const mkId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)

function entryToAliasRows(entry?: JourneyTemplateEntry): AliasRow[] {
  if (!entry) return []
  return Object.entries(entry.scoreAliases ?? {}).map(([raw, alias]) => ({
    _id: mkId(),
    raw,
    alias,
    label: entry.scoreAliasLabels?.[alias] ?? '',
  }))
}

function deriveInstructionMode(entry?: JourneyTemplateEntry): InstructionMode {
  if (!entry) return 'NONE'
  if (entry.instructionTemplateId) return 'TEMPLATE'
  if (entry.instructionText) return 'FREETEXT'
  return 'NONE'
}

export default function EntryEditorDialog({
  entry,
  questionnaires,
  instructionTemplates,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const isCreate = !entry

  const [label, setLabel] = useState(entry?.label ?? '')
  // stepKey is auto-derived from label unless the user has manually edited it
  const [stepKey, setStepKey] = useState(entry?.stepKey ?? '')
  const [stepKeyLocked, setStepKeyLocked] = useState(!!entry?.stepKey)
  const [offsetDays, setOffsetDays] = useState<number | ''>(entry?.offsetDays ?? '')
  const [windowDays, setWindowDays] = useState<number | ''>(entry?.windowDays ?? 2)
  // windowDays is auto-suggested from offsetDays when creating, unless the user
  // has manually set a different value.
  const [windowDaysManuallySet, setWindowDaysManuallySet] = useState(!!entry)
  const [dashboardCategory, setDashboardCategory] = useState<string>(
    entry?.dashboardCategory ?? 'CONTROL',
  )
  const [templateId, setTemplateId] = useState<string>(entry?.templateId ?? '')
  const [aliasRows, setAliasRows] = useState<AliasRow[]>(entryToAliasRows(entry))
  const [instructionMode, setInstructionMode] = useState<InstructionMode>(
    deriveInstructionMode(entry),
  )
  const [instructionTemplateId, setInstructionTemplateId] = useState<string>(
    entry?.instructionTemplateId ?? '',
  )
  const [instructionText, setInstructionText] = useState<string>(entry?.instructionText ?? '')
  const [recurringEnabled, setRecurringEnabled] = useState(
    entry?.recurrenceIntervalDays !== undefined,
  )
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number | ''>(
    entry?.recurrenceIntervalDays ?? '',
  )

  const selectedQT = questionnaires.find((q) => q.id === templateId) ?? null
  const qtOptions = questionnaires.map((q) => ({ id: q.id, name: q.name }))
  const itOptions = instructionTemplates.map((it) => ({ id: it.id, name: it.name }))
  const selectedIT = instructionTemplates.find((it) => it.id === instructionTemplateId) ?? null

  const isValid = label.trim() !== '' && offsetDays !== ''

  const handleAddAlias = (suggestedRaw?: string) => {
    const raw =
      suggestedRaw ||
      selectedQT?.scoringRules
        .map((r) => r.outputKey)
        .find((k) => !aliasRows.some((row) => row.raw === k)) ||
      ''
    setAliasRows((prev) => [...prev, { _id: mkId(), raw, alias: '', label: '' }])
  }

  const handleUpdateAlias = (id: string, field: 'raw' | 'alias' | 'label', value: string) => {
    setAliasRows((prev) => prev.map((row) => (row._id === id ? { ...row, [field]: value } : row)))
  }

  const handleDeleteAlias = (id: string) => {
    setAliasRows((prev) => prev.filter((row) => row._id !== id))
  }

  const handleSave = () => {
    if (!isValid) return
    const scoreAliases: Record<string, string> = {}
    const scoreAliasLabels: Record<string, string> = {}
    for (const row of aliasRows) {
      if (row.raw.trim() && row.alias.trim()) {
        scoreAliases[row.raw.trim()] = row.alias.trim()
        if (row.label.trim()) scoreAliasLabels[row.alias.trim()] = row.label.trim()
      }
    }

    const saved: JourneyTemplateEntry = {
      id: entry?.id ?? mkId(),
      label: label.trim(),
      stepKey: stepKey.trim() || undefined,
      offsetDays: Number(offsetDays),
      windowDays: windowDays !== '' ? Number(windowDays) : 2,
      order: entry?.order ?? 0,
      dashboardCategory: dashboardCategory as JourneyTemplateEntry['dashboardCategory'],
      templateId: templateId || undefined,
      scoreAliases,
      scoreAliasLabels: scoreAliasLabels,
      instructionTemplateId:
        instructionMode === 'TEMPLATE' && instructionTemplateId ? instructionTemplateId : undefined,
      instructionText:
        instructionMode === 'FREETEXT' && instructionText.trim()
          ? instructionText.trim()
          : undefined,
      recurrenceIntervalDays:
        recurringEnabled && recurrenceIntervalDays !== ''
          ? Number(recurrenceIntervalDays)
          : undefined,
    }
    onSave(saved)
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isCreate ? t('journey.editor.addEntry') : t('journey.editor.editEntry')}
      </DialogTitle>

      <DialogContent>
        <Stack gap={2.5} sx={{ mt: 0.5 }}>
          {/* ── Basic ── */}
          <Stack direction="row" gap={2}>
            <TextField
              label={t('journey.entry.label')}
              value={label}
              onChange={(e) => {
                const v = e.target.value
                setLabel(v)
                if (!stepKeyLocked) setStepKey(slugify(v))
              }}
              size="small"
              fullWidth
              required
              autoFocus
            />
            <TextField
              label={t('journey.entry.offsetDays')}
              type="number"
              value={offsetDays}
              onChange={(e) => {
                const v = e.target.value === '' ? '' : Number(e.target.value)
                setOffsetDays(v)
                if (!windowDaysManuallySet && v !== '') {
                  setWindowDays(suggestWindowDays(v as number))
                }
              }}
              size="small"
              sx={{ minWidth: 130 }}
              required
              inputProps={{ min: 0 }}
              helperText={t('journey.entry.offsetDaysHint')}
            />
            <TextField
              label={t('journey.entry.windowDays')}
              type="number"
              value={windowDays}
              onChange={(e) => {
                setWindowDays(e.target.value === '' ? '' : Number(e.target.value))
                setWindowDaysManuallySet(true)
              }}
              size="small"
              sx={{ minWidth: 110 }}
              inputProps={{ min: 0 }}
              helperText={
                !windowDaysManuallySet && offsetDays !== ''
                  ? t('journey.entry.windowDaysSuggest', {
                      n: suggestWindowDays(offsetDays as number),
                    })
                  : t('journey.entry.windowDaysHint')
              }
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t('journey.entry.dashboardCategory')}</InputLabel>
              <Select
                value={dashboardCategory}
                label={t('journey.entry.dashboardCategory')}
                onChange={(e) => setDashboardCategory(e.target.value)}
              >
                {(['ACUTE', 'SUBACUTE', 'CONTROL'] as const).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`category.${cat}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* ── Step key ── */}
          <Stack direction="row" alignItems="flex-start" gap={1} sx={{ mt: -1 }}>
            <TextField
              label={t('journey.entry.stepKey')}
              value={stepKey}
              onChange={(e) => {
                setStepKeyLocked(true)
                setStepKey(e.target.value)
              }}
              onBlur={(e) => {
                // Re-derive from label if the user clears the field
                if (!e.target.value.trim()) {
                  setStepKeyLocked(false)
                  setStepKey(slugify(label))
                }
              }}
              size="small"
              sx={{ maxWidth: 260, fontFamily: 'monospace' }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
              helperText={t('journey.entry.stepKeyHint')}
              placeholder={t('journey.entry.stepKeyPlaceholder')}
            />
            {!stepKeyLocked && stepKey && (
              <Chip label="auto" size="small" sx={{ mt: 1, opacity: 0.6 }} />
            )}
          </Stack>

          {/* ── Questionnaire ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              {t('journey.questionnaire')}
            </Typography>
            <Autocomplete
              options={[{ id: '', name: `— ${t('journey.entry.noForm')}` }, ...qtOptions]}
              value={{
                id: templateId,
                name:
                  qtOptions.find((q) => q.id === templateId)?.name ??
                  `— ${t('journey.entry.noForm')}`,
              }}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, val) => setTemplateId(val?.id ?? '')}
              renderInput={(params) => (
                <TextField {...params} size="small" label={t('journey.questionnaire')} />
              )}
              size="small"
            />
            {!templateId && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('journey.entry.noFormHint')}
              </Typography>
            )}
            {selectedQT && (
              <Accordion
                variant="outlined"
                disableGutters
                sx={{ mt: 1, '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, py: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('journey.entry.showFormDetails', { count: selectedQT.questions.length })}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>key</TableCell>
                        <TableCell>{t('journey.qTemplate.questionType')}</TableCell>
                        <TableCell>{t('journey.qTemplate.name')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedQT.questions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                            >
                              {q.key}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(`questionType.${q.type}`)}
                              size="small"
                              sx={{ fontSize: 10, height: 18 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {q.label['sv'] || q.key}
                              {(q.type === 'SCALE' || q.type === 'NUMBER') &&
                                q.min !== undefined &&
                                q.max !== undefined && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {' '}
                                    ({q.min}–{q.max})
                                  </Typography>
                                )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedQT.scoringRules.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {t('journey.entry.scoringOutputKeys')}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {selectedQT.scoringRules.map((r) => (
                          <Tooltip
                            key={r.outputKey}
                            title={`${r.formula}(${r.inputKeys.join(', ')})`}
                          >
                            <Chip
                              label={r.outputKey}
                              size="small"
                              color="primary"
                              variant="outlined"
                              clickable
                              onClick={() => {
                                const alreadyExists = aliasRows.some(
                                  (row) => row.raw === r.outputKey,
                                )
                                if (!alreadyExists)
                                  setAliasRows((prev) => [
                                    ...prev,
                                    { _id: mkId(), raw: r.outputKey, alias: '', label: '' },
                                  ])
                              }}
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {selectedQT.scoringRules.length === 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {t('journey.entry.noScoringRules')}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Box>

          {/* ── Score aliases ── */}
          {templateId && (
            <ScoreAliasEditor
              selectedQT={selectedQT}
              aliasRows={aliasRows}
              onAdd={handleAddAlias}
              onUpdate={handleUpdateAlias}
              onDelete={handleDeleteAlias}
            />
          )}
          <Divider />

          {/* ── Instruction ── */}
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {t('journey.entry.instruction')}
            </Typography>
            <ToggleButtonGroup
              value={instructionMode}
              exclusive
              size="small"
              onChange={(_, v) => {
                if (v) setInstructionMode(v)
              }}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="NONE">{t('journey.entry.instructionNone')}</ToggleButton>
              <ToggleButton value="TEMPLATE">
                {t('journey.entry.instructionFromTemplate')}
              </ToggleButton>
              <ToggleButton value="FREETEXT">{t('journey.entry.instructionFreetext')}</ToggleButton>
            </ToggleButtonGroup>

            {instructionMode === 'TEMPLATE' && (
              <>
                <Autocomplete
                  options={itOptions}
                  value={selectedIT ? { id: selectedIT.id, name: selectedIT.name } : null}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onChange={(_, val) => setInstructionTemplateId(val?.id ?? '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={t('journey.editor.instructionTemplate')}
                    />
                  )}
                  size="small"
                />
                {selectedIT && (
                  <Accordion
                    variant="outlined"
                    disableGutters
                    sx={{ mt: 1, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, py: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('journey.entry.instructionPreview')}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        sx={{
                          background: (theme) => theme.palette.grey[50],
                          p: 1.5,
                          borderRadius: 1,
                          '& p': { mt: 0, mb: 1 },
                          '& p:last-child': { mb: 0 },
                          '& h1,h2,h3,h4': {
                            mt: 1,
                            mb: 0.5,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          },
                          '& ul,ol': { pl: 2, mt: 0, mb: 1 },
                          '& li': { mb: 0.25 },
                          '& strong': { fontWeight: 600 },
                          fontSize: '0.8125rem',
                        }}
                      >
                        <ReactMarkdown>{selectedIT.content}</ReactMarkdown>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </>
            )}

            {instructionMode === 'FREETEXT' && (
              <TextField
                label={t('journey.entry.instructionFreetext')}
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                size="small"
                fullWidth
                multiline
                minRows={3}
                helperText={t('journey.entry.instructionFreetextHint')}
              />
            )}
          </Box>

          {/* ── Recurrence ── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={recurringEnabled}
                  onChange={(e) => setRecurringEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={t('journey.entry.recurrenceEnabled')}
            />
            {recurringEnabled && (
              <TextField
                label={t('journey.entry.recurrenceInterval')}
                type="number"
                value={recurrenceIntervalDays}
                onChange={(e) =>
                  setRecurrenceIntervalDays(e.target.value === '' ? '' : Number(e.target.value))
                }
                size="small"
                sx={{ mt: 1, display: 'block', maxWidth: 220 }}
                inputProps={{ min: 1 }}
              />
            )}
          </Box>
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
