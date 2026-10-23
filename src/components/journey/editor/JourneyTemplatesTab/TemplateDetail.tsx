import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventIcon from '@mui/icons-material/Event'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PeopleIcon from '@mui/icons-material/People'
import RouteIcon from '@mui/icons-material/Route'
import SyncIcon from '@mui/icons-material/Sync'
import { Box, Button, ButtonBase, IconButton, Link, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateEntry,
  JourneyTemplateInstruction,
  QuestionnaireTemplate,
} from '@/api/schemas'
import { Tag } from '@/components/common'
import { tokens } from '@/theme'

import { StepList } from './StepList'
import type { TemplateGroup } from './templateBrowser'
import {
  attachInstructions,
  computeCustomisation,
  getPhases,
  resolveGroup,
  shortName,
  sortedEntries,
  sortedInstructions,
} from './templateBrowser'
import { TemplateTimeline } from './TemplateTimeline'

interface Props {
  readonly template: JourneyTemplate
  readonly templates: JourneyTemplate[]
  readonly groups: TemplateGroup[]
  readonly patientCount: number
  readonly questionnaires: Map<string, QuestionnaireTemplate>
  readonly instructionTemplates: Map<string, InstructionTemplate>
  readonly onSelect: (template: JourneyTemplate) => void
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly onDerive: () => void
  readonly onSync: () => void
  readonly onEditInstructions: () => void
  readonly onRemoveInstruction: (instrId: string) => void
  readonly onAddEntry: () => void
  readonly onEditEntry: (entry: JourneyTemplateEntry) => void
}

const outlinedButtonSx = {
  fontWeight: 600,
  px: 1.5,
  py: 0.875,
  borderRadius: 2,
  borderColor: tokens.inputBorder,
  color: tokens.text,
  bgcolor: 'background.paper',
  '& .MuiButton-startIcon svg': { fontSize: 16 },
} as const

const iconButtonSx = { color: tokens.textSecondary, borderRadius: 1.5, p: 0.75 } as const

function SectionHeading({ children }: { readonly children: React.ReactNode }) {
  return (
    <Typography component="h3" sx={{ m: 0, fontSize: 15, fontWeight: 700 }}>
      {children}
    </Typography>
  )
}

export function TemplateDetail({
  template,
  templates,
  groups,
  patientCount,
  questionnaires,
  instructionTemplates,
  onSelect,
  onEdit,
  onDelete,
  onDerive,
  onSync,
  onEditInstructions,
  onRemoveInstruction,
  onAddEntry,
  onEditEntry,
}: Props) {
  const { t } = useTranslation()
  const byId = useMemo(() => new Map(templates.map((tpl) => [tpl.id, tpl])), [templates])
  const parent = template.parentTemplateId ? byId.get(template.parentTemplateId) : undefined
  const children = templates.filter((tpl) => tpl.parentTemplateId === template.id)
  const phases = getPhases(template, groups)
  const group = resolveGroup(template, byId)
  const entries = sortedEntries(template)
  const instructions = sortedInstructions(template)
  const instructionsByEntry = attachInstructions(entries, instructions)
  const { customEntryIds, customInstructionIds } = computeCustomisation(template, parent)

  const instructionName = (instr: JourneyTemplateInstruction) =>
    instr.label ||
    instructionTemplates.get(instr.instructionTemplateId)?.name ||
    instr.instructionTemplateId

  const changeParts = [
    customInstructionIds.size > 0
      ? t('journey.editor.browser.customInstructions', { count: customInstructionIds.size })
      : null,
    customEntryIds.size > 0
      ? t('journey.editor.browser.customSteps', { count: customEntryIds.size })
      : null,
  ].filter(Boolean)
  const changeSummary =
    changeParts.length > 0 ? changeParts.join(', ') : t('journey.editor.browser.noCustomisations')

  const meta = [
    {
      icon: <AssignmentIcon />,
      text: t('journey.editor.browser.stepCount', { count: template.entries.length }),
    },
    {
      icon: <ArticleIcon />,
      text: t('journey.editor.browser.instructionCount', { count: template.instructions.length }),
    },
    {
      icon: <PeopleIcon />,
      text:
        patientCount > 0
          ? t('journey.editor.browser.usedByPatients', { count: patientCount })
          : t('journey.editor.browser.notInUse'),
    },
    {
      icon: <EventIcon />,
      text: t('journey.editor.browser.referenceDate', { label: template.referenceDateLabel }),
    },
  ]

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${tokens.border}`,
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.75,
        minWidth: 0,
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: tokens.selectedBg,
            color: tokens.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RouteIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
            {template.name}
          </Typography>
          {template.description && (
            <Typography
              sx={{
                m: 0,
                color: tokens.text2,
                maxWidth: '70ch',
                lineHeight: 1.5,
                textWrap: 'pretty',
              }}
            >
              {template.description}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              color: tokens.textSecondary,
              fontSize: 13,
              mt: 0.5,
            }}
          >
            {meta.map((m) => (
              <Box
                key={m.text}
                component="span"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '& svg': { fontSize: 15 } }}
              >
                {m.icon}
                {m.text}
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ForkRightIcon />}
            onClick={onDerive}
            sx={outlinedButtonSx}
          >
            {t('journey.editor.browser.deriveNew')}
          </Button>
          <Tooltip title={t('journey.editor.editTemplate')}>
            <IconButton
              onClick={onEdit}
              aria-label={t('journey.editor.editTemplate')}
              sx={iconButtonSx}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('journey.editor.browser.deleteTemplate')}>
            <IconButton
              onClick={onDelete}
              aria-label={t('journey.editor.browser.deleteTemplate')}
              sx={{ ...iconButtonSx, '&:hover': { color: tokens.danger } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Derived-from banner ── */}
      {template.parentTemplateId && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
            bgcolor: tokens.bg,
            border: `1px solid ${tokens.border}`,
            borderRadius: 2,
            px: 1.75,
            py: 1.25,
          }}
        >
          <Box component="span" sx={{ color: tokens.textSecondary, display: 'flex' }}>
            <ForkRightIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box component="span">
            {t('journey.editor.browser.derivedFrom')}{' '}
            {parent ? (
              <Link
                underline="hover"
                component="button"
                type="button"
                onClick={() => onSelect(parent)}
                sx={{
                  fontWeight: 600,
                  fontSize: 'inherit',
                  verticalAlign: 'baseline',
                  color: tokens.text,
                }}
              >
                {parent.name}
              </Link>
            ) : (
              <strong>?</strong>
            )}{' '}
            · {changeSummary}
          </Box>
          {parent && (
            <Link
              underline="hover"
              component="button"
              type="button"
              onClick={onSync}
              sx={{
                ml: 'auto',
                fontWeight: 500,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <SyncIcon sx={{ fontSize: 16 }} />
              {t('journey.editor.syncFromParent')}
            </Link>
          )}
        </Box>
      )}

      {/* ── Derived children ── */}
      {children.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: tokens.text2,
            fontSize: 13,
            flexWrap: 'wrap',
          }}
        >
          <Box component="span" sx={{ color: tokens.textSecondary, display: 'flex' }}>
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </Box>
          {t('journey.editor.browser.childrenNotice')}
          {children.map((c) => (
            <Tag key={c.id} label={c.name} variant="admin" onClick={() => onSelect(c)} />
          ))}
        </Box>
      )}

      {/* ── Care pathway phases ── */}
      {phases.length > 1 && (
        <Box
          component="nav"
          aria-label={t('journey.editor.browser.carePathway')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', fontSize: 13 }}
        >
          <Box component="span" sx={{ color: tokens.textSecondary, mr: 0.5 }}>
            {t('journey.editor.browser.carePathway')}
          </Box>
          {phases.map((ph, i) => {
            const current = ph.id === template.id
            return (
              <React.Fragment key={ph.id}>
                {i > 0 && (
                  <Box component="span" aria-hidden sx={{ color: tokens.textMuted }}>
                    →
                  </Box>
                )}
                <ButtonBase
                  onClick={() => onSelect(ph)}
                  aria-current={current ? 'step' : undefined}
                  sx={{
                    font: 'inherit',
                    px: 1.25,
                    py: '3px',
                    borderRadius: '12px',
                    bgcolor: current ? tokens.primary : tokens.greyFill,
                    color: current ? tokens.paper : tokens.text2,
                    fontWeight: current ? 600 : 400,
                    '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 2 },
                  }}
                >
                  {ph.phaseOrder}. {shortName(ph, group)}
                </ButtonBase>
              </React.Fragment>
            )
          })}
        </Box>
      )}

      {/* ── Timeline ── */}
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <SectionHeading>{t('journey.editor.browser.timeline')}</SectionHeading>
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: 12,
              color: tokens.textSecondary,
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tokens.primary }} />
            {t('journey.editor.browser.legendForm')}
          </Box>
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: 12,
              color: tokens.textSecondary,
            }}
          >
            <Box
              sx={{ width: 16, height: 8, borderRadius: '2px', bgcolor: tokens.instructionBorder }}
            />
            {t('journey.editor.browser.legendInstruction')}
          </Box>
        </Box>
        <Box
          sx={{
            border: `1px solid ${tokens.rowDivider}`,
            borderRadius: 2.5,
            pt: 2,
            px: 1,
            pb: 1,
            overflowX: 'auto',
          }}
        >
          <TemplateTimeline
            entries={entries}
            instructions={instructions}
            instructionName={instructionName}
          />
        </Box>
      </Box>

      {/* ── Steps ── */}
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1 }}>
            <SectionHeading>{t('journey.editor.browser.stepsHeading')}</SectionHeading>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArticleIcon />}
            onClick={onEditInstructions}
            sx={outlinedButtonSx}
          >
            {t('journey.editor.addInstruction')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAddEntry}
            sx={outlinedButtonSx}
          >
            {t('journey.editor.addEntry')}
          </Button>
        </Box>
        <StepList
          entries={entries}
          instructionsByEntry={instructionsByEntry}
          looseInstructions={entries.length === 0 ? instructions : []}
          customEntryIds={customEntryIds}
          questionnaires={questionnaires}
          instructionTemplates={instructionTemplates}
          onEditEntry={onEditEntry}
          onEditInstructions={onEditInstructions}
          onRemoveInstruction={onRemoveInstruction}
        />
      </Box>
    </Box>
  )
}
