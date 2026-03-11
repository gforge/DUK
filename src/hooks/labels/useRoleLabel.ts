import { useTranslation } from 'react-i18next'

import type { Role } from '@/api/schemas'

import { assertNever } from './never'

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
      case 'SECRETARY':
        return t('role.SECRETARY')
      default:
        return assertNever(role)
    }
  }
}
