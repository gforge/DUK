import { useTranslation } from 'react-i18next'

import type { Role } from '@/api/schemas'

function assertNever(x: never): never {
  throw new Error(`Unhandled enum value: ${String(x)}`)
}

/** Returns a label function for Role. */
export function useRoleLabel() {
  const { t } = useTranslation()
  return (role: Role): string => {
    switch (role) {
      case 'PATIENT':
        return t('role.PATIENT')
      case 'NURSE':
        return t('role.NURSE')
      case 'DOCTOR':
        return t('role.DOCTOR')
      case 'PAL':
        return t('role.PAL')
      default:
        return assertNever(role)
    }
  }
}
