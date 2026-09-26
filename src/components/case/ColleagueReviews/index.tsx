import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { Case, ColleagueReview } from '@/api/schemas'
import {
  isClinician,
  useDateLocale,
  useTriageDirectory,
} from '@/components/case/triage/useTriageDirectory'
import { Tag } from '@/components/common'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'
import { tokens } from '@/theme'

import RequestDialog from './RequestDialog'

interface Props {
  readonly caseData: Case
  readonly onChange: () => void
  /** Show the "+ Begär granskning av kollega" link. */
  readonly canRequest?: boolean
  /** Separate from the content above with a top border (aside footer). */
  readonly divided?: boolean
}

/**
 * Advisory second opinion on a triage: request from a colleague, answer as the
 * requested reviewer, withdraw as the requester. Never blocks triage.
 */
export default function ColleagueReviews({ caseData, onChange, canRequest, divided }: Props) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const { currentUser } = useRole()
  const { showSnack } = useSnack()
  const { users } = useTriageDirectory()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const reviews = caseData.colleagueReviews ?? []
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? id
  const fmt = (iso: string) => format(new Date(iso), 'd MMM HH:mm', { locale })
  const colleagues = users.filter((u) => isClinician(u) && u.id !== currentUser.id)
  const toAnswer = reviews.filter((r) => !r.respondedAt && r.reviewerUserId === currentUser.id)
  const others = reviews.filter((r) => !toAnswer.includes(r))

  if (!canRequest && reviews.length === 0) return null

  async function run(
    id: string | null,
    action: () => Promise<unknown>,
    success: string,
  ): Promise<boolean> {
    setBusyId(id)
    try {
      await action()
      showSnack(success, 'success')
      onChange()
      return true
    } catch (err) {
      showSnack(`${t('common.errorGeneric')}: ${String(err)}`, 'error')
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function request(reviewerUserId: string, question: string) {
    const ok = await run(
      null,
      () =>
        client.requestColleagueReview(
          caseData.id,
          reviewerUserId,
          question,
          currentUser.id,
          currentUser.role,
        ),
      t('triage.colleagueReview.requested'),
    )
    if (ok) setDialogOpen(false)
  }

  function renderQuestion(r: ColleagueReview) {
    return (
      <Typography
        sx={{
          fontSize: 13,
          color: r.question ? tokens.text : tokens.textMuted,
          whiteSpace: 'pre-wrap',
        }}
      >
        {r.question ?? t('triage.colleagueReview.noQuestion')}
      </Typography>
    )
  }

  return (
    <Stack
      sx={{
        gap: 1.25,
        fontSize: 13,
        ...(divided && { borderTop: `1px solid ${tokens.rowDivider}`, pt: 1.5 }),
      }}
    >
      {toAnswer.map((r) => (
        <Stack
          key={r.id}
          role="region"
          aria-label={t('triage.colleagueReview.title')}
          sx={{
            gap: 1,
            p: 1.5,
            borderRadius: '10px',
            border: `1px solid ${tokens.primary}`,
            bgcolor: tokens.selectedCardBg,
          }}
        >
          <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
            <RateReviewOutlinedIcon sx={{ fontSize: 18, color: tokens.primary }} />
            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
              {t('triage.colleagueReview.youAreAsked', { name: nameOf(r.requestedByUserId) })}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
            {fmt(r.requestedAt)}
          </Typography>
          {renderQuestion(r)}
          <TextField
            multiline
            minRows={2}
            size="small"
            label={t('triage.colleagueReview.responseLabel')}
            value={answers[r.id] ?? ''}
            onChange={(e) => setAnswers((a) => ({ ...a, [r.id]: e.target.value }))}
            sx={{ bgcolor: tokens.paper }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={!answers[r.id]?.trim() || busyId === r.id}
            onClick={() =>
              void run(
                r.id,
                () =>
                  client.respondColleagueReview(
                    caseData.id,
                    r.id,
                    answers[r.id] ?? '',
                    currentUser.id,
                    currentUser.role,
                  ),
                t('triage.colleagueReview.responded'),
              )
            }
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('triage.colleagueReview.respond')}
          </Button>
        </Stack>
      ))}

      {others.length > 0 && (
        <Stack sx={{ gap: 1.25 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
            {t('triage.colleagueReview.title')}
          </Typography>
          {others.map((r) => (
            <Stack
              key={r.id}
              sx={{ gap: 0.5, pb: 1.25, borderBottom: `1px solid ${tokens.greyFill}` }}
            >
              <Stack
                direction="row"
                sx={{ gap: 1, justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
                  {t('triage.colleagueReview.requestedMeta', {
                    requester: nameOf(r.requestedByUserId),
                    reviewer: nameOf(r.reviewerUserId),
                    date: fmt(r.requestedAt),
                  })}
                </Typography>
                {r.respondedAt ? (
                  <Tag
                    variant="success"
                    label={t('triage.colleagueReview.answered', { date: fmt(r.respondedAt) })}
                  />
                ) : (
                  <Tag variant="info" label={t('triage.colleagueReview.pending')} />
                )}
              </Stack>
              {renderQuestion(r)}
              {r.response && (
                <Box
                  sx={{
                    fontSize: 13,
                    bgcolor: tokens.successBg,
                    color: tokens.successFg,
                    borderRadius: 1.5,
                    px: 1.25,
                    py: 0.75,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {r.response}
                </Box>
              )}
              {!r.respondedAt && r.requestedByUserId === currentUser.id && (
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  disabled={busyId === r.id}
                  onClick={() =>
                    void run(
                      r.id,
                      () =>
                        client.cancelColleagueReview(
                          caseData.id,
                          r.id,
                          currentUser.id,
                          currentUser.role,
                        ),
                      t('triage.colleagueReview.withdrawn'),
                    )
                  }
                  sx={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 500 }}
                >
                  {t('triage.colleagueReview.withdraw')}
                </Link>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {canRequest && (
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => setDialogOpen(true)}
          sx={{ alignSelf: 'flex-start', fontWeight: 500, fontSize: 13 }}
        >
          {t('triage.colleagueReview.request')}
        </Link>
      )}

      <RequestDialog
        open={dialogOpen}
        colleagues={colleagues}
        onCancel={() => setDialogOpen(false)}
        onSubmit={request}
      />
    </Stack>
  )
}
