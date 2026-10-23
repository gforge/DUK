import type { CareTeam, Case } from '../schemas'
import { getStore } from '../storage'

export function getCareTeams(): CareTeam[] {
  return getStore().careTeams
}

/**
 * True when the case's task is directed at this user: claimed by them, named
 * in a multi-person assignment, or sent to a team they belong to.
 */
export function isCaseAssignedToUser(caseData: Case, userId: string, teams: CareTeam[]): boolean {
  if (caseData.assignedUserId === userId) return true
  const td = caseData.triageDecision
  if (!td) return false
  if (td.assignedUserIds?.includes(userId)) return true
  if (td.assignmentMode === 'TEAM' && td.assignedTeamIds?.length) {
    return teams.some((t) => td.assignedTeamIds!.includes(t.id) && t.memberUserIds.includes(userId))
  }
  return false
}
