import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { ScoringRowDraft } from './questionnaireUtils'

interface Props {
  scoringRows: ScoringRowDraft[]
  questionKeys: string[]
  addScoringRow: () => void
  updateScoringRow: <K extends keyof ScoringRowDraft>(
    id: string,
    field: K,
    value: ScoringRowDraft[K],
  ) => void
  deleteScoringRow: (id: string) => void
}

export default function QuestionnaireEditorScoringTab({
  scoringRows,
  questionKeys,
  addScoringRow,
  updateScoringRow,
  deleteScoringRow,
}: Props) {
  const { t } = useTranslation()

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          {t('journey.qTemplate.scoringHint', { keys: questionKeys.join(', ') || '—' })}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addScoringRow} variant="outlined">
          {t('journey.qTemplate.addScoringRule')}
        </Button>
      </Stack>

      {scoringRows.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {t('journey.qTemplate.noScoringRules')}
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('journey.qTemplate.outputKey')}</TableCell>
              <TableCell>{t('journey.qTemplate.formula')}</TableCell>
              <TableCell>{t('journey.qTemplate.inputKeys')}</TableCell>
              <TableCell>{t('journey.qTemplate.scale')}</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {scoringRows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>
                  <TextField
                    value={r.outputKey}
                    onChange={(e) => updateScoringRow(r._id, 'outputKey', e.target.value)}
                    size="small"
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={r.formula}
                    onChange={(e) =>
                      updateScoringRow(
                        r._id,
                        'formula',
                        e.target.value as ScoringRowDraft['formula'],
                      )
                    }
                    size="small"
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={r.inputKeys}
                    onChange={(e) => updateScoringRow(r._id, 'inputKeys', e.target.value)}
                    size="small"
                    variant="standard"
                    helperText={t('journey.qTemplate.inputKeysHint')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={r.scale}
                    onChange={(e) =>
                      updateScoringRow(
                        r._id,
                        'scale',
                        e.target.value !== '' ? Number(e.target.value) : '',
                      )
                    }
                    size="small"
                    variant="standard"
                    type="number"
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => deleteScoringRow(r._id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}
