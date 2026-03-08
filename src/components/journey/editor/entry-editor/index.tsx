import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { QuestionnaireTemplate } from '@/api/schemas'

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

export function ScoreAliasEditor({ selectedQT, aliasRows, onAdd, onUpdate, onDelete }: Props) {
  const { t } = useTranslation()

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="overline" color="text.secondary">
          {t('journey.scoreAliases')}
        </Typography>
        <Tooltip title={t('journey.entry.addAlias')}>
          <IconButton size="small" onClick={() => onAdd()}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
        <Typography variant="caption">{t('journey.entry.aliasHelp')}</Typography>
      </Alert>
      {aliasRows.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('journey.entry.noAliases')}
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('journey.entry.scoreAliasRaw')}</TableCell>
              <TableCell>{t('journey.entry.scoreAliasAlias')}</TableCell>
              <TableCell>{t('journey.entry.scoreAliasLabel')}</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {aliasRows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    options={
                      selectedQT?.scoringRules.map((r: { outputKey: string }) => r.outputKey) ?? []
                    }
                    value={row.raw}
                    onInputChange={(_, v) => onUpdate(row._id, 'raw', v)}
                    size="small"
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Chip label={option} size="small" />
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        variant="standard"
                        sx={{ minWidth: 120 }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.alias}
                    onChange={(e) => onUpdate(row._id, 'alias', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.label}
                    onChange={(e) => onUpdate(row._id, 'label', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onDelete(row._id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {selectedQT && selectedQT.scoringRules.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {t('journey.entry.tapRuleToAdd' as any)}
          </Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {selectedQT.scoringRules.map((r: { outputKey: string }) => (
              <Tooltip key={r.outputKey} title={r.outputKey}>
                <Chip
                  label={r.outputKey}
                  size="small"
                  color="primary"
                  variant="outlined"
                  clickable
                  onClick={() => {
                    const alreadyExists = aliasRows.some((row) => row.raw === r.outputKey)
                    if (!alreadyExists) onAdd(r.outputKey)
                  }}
                  sx={{ fontSize: 10, height: 20 }}
                />
              </Tooltip>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
