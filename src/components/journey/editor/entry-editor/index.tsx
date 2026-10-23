import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import MergeTypeIcon from '@mui/icons-material/MergeType'
import {
  Autocomplete,
  Box,
  ButtonBase,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { QuestionnaireTemplate } from '@/api/schemas'
import { tokens } from '@/theme'

export interface AliasRow {
  _id: string
  raw: string
  alias: string
  label: string
}

interface Props {
  selectedQT: QuestionnaireTemplate | null
  aliasRows: AliasRow[]
  onAdd: (suggestedRaw?: string) => void
  onUpdate: (id: string, field: 'raw' | 'alias' | 'label', value: string) => void
  onDelete: (id: string) => void
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const GRID = { display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr 32px', gap: 1 } as const
const chipSx = {
  font: 'inherit',
  fontSize: 12,
  fontFamily: MONO,
  px: 1,
  py: '3px',
  borderRadius: '12px',
  border: `1px dashed ${tokens.textMuted}`,
  bgcolor: 'background.paper',
  color: tokens.text2,
  '&:hover': { borderColor: tokens.primary, color: tokens.primary },
  '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 1 },
} as const

/** Score alias table for a journey step: metric → alias (+ display name). */
export function ScoreAliasEditor({ selectedQT, aliasRows, onAdd, onUpdate, onDelete }: Props) {
  const { t } = useTranslation()
  const metrics = selectedQT?.scoringRules.map((r) => r.outputKey) ?? []
  const suggestions = metrics.filter((m) => !aliasRows.some((row) => row.raw === m))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
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
        <MergeTypeIcon sx={{ fontSize: 18, color: tokens.textSecondary }} />
        {t('journey.editor.stepDrawer.scoreAliases')}
      </Typography>
      <Typography sx={{ m: 0, fontSize: 13, color: tokens.textSecondary, lineHeight: 1.5 }}>
        {t('journey.editor.stepDrawer.aliasHelp')}
      </Typography>

      {aliasRows.length > 0 && (
        <>
          <Box sx={{ ...GRID, fontSize: 12, fontWeight: 600, color: tokens.textSecondary }}>
            <span>{t('journey.editor.stepDrawer.aliasMetric')}</span>
            <span>{t('journey.editor.stepDrawer.aliasName')}</span>
            <span>{t('journey.editor.stepDrawer.aliasLabel')}</span>
            <span />
          </Box>
          {aliasRows.map((row) => (
            <Box key={row._id} sx={{ ...GRID, alignItems: 'center' }}>
              <Autocomplete
                freeSolo
                disableClearable
                options={metrics}
                value={row.raw}
                onInputChange={(_, v) => onUpdate(row._id, 'raw', v)}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    slotProps={{
                      ...params.slotProps,
                      htmlInput: {
                        ...params.slotProps.htmlInput,
                        'aria-label': t('journey.editor.stepDrawer.aliasMetric'),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { bgcolor: tokens.greyFill },
                      '& input': { fontFamily: MONO, fontSize: 12 },
                    }}
                  />
                )}
              />
              <TextField
                value={row.alias}
                onChange={(e) => onUpdate(row._id, 'alias', e.target.value)}
                size="small"
                slotProps={{
                  htmlInput: { 'aria-label': t('journey.editor.stepDrawer.aliasName') },
                }}
                sx={{ '& input': { fontFamily: MONO, fontSize: 12 } }}
              />
              <TextField
                value={row.label}
                onChange={(e) => onUpdate(row._id, 'label', e.target.value)}
                size="small"
                slotProps={{
                  htmlInput: { 'aria-label': t('journey.editor.stepDrawer.aliasLabel') },
                }}
                sx={{ '& input': { fontSize: 13 } }}
              />
              <Tooltip title={t('journey.editor.stepDrawer.removeAlias')}>
                <IconButton
                  size="small"
                  onClick={() => onDelete(row._id)}
                  aria-label={t('journey.editor.stepDrawer.removeAlias')}
                  sx={{ color: tokens.textSecondary, borderRadius: 1.5 }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: 13 }}>
        <Box component="span" sx={{ color: tokens.textSecondary }}>
          {t('journey.editor.stepDrawer.addLabel')}
        </Box>
        {suggestions.map((m) => (
          <ButtonBase key={m} onClick={() => onAdd(m)} sx={chipSx}>
            + {m}
          </ButtonBase>
        ))}
        {/* Without unused metrics, add a blank row for a free-text metric */}
        {suggestions.length === 0 && (
          <ButtonBase onClick={() => onAdd()} sx={{ ...chipSx, fontFamily: 'inherit', gap: 0.25 }}>
            <AddIcon sx={{ fontSize: 14 }} />
            {t('journey.editor.stepDrawer.addAlias')}
          </ButtonBase>
        )}
      </Box>
    </Box>
  )
}
