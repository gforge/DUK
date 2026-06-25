import { differenceInDays, format, isToday, isYesterday } from 'date-fns'
import { useTranslation } from 'react-i18next'

import type { ContactAction } from '@/api/client/audit'

import { assertNever } from './never'

export function useContactActionText() {
  const { t } = useTranslation()

  function successMessage(action: ContactAction): string {
    switch (action) {
      case 'CONTACTED':
        return t('contactActions.contactedDone')

      case 'REMINDER_SENT':
        return t('contactActions.remindedDone')

      case 'CALL_ATTEMPT':
        return t('contactActions.callAttemptedDone')

      default:
        return assertNever(action)
    }
  }

  function formatRelativeContactDate(ts: string): string {
    const date = new Date(ts)
    const days = differenceInDays(new Date(), date)

    if (isToday(date)) {
      return t('contactActions.date.todayAt', { time: format(date, 'HH:mm') })
    }

    if (isYesterday(date)) {
      return t('contactActions.date.yesterdayAt', { time: format(date, 'HH:mm') })
    }

    if (days >= 2 && days <= 7) {
      return t('contactActions.date.daysAgo', { count: days })
    }

    return format(date, 'yyyy-MM-dd')
  }

  return {
    successMessage,
    formatRelativeContactDate,
  }
}
