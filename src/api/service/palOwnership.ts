import type { Case } from '../schemas'
import { getStore } from '../storage'

function resolvePrimaryJourneyForCase(caseData: Case) {
  const state = getStore()

  if (caseData.episodeId) {
    const inEpisode = state.patientJourneys
      .filter((j) => j.episodeId === caseData.episodeId)
      .sort((a, b) => {
        const statusScore = (s: string) => (s === 'ACTIVE' ? 0 : s === 'SUSPENDED' ? 1 : 2)
        return (
          statusScore(a.status) - statusScore(b.status) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    if (inEpisode.length > 0) return inEpisode[0]
  }

  const byPatient = state.patientJourneys
    .filter((j) => j.patientId === caseData.patientId)
    .sort((a, b) => {
      const statusScore = (s: string) => (s === 'ACTIVE' ? 0 : s === 'SUSPENDED' ? 1 : 2)
      return (
        statusScore(a.status) - statusScore(b.status) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  return byPatient[0]
}

/**
 * Resolves responsible physician ownership with priority:
 * 1) Journey-level responsible physician (PAL context)
 * 2) Episode responsible user
 * 3) Patient PAL
 */
export function resolveResponsiblePhysicianUserIdForCase(caseId: string): string | null {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)
  if (!caseData) throw new Error(`Case ${caseId} not found`)

  const primaryJourney = resolvePrimaryJourneyForCase(caseData)
  if (primaryJourney?.responsiblePhysicianUserId === null) return null
  if (primaryJourney?.responsiblePhysicianUserId) return primaryJourney.responsiblePhysicianUserId

  const episodeId = caseData.episodeId ?? primaryJourney?.episodeId
  if (episodeId) {
    const episode = state.episodesOfCare.find((e) => e.id === episodeId)
    if (episode?.responsibleUserId) return episode.responsibleUserId
  }

  const patient = state.patients.find((p) => p.id === caseData.patientId)
  return patient?.palId ?? null
}

export function hasPalOwnerForCase(caseId: string): boolean {
  return resolveResponsiblePhysicianUserIdForCase(caseId) !== null
}
