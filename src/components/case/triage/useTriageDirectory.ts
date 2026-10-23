import type { Locale } from 'date-fns'
import { enUS, sv } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { CareRole, CareTeam, User } from '@/api/schemas'
import { useApi } from '@/hooks/useApi'

const NO_USERS: User[] = []
const NO_TEAMS: CareTeam[] = []

/** Users and care teams used to pick and display triage assignees. */
export function useTriageDirectory(): { users: User[]; teams: CareTeam[] } {
  const { data: users } = useApi(() => client.getUsers(), [])
  const { data: teams } = useApi(() => client.getCareTeams(), [])
  return { users: users ?? NO_USERS, teams: teams ?? NO_TEAMS }
}

/** date-fns locale matching the active UI language. */
export function useDateLocale(): Locale {
  const { i18n } = useTranslation()
  return (i18n.resolvedLanguage ?? i18n.language ?? 'sv').startsWith('en') ? enUS : sv
}

export function isClinician(user: Pick<User, 'role'>): boolean {
  return user.role === 'DOCTOR' || user.role === 'NURSE'
}

/** Named users follow the chosen competence; physiotherapists have no user accounts. */
export function eligibleUsersFor(users: readonly User[], careRole: CareRole): User[] {
  if (careRole === 'PHYSIO') return []
  return users.filter((u) =>
    careRole ? u.role === careRole : u.role === 'DOCTOR' || u.role === 'NURSE',
  )
}
