import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { FormResponse, QuestionnaireTemplate } from '@/api/schemas'
import { tokens } from '@/theme'

type AnswerValueType = FormResponse['answers'][string]

interface FormAnswersTableProps {
  readonly response: FormResponse
  readonly template?: QuestionnaireTemplate
  /** Earlier response to the same questionnaire; adds a comparison column when given. */
  readonly previous?: FormResponse
  readonly previousLabel?: string
}

/** Question/answer table for one form response, optionally side by side with an earlier one. */
export default function FormAnswersTable({
  response,
  template,
  previous,
  previousLabel,
}: FormAnswersTableProps) {
  const { t } = useTranslation()
  const cellSx = { borderBottom: 'none', py: 0.5 } as const
  return (
    <Table size="small" aria-label={template?.name ?? response.templateId}>
      {previous && (
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, color: tokens.textSecondary, fontSize: 12 }}>
              {t('case.question')}
            </TableCell>
            <TableCell sx={{ ...cellSx, color: tokens.textSecondary, fontSize: 12 }}>
              {t('case.latestAnswer')}
            </TableCell>
            <TableCell sx={{ ...cellSx, color: tokens.textSecondary, fontSize: 12 }}>
              {previousLabel ?? t('case.previousAnswer')}
            </TableCell>
          </TableRow>
        </TableHead>
      )}
      <TableBody>
        {Object.entries(response.answers).map(([key, value]) => {
          const question = template?.questions.find((q) => q.key === key)
          const prev = previous?.answers[key]
          const changed = previous !== undefined && prev !== undefined && prev !== value
          return (
            <TableRow key={key}>
              <TableCell sx={{ ...cellSx, fontWeight: 500, width: previous ? '55%' : '50%' }}>
                {question ? question.label['sv'] || key : key}
              </TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: changed ? 700 : 400 }}>
                <AnswerValue value={value} />
              </TableCell>
              {previous && (
                <TableCell sx={{ ...cellSx, color: tokens.textSecondary }}>
                  {prev === undefined ? '–' : <AnswerValue value={prev} />}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function AnswerValue({ value }: { readonly value: AnswerValueType }) {
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
  return (
    <Typography variant="body2" component="span" sx={{ fontWeight: 'inherit' }}>
      {String(value)}
    </Typography>
  )
}
