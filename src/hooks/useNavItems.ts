import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import type { Role } from '@/api/schemas'
import { useRole } from '@/store/roleContext'

interface NavItem {
  label: string
  path: string
  roles: readonly Role[]
}

export function useNavItems(): { navItems: NavItem[]; accessiblePaths: string[] } {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isRole, currentUser } = useRole()
  const prevRoleRef = useRef(currentUser.role)

  const navItems: NavItem[] = useMemo(
    () => [
      {
        label: t('nav.dashboard'),
        path: '/dashboard',
        roles: ['NURSE', 'DOCTOR'] as const,
      },
      {
        label: t('patient.title'),
        path: '/patient',
        roles: ['PATIENT'] as const,
      },
      {
        label: t('nav.worklist'),
        path: '/worklist',
        roles: ['NURSE', 'DOCTOR', 'SECRETARY'] as const,
      },
      {
        label: t('nav.policy'),
        path: '/policy',
        roles: ['NURSE', 'DOCTOR'] as const,
      },
      {
        label: t('nav.patients'),
        path: '/patients',
        roles: ['NURSE', 'DOCTOR', 'SECRETARY'] as const,
      },
      {
        label: t('nav.journeys'),
        path: '/journeys',
        roles: ['NURSE', 'DOCTOR'] as const,
      },
      {
        label: t('nav.demoTools'),
        path: '/demo-tools',
        roles: ['NURSE', 'DOCTOR', 'PATIENT', 'SECRETARY'] as const,
      },
    ],
    [t],
  )

  const accessiblePaths = useMemo(
    () =>
      navItems.filter((item) => item.roles.some((role) => isRole(role))).map((item) => item.path),
    [navItems, isRole],
  )

  useEffect(() => {
    const roleChanged = prevRoleRef.current !== currentUser.role
    prevRoleRef.current = currentUser.role
    if (!roleChanged) return
    if (!accessiblePaths.length) return
    const allowed = accessiblePaths.some((path) => location.pathname.startsWith(path))
    if (!allowed) {
      console.warn(
        `Current path "${location.pathname}" is not accessible with role "${currentUser.role}". Redirecting to "${accessiblePaths[0]}".`,
      )
      navigate(accessiblePaths[0], { replace: true })
    }
  }, [currentUser.role, accessiblePaths, location.pathname, navigate])

  return { navItems, accessiblePaths }
}
