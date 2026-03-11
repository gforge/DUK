import { useTranslation } from 'react-i18next'

import type { MigrationResultErr } from '@/api/migrations'

import { assertNever } from './never'

/**
 * Helper for generating the localized error reason string that the overlay
 * shows.  Only the `reason` text needs a bit of logic; everything else is a
 * simple one‑off translation and can stay in the component.
 */
export function useMigrationReason(error: MigrationResultErr): string {
  const { t } = useTranslation()

  if (error.reason === 'downgrade') {
    return t('migration.reasonDowngrade')
  }

  if (error.reason === 'no-path') {
    return t('migration.reasonNoPath')
  }

  if (error.reason === 'invalid') {
    return t('migration.reasonInvalid')
  }

  if (error.reason === 'parse-error') {
    return t('migration.reasonParseError')
  }

  return assertNever(error.reason)
}
