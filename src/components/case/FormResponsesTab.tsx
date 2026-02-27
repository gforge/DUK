import React, { useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  CircularProgress,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import { format } from 'date-fns'

interface FormResponsesTabProps {
  caseId: string
}

export default function FormResponsesTab({ caseId }: FormResponsesTabProps) {
  const { t } = useTranslation()
  const {
    data: responses,
    loading,
    error,
  } = useApi(() => client.getFormResponses(caseId), [caseId])
  const { data: templates } = useApi(() => client.getQuestionnaireTemplates(), [])

  if (loading) return <CircularProgress />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!responses || responses.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {t('case.noForms')}
      </Typography>
    )
  }

  const templateMap = new Map(templates?.map((t) => [t.id, t]) ?? [])

  const sortedResponses = [...responses].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )

  return (
    <Stack gap={1}>
      {sortedResponses.map((resp) => {
        const template = templateMap.get(resp.templateId)
        return (
          <Accordion
            key={resp.id}
            variant="outlined"
            defaultExpanded={sortedResponses.indexOf(resp) === 0}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`form-${resp.id}-content`}
              id={`form-${resp.id}-header`}
            >
              <Stack direction="row" gap={2} alignItems="center" width="100%" flexWrap="wrap">
                <Typography variant="subtitle2" fontWeight={600}>
                  {template?.name ?? resp.templateId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('case.submittedAt')}: {format(new Date(resp.submittedAt), 'dd MMM yyyy HH:mm')}
                </Typography>
                {/* Scores */}
                {Object.entries(resp.scores).map(([key, val]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${val}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small" aria-label={`form responses for ${template?.name}`}>
                <TableBody>
                  {Object.entries(resp.answers).map(([key, value]) => {
                    const question = template?.questions.find((q) => q.key === key)
                    return (
                      <TableRow key={key}>
                        <TableCell
                          sx={{ fontWeight: 500, width: '50%', borderBottom: 'none', py: 0.5 }}
                        >
                          {question ? question.label['sv'] || key : key}
                        </TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>
                          <AnswerValue value={value} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Stack>
  )
}

function AnswerValue({ value }: { value: string | number | boolean }) {
  const { t } = useTranslation()
  if (typeof value === 'boolean') {
    return (
      <Chip
        label={value ? t('common.yes') : t('common.no')}
        size="small"
        color={value ? 'success' : 'default'}
        variant="outlined"
      />
    )
  }
  return <Typography variant="body2">{String(value)}</Typography>
}
