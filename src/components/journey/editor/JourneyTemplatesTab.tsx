import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RouteIcon from '@mui/icons-material/Route'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import type { JourneyTemplate } from '../../../api/schemas'

interface Props {
  journeyTemplates: JourneyTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
}

export default function JourneyTemplatesTab({ journeyTemplates, loading, onDelete }: Props) {
  const { t } = useTranslation()

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
  if (!journeyTemplates?.length)
    return <Typography color="text.secondary">{t('journey.editor.noTemplates')}</Typography>

  return (
    <Stack gap={1.5}>
      {journeyTemplates.map((jt) => (
        <Accordion key={jt.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, pr: 1 }}>
              <RouteIcon color="primary" fontSize="small" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {jt.name}
                </Typography>
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
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('journey.step')}</TableCell>
                  <TableCell>{t('journey.offsetDays')}</TableCell>
                  <TableCell>{t('journey.window')}</TableCell>
                  <TableCell>{t('journey.questionnaire')}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      {t('journey.scoreAliases')}
                      <Tooltip title={t('journey.scoreAliasesHint')}>
                        <InfoOutlinedIcon fontSize="inherit" color="action" />
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jt.entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.label}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.offsetDays}</TableCell>
                    <TableCell>±{entry.windowDays}d</TableCell>
                    <TableCell>
                      <Typography variant="caption">{entry.templateId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {Object.entries(entry.scoreAliases).map(([raw, alias]) => {
                          const label = entry.scoreAliasLabels?.[alias]
                          return (
                            <Tooltip
                              key={raw}
                              title={label ? `${t('journey.label')}: "${label}"` : ''}
                              disableHoverListener={!label}
                            >
                              <Chip
                                label={label ? `${raw} → ${alias} · ${label}` : `${raw} → ${alias}`}
                                size="small"
                                variant="outlined"
                                color={label ? 'primary' : 'default'}
                                sx={{ fontSize: 10, height: 18 }}
                              />
                            </Tooltip>
                          )
                        })}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )

  // suppress unused Paper import warning
  void Paper
}
