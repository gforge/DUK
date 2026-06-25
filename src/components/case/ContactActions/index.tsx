import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PhoneIcon from '@mui/icons-material/Phone'
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled'
import { Alert, Button, Stack, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { ContactAction } from '@/api/client/audit'
import type { Case } from '@/api/schemas'
import { useContactActionText } from '@/hooks/labels'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

/** Triggers that surface the contact action panel */
const CONTACT_TRIGGERS = new Set(['SEEK_CONTACT', 'NOT_OPENED'] as const)

type ContactTrigger = 'SEEK_CONTACT' | 'NOT_OPENED'
type ContactPanelAction = Extract<ContactAction, 'CONTACTED' | 'REMINDER_SENT' | 'CALL_ATTEMPT'>

interface Props {
  caseData: Case
  /** Called after logging an event so AuditLogTab can refetch */
  onRefetch: () => void
}

export default function ContactActions({ caseData, onRefetch }: Props) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const { data: events, refetch: refetchEvents } = useApi(
    () => client.getAuditEvents(caseData.id),
    [caseData.id],
  )
  const { formatRelativeContactDate, successMessage } = useContactActionText()
  const [loading, setLoading] = useState<ContactPanelAction | null>(null)

  const canContact = isRole('NURSE', 'DOCTOR', 'SECRETARY')

  const primaryTrigger = caseData.triggers.find((trigger): trigger is ContactTrigger =>
    CONTACT_TRIGGERS.has(trigger as ContactTrigger),
  )

  const { lastReminder, lastCallAttempt, lastContacted } = useMemo(() => {
    if (!events) {
      return { lastReminder: null, lastCallAttempt: null, lastContacted: null }
    }

    let lastReminder: string | null = null
    let lastCallAttempt: string | null = null
    let lastContacted: string | null = null

    for (const event of events) {
      if (event.action === 'REMINDER_SENT' && (!lastReminder || event.timestamp > lastReminder)) {
        lastReminder = event.timestamp
      }

      if (
        event.action === 'CALL_ATTEMPT' &&
        (!lastCallAttempt || event.timestamp > lastCallAttempt)
      ) {
        lastCallAttempt = event.timestamp
      }

      if (event.action === 'CONTACTED' && (!lastContacted || event.timestamp > lastContacted)) {
        lastContacted = event.timestamp
      }
    }

    // forget a CONTACTED event if it happened more than two days ago so the panel
    // can show contact buttons again. this matches the "no data for 2 days" rule.
    if (lastContacted) {
      const age = Date.now() - new Date(lastContacted).getTime()
      const TWO_DAYS = 2 * 24 * 60 * 60 * 1000
      if (age > TWO_DAYS) {
        lastContacted = null
      }
    }

    return { lastReminder, lastCallAttempt, lastContacted }
  }, [events])

  if (!canContact || !primaryTrigger || caseData.status === 'CLOSED') {
    return null
  }

  async function handle(action: ContactPanelAction) {
    setLoading(action)

    try {
      await client.logContactEvent(caseData.id, currentUser.id, currentUser.role, action)
      showSnack(successMessage(action), 'success')
      onRefetch()
      // reload the events so panel can update
      refetchEvents()
    } catch {
      showSnack(t('common.errorGeneric'), 'error')
    } finally {
      setLoading(null)
    }
  }

  const isSubmitting = loading !== null

  return (
    <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
      <Stack gap={1.5}>
        <Typography variant="body2">
          {(() => {
            // when contact has been logged, show that timestamp instead of the
            // reminder date; also pick grammar depending on whether the formatted
            // string starts with a relative word (today/yesterday) so we can omit
            // the Swedish "den".
            const dateToShow = lastContacted ?? lastReminder
            if (!dateToShow) {
              return t(`contactActions.suggestion.${primaryTrigger}`)
            }
            const formatted = formatRelativeContactDate(dateToShow)
            const isRelative = /^(idag|igår|today|yesterday)/i.test(formatted)
            const key = `contactActions.suggestion.${primaryTrigger}${isRelative ? '' : '_withDen'}`
            // cast to any since key is dynamic
            return t(key as any, { date: formatted }) as string
          })()}
        </Typography>

        {lastReminder && (
          <Typography variant="caption" color="text.secondary">
            {t('contactActions.lastReminderSent', {
              date: formatRelativeContactDate(lastReminder),
            })}
          </Typography>
        )}

        {lastCallAttempt && (
          <Typography variant="caption" color="text.secondary">
            {t('contactActions.lastCallAttempt', {
              date: formatRelativeContactDate(lastCallAttempt),
            })}
          </Typography>
        )}

        <Stack direction="row" gap={1} flexWrap="wrap">
          {!lastContacted && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<PhoneIcon />}
                onClick={() => handle('CONTACTED')}
                disabled={isSubmitting}
                disableElevation
              >
                {t('contactActions.contacted')}
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<PhoneDisabledIcon />}
                onClick={() => handle('CALL_ATTEMPT')}
                disabled={isSubmitting}
              >
                {t('contactActions.callAttempted')}
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<NotificationsActiveIcon />}
                onClick={() => handle('REMINDER_SENT')}
                disabled={isSubmitting}
              >
                {t('contactActions.reminded')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Alert>
  )
}
