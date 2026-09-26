import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import SearchIcon from '@mui/icons-material/Search'
import { Box, ButtonBase, IconButton, InputBase, Tooltip } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplate } from '@/api/schemas'
import { tokens } from '@/theme'

import type { SearchHit, TemplateGroup } from './templateBrowser'
import { groupKey, shortName } from './templateBrowser'

interface Props {
  readonly groups: TemplateGroup[]
  readonly selectedId: string | null
  readonly query: string
  readonly onQueryChange: (q: string) => void
  readonly closedGroups: Set<string>
  readonly onToggleGroup: (key: string) => void
  readonly onSelect: (template: JourneyTemplate) => void
  readonly onCreate: () => void
  readonly hits: Map<string, SearchHit>
  readonly patientCounts: Map<string, number>
}

export function TemplateListAside({
  groups,
  selectedId,
  query,
  onQueryChange,
  closedGroups,
  onToggleGroup,
  onSelect,
  onCreate,
  hits,
  patientCounts,
}: Props) {
  const { t } = useTranslation()
  const searching = query.trim() !== ''

  const hitLabel = (hit: SearchHit | undefined) => {
    if (!hit || hit.kind === 'template') return null
    const key = {
      step: 'journey.editor.browser.hitStep',
      instruction: 'journey.editor.browser.hitInstruction',
      form: 'journey.editor.browser.hitForm',
      alias: 'journey.editor.browser.hitAlias',
    } as const
    return t(key[hit.kind], { label: hit.label })
  }

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      templates: searching ? g.templates.filter((tpl) => hits.has(tpl.id)) : g.templates,
    }))
    .filter((g) => g.templates.length > 0)

  return (
    <Box
      component="aside"
      aria-label={t('journey.editor.browser.templateGroups')}
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${tokens.border}`,
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: { md: 'sticky' },
        top: { md: 76 },
        maxHeight: { md: 'calc(100vh - 96px)' },
        overflowY: { md: 'auto' },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box
          component="label"
          sx={{
            flex: 1,
            height: 36,
            border: `1px solid ${tokens.inputBorder}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            px: 1.25,
            gap: 0.75,
            color: tokens.textMuted,
            bgcolor: 'background.paper',
            '&:focus-within': { borderColor: tokens.primary },
          }}
        >
          <SearchIcon sx={{ fontSize: 16 }} />
          <InputBase
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('journey.editor.browser.searchAll')}
            inputProps={{ 'aria-label': t('journey.editor.browser.searchAll') }}
            type="search"
            sx={{ flex: 1, minWidth: 0, fontSize: 13, color: tokens.text }}
          />
        </Box>
        <Tooltip title={t('journey.editor.newTemplate')}>
          <IconButton
            onClick={onCreate}
            aria-label={t('journey.editor.newTemplate')}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: tokens.primary,
              color: tokens.paper,
              '&:hover': { bgcolor: tokens.primaryDark },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {visibleGroups.map((g) => {
        const key = groupKey(g.label)
        const open = searching || !closedGroups.has(key)
        const label = g.label ?? t('journey.editor.browser.ungrouped')
        const hint = g.phased
          ? t('journey.editor.browser.phaseCount', { count: g.templates.length })
          : String(g.templates.length)
        return (
          <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <ButtonBase
              onClick={() => onToggleGroup(key)}
              aria-expanded={open}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.75,
                py: 0.5,
                fontSize: 12,
                fontWeight: 600,
                color: tokens.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                borderRadius: 1.5,
                justifyContent: 'flex-start',
                textAlign: 'left',
                '&:hover': { bgcolor: tokens.rowHover },
                '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: -2 },
              }}
            >
              {open ? (
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              )}
              <Box component="span" sx={{ flex: 1 }}>
                {label}
              </Box>
              <Box component="span" sx={{ textTransform: 'none', fontWeight: 500 }}>
                {hint}
              </Box>
            </ButtonBase>
            {open &&
              g.templates.map((tpl) => {
                const selected = tpl.id === selectedId
                const patients = patientCounts.get(tpl.id) ?? 0
                const hit = hitLabel(hits.get(tpl.id))
                return (
                  <ButtonBase
                    key={tpl.id}
                    onClick={() => onSelect(tpl)}
                    aria-current={selected ? 'true' : undefined}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      gap: 1,
                      bgcolor: selected ? tokens.selectedBg : 'transparent',
                      '&:hover': { bgcolor: selected ? tokens.selectedBg : tokens.rowHover },
                      '&:focus-visible': {
                        outline: `2px solid ${tokens.primary}`,
                        outlineOffset: -2,
                      },
                    }}
                  >
                    {tpl.parentTemplateId && (
                      <Box
                        component="span"
                        title={t('journey.editor.browser.derivedTemplate')}
                        sx={{ pl: 0.75, color: tokens.textMuted, display: 'flex', mt: '1px' }}
                      >
                        <ForkRightIcon sx={{ fontSize: 16 }} />
                      </Box>
                    )}
                    {tpl.phaseOrder !== undefined && (
                      <Box
                        component="span"
                        title={t('journey.editor.browser.phase', { n: tpl.phaseOrder })}
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: selected ? tokens.primary : tokens.segmentBg,
                          color: selected ? tokens.paper : tokens.text2,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {tpl.phaseOrder}
                      </Box>
                    )}
                    <Box
                      component="span"
                      sx={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: selected ? tokens.primaryDark : tokens.text,
                        }}
                      >
                        {shortName(tpl, g.label)}
                      </Box>
                      <Box component="span" sx={{ fontSize: 12, color: tokens.textSecondary }}>
                        {t('journey.editor.browser.stepCount', { count: tpl.entries.length })} ·{' '}
                        {patients > 0
                          ? t('journey.editor.browser.listPatients', { count: patients })
                          : t('journey.editor.browser.notInUseShort')}
                      </Box>
                      {hit && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 12,
                            color: tokens.clinicalFg,
                            bgcolor: tokens.clinicalBg,
                            borderRadius: 1,
                            px: 0.75,
                            py: '1px',
                            mt: 0.25,
                            alignSelf: 'flex-start',
                          }}
                        >
                          {hit}
                        </Box>
                      )}
                    </Box>
                  </ButtonBase>
                )
              })}
          </Box>
        )
      })}

      {searching && visibleGroups.length === 0 && (
        <Box
          sx={{ py: 2, px: 1.25, color: tokens.textSecondary, fontSize: 13, textAlign: 'center' }}
        >
          {t('journey.editor.browser.noSearchHits', { query: query.trim() })}
        </Box>
      )}
    </Box>
  )
}
