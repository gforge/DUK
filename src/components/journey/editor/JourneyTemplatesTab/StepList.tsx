import ArticleIcon from '@mui/icons-material/Article'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RepeatIcon from '@mui/icons-material/Repeat'
import { Box, ButtonBase, IconButton, Link, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import type {
  InstructionTemplate,
  JourneyTemplateEntry,
  JourneyTemplateInstruction,
  QuestionnaireTemplate,
} from '@/api/schemas'
import { useOffsetFormat } from '@/hooks/useOffsetFormat'
import { tokens } from '@/theme'
import { JourneyIcon } from '@/utils'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

function MiniTag({
  label,
  variant,
  icon,
  title,
}: {
  readonly label: string
  readonly variant: 'clinical' | 'admin'
  readonly icon?: React.ReactNode
  readonly title?: string
}) {
  return (
    <Box
      component="span"
      title={title}
      sx={{
        fontSize: 11,
        fontWeight: 600,
        px: 0.75,
        py: '1px',
        borderRadius: 1,
        bgcolor: variant === 'clinical' ? tokens.clinicalBg : tokens.greyFill,
        color: variant === 'clinical' ? tokens.clinicalFg : tokens.text2,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        '& svg': { fontSize: 12 },
      }}
    >
      {icon}
      {label}
    </Box>
  )
}

interface Props {
  readonly entries: JourneyTemplateEntry[]
  readonly instructionsByEntry: Map<string, JourneyTemplateInstruction[]>
  /** Instructions shown on their own when the template has no steps. */
  readonly looseInstructions: JourneyTemplateInstruction[]
  readonly customEntryIds: Set<string>
  readonly questionnaires: Map<string, QuestionnaireTemplate>
  readonly instructionTemplates: Map<string, InstructionTemplate>
  readonly onEditEntry: (entry: JourneyTemplateEntry) => void
  readonly onEditInstructions: () => void
  readonly onRemoveInstruction: (instrId: string) => void
}

export function StepList({
  entries,
  instructionsByEntry,
  looseInstructions,
  customEntryIds,
  questionnaires,
  instructionTemplates,
  onEditEntry,
  onEditInstructions,
  onRemoveInstruction,
}: Props) {
  const { t } = useTranslation()
  const formatOffset = useOffsetFormat()
  const [openInstr, setOpenInstr] = useState<string | null>(null)

  const dayLabel = (d: number) =>
    d === 0 ? t('journey.editor.browser.atStart') : formatOffset(d).label

  const renderInstruction = (instr: JourneyTemplateInstruction, indent: boolean) => {
    const it = instructionTemplates.get(instr.instructionTemplateId)
    const title = it?.name ?? instr.instructionTemplateId
    const label = instr.label || title
    const open = openInstr === instr.id
    const spanText =
      instr.endDayOffset !== undefined
        ? t('journey.editor.browser.instructionSpan', {
            start: dayLabel(instr.startDayOffset),
            end: dayLabel(instr.endDayOffset).toLowerCase(),
          })
        : t('journey.editor.browser.instructionFrom', {
            start: dayLabel(instr.startDayOffset).toLowerCase(),
          })
    return (
      <Box
        key={instr.id}
        sx={{
          mx: 1.75,
          ml: indent ? { xs: 1.75, sm: 8 } : 1.75,
          mb: 1.25,
          borderLeft: `3px solid ${tokens.instructionBorder}`,
          bgcolor: tokens.instructionBg,
          borderRadius: '0 8px 8px 0',
        }}
      >
        <ButtonBase
          onClick={() => setOpenInstr(open ? null : instr.id)}
          aria-expanded={open}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'left',
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: '0 8px 8px 0',
            '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: -2 },
          }}
        >
          <Box component="span" sx={{ color: tokens.instructionFg, display: 'flex' }}>
            {instr.icon ? (
              <JourneyIcon icon={instr.icon} sx={{ fontSize: 16 }} />
            ) : (
              <ArticleIcon sx={{ fontSize: 16 }} />
            )}
          </Box>
          <Box component="span" sx={{ fontWeight: 500, fontSize: 14 }}>
            {label}
          </Box>
          <Box component="span" sx={{ fontSize: 12, color: tokens.textSecondary }}>
            {spanText}
          </Box>
          <Box
            component="span"
            sx={{
              ml: 'auto',
              color: tokens.textSecondary,
              display: 'flex',
              '& svg': { fontSize: 18 },
            }}
          >
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </ButtonBase>
        {open && (
          <Box
            sx={{
              pt: 0.5,
              pr: 2,
              pb: 1.75,
              pl: 4.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
              lineHeight: 1.5,
              maxWidth: '75ch',
            }}
          >
            <Typography component="strong" sx={{ fontWeight: 700, fontSize: 15 }}>
              {title}
            </Typography>
            <Box
              sx={{
                color: tokens.text2,
                '& p': { my: 0.5 },
                '& ul, & ol': { my: 0.5, pl: 2.5 },
                '& li': { my: 0.25 },
                '& h1, & h2, & h3, & h4': { fontSize: 14, fontWeight: 700, mt: 1, mb: 0.5 },
                '& blockquote': {
                  m: 0,
                  pl: 1.5,
                  borderLeft: `2px solid ${tokens.instructionBorder}`,
                },
              }}
            >
              {it?.content ? (
                <ReactMarkdown>{it.content}</ReactMarkdown>
              ) : (
                <Typography color="text.disabled">{t('journey.instructionFallback')}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, fontSize: 13 }}>
              <Link
                underline="hover"
                component="button"
                type="button"
                onClick={onEditInstructions}
                sx={{ fontWeight: 500 }}
              >
                {t('journey.editor.browser.editInstruction')}
              </Link>
              <Link
                underline="hover"
                component="button"
                type="button"
                color="error"
                onClick={() => onRemoveInstruction(instr.id)}
                sx={{ fontWeight: 500 }}
              >
                {t('journey.editor.browser.removeInstruction')}
              </Link>
            </Box>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 2.5, overflow: 'hidden' }}>
      {entries.length === 0 && (
        <Typography sx={{ p: 2, color: tokens.textSecondary }}>
          {t('journey.editor.browser.noSteps')}
        </Typography>
      )}
      {entries.length === 0 && looseInstructions.length > 0 && (
        <Box sx={{ pt: 0.5 }}>{looseInstructions.map((i) => renderInstruction(i, false))}</Box>
      )}
      {entries.map((entry, idx) => {
        const qt = entry.templateId ? questionnaires.get(entry.templateId) : undefined
        const aliases = Object.entries(entry.scoreAliases ?? {})
        const when =
          entry.offsetDays === 0
            ? t('journey.editor.browser.atStart')
            : entry.offsetDays < 14
              ? formatOffset(entry.offsetDays).label
              : t('journey.editor.browser.stepDay', {
                  when: formatOffset(entry.offsetDays).label,
                  day: entry.offsetDays,
                })
        return (
          <Box
            key={entry.id}
            sx={{ borderBottom: idx < entries.length - 1 ? `1px solid ${tokens.rowDivider}` : 0 }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '36px minmax(0,1fr) 40px',
                  md: '36px minmax(160px,1.2fr) minmax(160px,1fr) minmax(0,1fr) 40px',
                },
                gap: 1.75,
                alignItems: 'center',
                px: 1.75,
                py: 1.5,
                '&:hover': { bgcolor: tokens.headerBg },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: tokens.selectedBg,
                  color: tokens.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <JourneyIcon icon={entry.icon ?? 'Assignment'} sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexWrap: 'wrap',
                  }}
                >
                  {entry.label}
                  {customEntryIds.has(entry.id) && (
                    <MiniTag label={t('journey.editor.browser.custom')} variant="clinical" />
                  )}
                  {entry.recurrenceIntervalDays !== undefined && (
                    <MiniTag
                      label={t('journey.editor.browser.recurring')}
                      variant="admin"
                      icon={<RepeatIcon />}
                      title={t('journey.editor.browser.recurringEvery', {
                        count: entry.recurrenceIntervalDays,
                      })}
                    />
                  )}
                </Box>
                <Box component="span" sx={{ fontSize: 13, color: tokens.textSecondary }}>
                  {when} · {t('journey.editor.browser.windowDays', { count: entry.windowDays })}
                </Box>
              </Box>
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  flexDirection: 'column',
                  gap: 0.25,
                  minWidth: 0,
                }}
              >
                {entry.templateId ? (
                  <>
                    <Box component="span" sx={{ fontSize: 13 }}>
                      {qt?.name ?? entry.templateId}
                    </Box>
                    <Box
                      component="code"
                      sx={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted }}
                    >
                      {entry.templateId}
                    </Box>
                  </>
                ) : (
                  <Box component="span" sx={{ fontSize: 13, color: tokens.textMuted }}>
                    {t('journey.editor.browser.noForm')}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.75, flexWrap: 'wrap' }}>
                {aliases.map(([raw, alias]) => (
                  <Tooltip key={raw} title={`${entry.scoreAliasLabels?.[alias] ?? alias} (${raw})`}>
                    <Box
                      component="code"
                      tabIndex={0}
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
                        px: 0.75,
                        py: '2px',
                        borderRadius: 1,
                        bgcolor: tokens.greyFill,
                        color: tokens.text2,
                      }}
                    >
                      {alias}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              <Tooltip title={t('journey.editor.browser.editStep')}>
                <IconButton
                  size="small"
                  onClick={() => onEditEntry(entry)}
                  aria-label={`${t('journey.editor.browser.editStep')}: ${entry.label}`}
                  sx={{ color: tokens.textSecondary, borderRadius: 1.5 }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            {(instructionsByEntry.get(entry.id) ?? []).map((i) => renderInstruction(i, true))}
          </Box>
        )
      })}
    </Box>
  )
}
