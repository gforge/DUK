import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import type {
  InstructionTemplate,
  JourneyTemplateEntry,
  QuestionnaireTemplate,
} from '@/api/schemas'

import { ScoreAliasEditor } from '../entry-editor'
import { InstructionMode, useEntryEditor } from '../useEntryEditor'

interface Props {
  entry?: JourneyTemplateEntry
  questionnaires: QuestionnaireTemplate[]
  instructionTemplates: InstructionTemplate[]
  onSave: (entry: JourneyTemplateEntry) => void
  onClose: () => void
}

export function EntryEditorDialog({
  entry,
  questionnaires,
  instructionTemplates,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const isCreate = !entry

  const {
    label,
    setLabel,
    stepKey,
    setStepKey,
    stepKeyLocked,
    setStepKeyLocked,
    offsetDays,
    setOffsetDays,
    windowDays,
    setWindowDays,
    windowDaysManuallySet,
    setWindowDaysManuallySet,
    dashboardCategory,
    setDashboardCategory,
    templateId,
    setTemplateId,
    aliasRows,
    handleAddAlias,
    handleUpdateAlias,
    handleDeleteAlias,
    instructionMode,
    setInstructionMode,
    instructionTemplateId,
    setInstructionTemplateId,
    instructionText,
    setInstructionText,
    recurringEnabled,
    setRecurringEnabled,
    recurrenceIntervalDays,
    setRecurrenceIntervalDays,
    selectedQT,
    qtOptions,
    itOptions,
    selectedIT,
    isValid,
    handleSave: computeSave,
    slugify,
    suggestWindowDays,
  } = useEntryEditor(entry, questionnaires, instructionTemplates)

  const handleSave = () => {
    const saved = computeSave()
    if (saved) onSave(saved)
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
              sx={{ width: 120 }}
              required
            />
            <TextField
              label={t('journey.entry.windowDays')}
              type="number"
              value={windowDays}
              onChange={(e) => {
                const v = e.target.value === '' ? '' : Number(e.target.value)
                setWindowDays(v)
                setWindowDaysManuallySet(true)
              }}
              size="small"
              sx={{ width: 120 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('journey.entry.dashboardCategory')}</InputLabel>
              <Select
                value={dashboardCategory}
                label={t('journey.entry.dashboardCategory')}
                onChange={(e) => setDashboardCategory(e.target.value)}
              >
                <MenuItem value="CONTROL">
                  {t('dashboardCategory.CONTROL' as any) as string}
                </MenuItem>
                <MenuItem value="ACUTE">{t('dashboardCategory.ACUTE' as any) as string}</MenuItem>
                <MenuItem value="SUBACUTE">
                  {t('dashboardCategory.SUBACUTE' as any) as string}
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('journey.entry.stepKey')}
              value={stepKey}
              onChange={(e) => {
                setStepKey(e.target.value)
                setStepKeyLocked(true)
              }}
              size="small"
              sx={{ minWidth: 180 }}
              helperText={t('journey.entry.stepKeyHint')}
              placeholder={t('journey.entry.stepKeyPlaceholder')}
            />
          </Stack>

          {/* ── Form selection ── */}
          <Autocomplete
            options={[{ id: '', name: `— ${t('journey.entry.noForm')}` }, ...qtOptions]}
            getOptionLabel={(o) => o.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('journey.entry.questionnaire' as any) as string}
                size="small"
              />
            )}
            value={templateId ? { id: templateId, name: selectedQT?.name ?? '' } : null}
            onChange={(_, v) => setTemplateId(v?.id ?? '')}
            sx={{ maxWidth: 320 }}
          />

          {/* show details checkbox */}
          {selectedQT && (
            <FormControlLabel
              control={<Switch checked={!!selectedQT.questions.length} disabled />}
              label={t('journey.entry.showFormDetails', { count: selectedQT.questions.length })}
            />
          )}

          {/* ── Score aliases ── */}
          <ScoreAliasEditor
            selectedQT={selectedQT}
            aliasRows={aliasRows}
            onAdd={handleAddAlias}
            onUpdate={handleUpdateAlias}
            onDelete={handleDeleteAlias}
          />

          {/* ── Instructions ── */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('journey.entry.instruction')}
            </Typography>
            <ToggleButtonGroup
              value={instructionMode}
              exclusive
              onChange={(_, v) => v && setInstructionMode(v as InstructionMode)}
            >
              <ToggleButton value="NONE">{t('journey.entry.instructionNone')}</ToggleButton>
              <ToggleButton value="TEMPLATE">
                {t('journey.entry.instructionFromTemplate')}
              </ToggleButton>
              <ToggleButton value="FREETEXT">{t('journey.entry.instructionFreetext')}</ToggleButton>
            </ToggleButtonGroup>
            {instructionMode === 'TEMPLATE' && (
              <FormControl size="small" sx={{ mt: 1, minWidth: 240 }}>
                <InputLabel>{t('journey.entry.instructionTemplate' as any) as string}</InputLabel>
                <Select
                  value={instructionTemplateId}
                  label={t('journey.entry.instructionTemplate' as any) as string}
                  onChange={(e) => setInstructionTemplateId(e.target.value)}
                >
                  {itOptions.map((it) => (
                    <MenuItem key={it.id} value={it.id}>
                      {it.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {instructionMode === 'TEMPLATE' && selectedIT && (
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: 'primary.light',
                  '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
                }}
              >
                <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>
                  {t('journey.entry.instruction')}
                </Typography>
                <ReactMarkdown>{selectedIT.content}</ReactMarkdown>
              </Box>
            )}
            {instructionMode === 'FREETEXT' && (
              <TextField
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* ── Recurrence ── */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={recurringEnabled}
                  onChange={(e) => setRecurringEnabled(e.target.checked)}
                />
              }
              label={t('journey.entry.recurring' as any) as string}
            />
            {recurringEnabled && (
              <TextField
                label={t('journey.entry.recurrenceIntervalDays' as any) as string}
                type="number"
                value={recurrenceIntervalDays}
                onChange={(e) =>
                  setRecurrenceIntervalDays(e.target.value === '' ? '' : Number(e.target.value))
                }
                size="small"
                sx={{ width: 120 }}
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
