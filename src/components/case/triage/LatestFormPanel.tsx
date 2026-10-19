import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, ButtonBase, Chip, Collapse, Stack, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import FormAnswersTable from '@/components/case/FormResponsesTab/FormAnswersTable'
import { useApi } from '@/hooks/useApi'
import { tokens } from '@/theme'

import { cardSx } from './styles'
import { useDateLocale } from './useTriageDirectory'

interface LatestFormPanelProps {
  readonly caseId: string
}

/**
 * Collapsed-by-default card in the triage tab that shows the case's most recent form response
 * on demand, so the triager can check the answers without leaving the triage form.
 * Answers are compared with the previous response to the same questionnaire when one exists.
 */
export default function LatestFormPanel({ caseId }: LatestFormPanelProps) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const [open, setOpen] = React.useState(false)
  const { data: responses } = useApi(() => client.getFormResponses(caseId), [caseId])
  const { data: templates } = useApi(() => client.getQuestionnaireTemplates(), [])

  const sorted = React.useMemo(
    () =>
      [...(responses ?? [])].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [responses],
  )
  const latest = sorted[0]
  if (!latest) return null

  const previous = sorted.find((r) => r.id !== latest.id && r.templateId === latest.templateId)
  const template = templates?.find((tpl) => tpl.id === latest.templateId)
  const fmt = (iso: string, pattern: string) => format(new Date(iso), pattern, { locale })
  const contentId = `latest-form-${latest.id}`

  return (
    <Box sx={{ ...cardSx, overflow: 'hidden' }}>
      <ButtonBase
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          textAlign: 'left',
          px: 2.5,
          py: 1.75,
          gap: 1.5,
          '&:hover': { bgcolor: tokens.rowHover },
          '&.Mui-focusVisible': { outline: `2px solid ${tokens.primary}`, outlineOffset: -2 },
        }}
      >
        <AssignmentOutlinedIcon sx={{ color: tokens.textSecondary }} fontSize="small" />
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: 15 }}>
              {t('triage.latestForm')}
            </Typography>
            <Typography sx={{ fontSize: 14, color: tokens.text2 }}>
              {template?.name ?? latest.templateId}
            </Typography>
            <Typography sx={{ fontSize: 13, color: tokens.textSecondary }}>
              · {t('case.submittedAt')} {fmt(latest.submittedAt, 'd MMM yyyy HH:mm')}
            </Typography>
          </Stack>
          {Object.keys(latest.scores).length > 0 && (
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {Object.entries(latest.scores).map(([key, val]) => {
                const prev = previous?.scores[key]
                return (
                  <Chip
                    key={key}
                    size="small"
                    color="info"
                    variant="outlined"
                    label={
                      prev === undefined
                        ? `${key}: ${val}`
                        : t('triage.scoreWithPrevious', { key, value: val, previous: prev })
                    }
                  />
                )
              })}
            </Stack>
          )}
        </Stack>
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: tokens.primary,
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? t('triage.hideAnswers') : t('triage.showAnswers')}
          <ExpandMoreIcon
            fontSize="small"
            sx={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </Typography>
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Box
          id={contentId}
          sx={{ px: 2.5, pb: 2, pt: 1, borderTop: `1px solid ${tokens.rowDivider}` }}
        >
          <FormAnswersTable
            response={latest}
            template={template}
            previous={previous}
            previousLabel={
              previous
                ? t('triage.previousFormLabel', { date: fmt(previous.submittedAt, 'd MMM') })
                : undefined
            }
          />
          {sorted.length > 1 && (
            <Typography sx={{ mt: 1.5, fontSize: 13, color: tokens.textSecondary }}>
              {t('triage.moreFormsHint', { count: sorted.length - 1 })}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}
