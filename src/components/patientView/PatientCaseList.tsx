import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import StatusChip from '../common/StatusChip'
import type { Case } from '../../api/schemas'

interface Props {
  cases: Case[] | null
  loading: boolean
  error: string | null
}

export default function PatientCaseList({ cases, loading, error }: Props) {
  const { t } = useTranslation()

  if (loading) return <CircularProgress />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!cases?.length) return <Alert severity="info">{t('patient.noCases')}</Alert>

  return (
    <Stack spacing={1}>
      {cases.map((c) => (
        <Accordion key={c.id} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
              <StatusChip status={c.status} />
              <Chip label={t(`category.${c.category}`)} size="small" variant="outlined" />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', pr: 1 }}>
                {format(new Date(c.createdAt), 'dd MMM yyyy')}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={1}>
              {c.triggers.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('patient.triggers')}:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {c.triggers.map((tr) => (
                      <Chip
                        key={tr}
                        label={t(`trigger.${tr}`)}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              {c.patientMessage ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('patient.messageFromCare')}:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {c.patientMessage}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('patient.noMessage')}
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}
