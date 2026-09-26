import AssignmentIcon from '@mui/icons-material/Assignment'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import {
  Box,
  Button,
  ButtonBase,
  Drawer,
  IconButton,
  Link,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  InstructionTemplate,
  JourneyTemplateEntry,
  QuestionnaireTemplate,
} from '@/api/schemas'
import { ScoreAliasEditor } from '@/components/journey/editor/entry-editor'
import type { OffsetUnit } from '@/components/journey/editor/offsetUnits'
import { inferOffsetUnit, UNIT_DAYS } from '@/components/journey/editor/offsetUnits'
import { useEntryEditor } from '@/components/journey/editor/useEntryEditor'
import { tokens } from '@/theme'
import { JOURNEY_ICON_OPTIONS, JourneyIcon } from '@/utils'

const UNIT_KEY = {
  days: 'journey.editor.stepDrawer.unitDays',
  weeks: 'journey.editor.stepDrawer.unitWeeks',
  months: 'journey.editor.stepDrawer.unitMonths',
  years: 'journey.editor.stepDrawer.unitYears',
} as const

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const fieldLabelSx = { fontSize: 12, fontWeight: 600, color: tokens.text2 } as const
const sectionSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
  borderTop: `1px solid ${tokens.rowDivider}`,
  pt: 2.5,
} as const

function FieldLabel({
  htmlFor,
  children,
}: {
  readonly htmlFor?: string
  readonly children: React.ReactNode
}) {
  return (
    <Box component="label" htmlFor={htmlFor} sx={fieldLabelSx}>
      {children}
    </Box>
  )
}

interface Props {
  entry?: JourneyTemplateEntry
  /** Name of the template the step belongs to (drawer subtitle). */
  templateName: string
  questionnaires: QuestionnaireTemplate[]
  instructionTemplates: InstructionTemplate[]
  onSave: (entry: JourneyTemplateEntry) => void
  onClose: () => void
  /** Delete an existing step (the caller confirms). */
  onDelete?: (entry: JourneyTemplateEntry) => void
}

/** Right-side drawer for creating or editing one step of a journey template. */
export function EntryEditorDrawer({
  entry,
  templateName,
  questionnaires,
  instructionTemplates,
  onSave,
  onClose,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation()
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
    recurringEnabled,
    setRecurringEnabled,
    recurrenceIntervalDays,
    setRecurrenceIntervalDays,
    icon,
    setIcon,
    selectedQT,
    isValid,
    handleSave: computeSave,
    slugify,
    suggestWindowDays,
  } = useEntryEditor(entry, questionnaires, instructionTemplates)

  const [unit, setUnit] = useState<OffsetUnit>(() =>
    entry ? inferOffsetUnit(entry.offsetDays) : 'days',
  )
  const [amount, setAmount] = useState<number | ''>(() =>
    entry ? entry.offsetDays / UNIT_DAYS[inferOffsetUnit(entry.offsetDays)] : '',
  )
  const [editingStepKey, setEditingStepKey] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  const applyOffset = (nextAmount: number | '', nextUnit: OffsetUnit) => {
    const days = nextAmount === '' ? '' : Math.round(nextAmount * UNIT_DAYS[nextUnit])
    setOffsetDays(days)
    if (!windowDaysManuallySet && days !== '') setWindowDays(suggestWindowDays(days))
  }

  const handleSave = () => {
    const saved = computeSave()
    if (saved) onSave(saved)
  }

  const displayedStepKey = stepKey || slugify(label)
  const questionText = (q: QuestionnaireTemplate['questions'][number]) =>
    q.label[i18n.language] ?? q.label.sv ?? Object.values(q.label)[0] ?? q.key

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      // Above the app shell's top bar
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      slotProps={{
        paper: {
          sx: { width: 'min(520px, 100%)', display: 'flex', flexDirection: 'column' },
          'aria-labelledby': 'entry-drawer-title',
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          px: 2.5,
          py: 2.25,
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography
            id="entry-drawer-title"
            component="h2"
            sx={{ m: 0, fontSize: 18, fontWeight: 700 }}
          >
            {isCreate ? t('journey.editor.addEntry') : t('journey.editor.editEntry')}
          </Typography>
          <Typography sx={{ color: tokens.textSecondary, fontSize: 13 }}>{templateName}</Typography>
        </Box>
        <Tooltip title={t('common.close')}>
          <IconButton
            onClick={onClose}
            aria-label={t('common.close')}
            sx={{ color: tokens.textSecondary, borderRadius: 1.5 }}
          >
            <ClearIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Body ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <FieldLabel htmlFor="entry-label">{t('journey.editor.stepDrawer.label')} *</FieldLabel>
            <TextField
              id="entry-label"
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
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FieldLabel htmlFor={editingStepKey ? 'entry-step-key' : undefined}>
              {t('journey.editor.stepDrawer.stepKey')}
            </FieldLabel>
            {editingStepKey ? (
              <TextField
                id="entry-step-key"
                value={stepKey}
                onChange={(e) => {
                  setStepKey(e.target.value)
                  setStepKeyLocked(true)
                }}
                size="small"
                placeholder={t('journey.entry.stepKeyPlaceholder')}
                sx={{ '& input': { fontFamily: MONO, fontSize: 13 } }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="code"
                  sx={{
                    fontFamily: MONO,
                    fontSize: 13,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: tokens.greyFill,
                    color: displayedStepKey ? tokens.text : tokens.textMuted,
                  }}
                >
                  {displayedStepKey || '—'}
                </Box>
                <Link
                  underline="hover"
                  component="button"
                  type="button"
                  onClick={() => setEditingStepKey(true)}
                  sx={{ fontSize: 13, fontWeight: 500 }}
                >
                  {t('journey.editor.stepDrawer.change')}
                </Link>
              </Box>
            )}
            <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
              {t('journey.editor.stepDrawer.stepKeyHelp')}
            </Typography>
          </Box>

          <Box
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <FieldLabel htmlFor="entry-offset">
                {t('journey.editor.stepDrawer.timeAfterStart')} *
              </FieldLabel>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <TextField
                  id="entry-offset"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value === '' ? '' : Number(e.target.value)
                    setAmount(v)
                    applyOffset(v, unit)
                  }}
                  size="small"
                  required
                  sx={{ width: 80, flexShrink: 0 }}
                />
                <TextField
                  select
                  value={unit}
                  onChange={(e) => {
                    const u = e.target.value as OffsetUnit
                    setUnit(u)
                    applyOffset(amount, u)
                  }}
                  size="small"
                  fullWidth
                  slotProps={{
                    htmlInput: { 'aria-label': t('journey.editor.stepDrawer.timeAfterStart') },
                  }}
                >
                  {(Object.keys(UNIT_KEY) as OffsetUnit[]).map((u) => (
                    <MenuItem key={u} value={u}>
                      {t(UNIT_KEY[u])}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              {unit !== 'days' && offsetDays !== '' && (
                <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
                  = {t('journey.offsetFormat.days', { count: offsetDays })}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <FieldLabel htmlFor="entry-window">
                {t('journey.editor.stepDrawer.responseWindow')}
              </FieldLabel>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                <Box component="span" sx={{ color: tokens.textSecondary }}>
                  ±
                </Box>
                <TextField
                  id="entry-window"
                  type="number"
                  value={windowDays}
                  onChange={(e) => {
                    setWindowDays(e.target.value === '' ? '' : Number(e.target.value))
                    setWindowDaysManuallySet(true)
                  }}
                  size="small"
                  sx={{ width: 80 }}
                />
                <Box component="span" sx={{ color: tokens.textSecondary }}>
                  {t('journey.editor.stepDrawer.unitDays')}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <FieldLabel htmlFor="entry-category">
              {t('journey.editor.stepDrawer.showIn')}
            </FieldLabel>
            <TextField
              id="entry-category"
              select
              value={dashboardCategory}
              onChange={(e) => setDashboardCategory(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="ACUTE">{t('category.ACUTE')}</MenuItem>
              <MenuItem value="SUBACUTE">{t('category.SUBACUTE')}</MenuItem>
              <MenuItem value="CONTROL">{t('category.CONTROL')}</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* ── Form ── */}
        <Box component="section" sx={sectionSx}>
          <Typography
            component="h3"
            sx={{
              m: 0,
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <AssignmentIcon sx={{ fontSize: 18, color: tokens.textSecondary }} />
            {t('journey.editor.stepDrawer.form')}
          </Typography>
          <TextField
            select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value)
              setShowQuestions(false)
            }}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { 'aria-label': t('journey.editor.stepDrawer.form') },
              select: { displayEmpty: true },
            }}
          >
            <MenuItem value="">{t('journey.editor.stepDrawer.noForm')}</MenuItem>
            {questionnaires.map((q) => (
              <MenuItem key={q.id} value={q.id}>
                {q.name} ·{' '}
                {t('journey.editor.stepDrawer.questionCount', { count: q.questions.length })}
              </MenuItem>
            ))}
          </TextField>
          {selectedQT && (
            <Box sx={{ display: 'flex', gap: 1.5, fontSize: 13, color: tokens.textSecondary }}>
              <span>
                {t('journey.editor.stepDrawer.questionCount', {
                  count: selectedQT.questions.length,
                })}
              </span>
              {selectedQT.questions.length > 0 && (
                <Link
                  underline="hover"
                  component="button"
                  type="button"
                  onClick={() => setShowQuestions((v) => !v)}
                  aria-expanded={showQuestions}
                  sx={{ fontWeight: 500, fontSize: 13 }}
                >
                  {showQuestions
                    ? t('journey.editor.stepDrawer.hideQuestions')
                    : t('journey.editor.stepDrawer.showQuestions')}
                </Link>
              )}
            </Box>
          )}
          {selectedQT && showQuestions && (
            <Box
              component="ol"
              sx={{
                m: 0,
                pl: 2.5,
                fontSize: 13,
                color: tokens.text2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {selectedQT.questions.map((q) => (
                <li key={q.id}>{questionText(q)}</li>
              ))}
            </Box>
          )}
        </Box>

        {/* ── Score aliases ── */}
        <Box component="section" sx={sectionSx}>
          <ScoreAliasEditor
            selectedQT={selectedQT}
            aliasRows={aliasRows}
            onAdd={handleAddAlias}
            onUpdate={handleUpdateAlias}
            onDelete={handleDeleteAlias}
          />
        </Box>

        {/* ── Recurrence ── */}
        <Box component="section" sx={sectionSx}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Box
                component="label"
                htmlFor="entry-recurring"
                sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}
              >
                <RepeatIcon sx={{ fontSize: 18, color: tokens.textSecondary }} />
                {t('journey.editor.stepDrawer.recurring')}
              </Box>
              <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
                {t('journey.editor.stepDrawer.recurringHelp')}
              </Typography>
            </Box>
            <Switch
              id="entry-recurring"
              checked={recurringEnabled}
              onChange={(e) => setRecurringEnabled(e.target.checked)}
              size="small"
            />
          </Box>
          {recurringEnabled && (
            <TextField
              label={t('journey.editor.stepDrawer.recurrenceInterval')}
              type="number"
              value={recurrenceIntervalDays}
              onChange={(e) =>
                setRecurrenceIntervalDays(e.target.value === '' ? '' : Number(e.target.value))
              }
              size="small"
              sx={{ width: 180 }}
            />
          )}
        </Box>

        {/* ── Icon ── */}
        <Box component="section" sx={sectionSx}>
          <Typography component="h3" sx={{ m: 0, fontSize: 14, fontWeight: 700 }}>
            {t('journey.editor.stepDrawer.icon')}
          </Typography>
          <Box
            role="radiogroup"
            aria-label={t('journey.editor.stepDrawer.icon')}
            sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}
          >
            {JOURNEY_ICON_OPTIONS.map((opt) => {
              const selected = icon === opt.key
              return (
                <Tooltip key={opt.key} title={opt.label}>
                  <ButtonBase
                    role="radio"
                    aria-checked={selected}
                    aria-label={opt.label}
                    onClick={() => setIcon(selected ? undefined : opt.key)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      border: selected
                        ? `2px solid ${tokens.primary}`
                        : `1px solid ${tokens.inputBorder}`,
                      bgcolor: selected ? tokens.selectedBg : 'background.paper',
                      color: selected ? tokens.primary : tokens.textSecondary,
                      '&:focus-visible': {
                        outline: `2px solid ${tokens.primary}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <JourneyIcon icon={opt.key} sx={{ fontSize: 20 }} />
                  </ButtonBase>
                </Tooltip>
              )
            })}
          </Box>
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 1.75,
          borderTop: `1px solid ${tokens.border}`,
        }}
      >
        {entry && onDelete ? (
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => onDelete(entry)}
            sx={{ fontWeight: 500 }}
          >
            {t('journey.editor.stepDrawer.deleteStep')}
          </Button>
        ) : (
          <span />
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderColor: tokens.inputBorder, color: tokens.text, borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isValid}
            sx={{ borderRadius: 2 }}
          >
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
