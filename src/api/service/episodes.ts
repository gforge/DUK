import type { DiagnosisSource, EpisodeOfCare, Referral, Role } from '../schemas'
import { getStore, patchStore } from '../storage'
import { addAuditEvent, now, uuid } from './utils'

export function getEpisodesOfCare(patientId?: string): EpisodeOfCare[] {
  const episodes = getStore().episodesOfCare ?? []
  return patientId ? episodes.filter((e) => e.patientId === patientId) : episodes
}

export function getEpisodeById(episodeId: string): EpisodeOfCare | undefined {
  return (getStore().episodesOfCare ?? []).find((e) => e.id === episodeId)
}

export function createEpisode(
  patientId: string,
  label: string,
  options: {
    clinicalArea?: string
    responsibleUserId?: string
    primaryCaseId?: string
  } = {},
): EpisodeOfCare {
  const episode: EpisodeOfCare = {
    id: uuid(),
    patientId,
    label,
    clinicalArea: options.clinicalArea,
    status: 'OPEN',
    openedAt: now(),
    closedAt: null,
    responsibleUserId: options.responsibleUserId,
    primaryCaseId: options.primaryCaseId,
    createdAt: now(),
    updatedAt: now(),
  }

  patchStore((state) => ({
    ...state,
    episodesOfCare: [...(state.episodesOfCare ?? []), episode],
  }))

  return episode
}

export function updateEpisodeStatus(
  episodeId: string,
  status: 'OPEN' | 'COMPLETED' | 'DISCHARGED',
): EpisodeOfCare {
  const state = getStore()
  const episode = state.episodesOfCare?.find((e) => e.id === episodeId)
  if (!episode) throw new Error(`Episode ${episodeId} not found`)

  const closedAt = status === 'OPEN' ? null : (episode.closedAt ?? now())

  const updated: EpisodeOfCare = {
    ...episode,
    status,
    closedAt,
    updatedAt: now(),
  }

  patchStore((s) => ({
    ...s,
    episodesOfCare: (s.episodesOfCare ?? []).map((e) => (e.id === episodeId ? updated : e)),
  }))

  return updated
}

export function updateEpisodeResponsibleUser(
  episodeId: string,
  responsibleUserId?: string,
): EpisodeOfCare {
  const state = getStore()
  const episode = state.episodesOfCare?.find((e) => e.id === episodeId)
  if (!episode) throw new Error(`Episode ${episodeId} not found`)

  const updated: EpisodeOfCare = {
    ...episode,
    responsibleUserId,
    updatedAt: now(),
  }

  patchStore((s) => ({
    ...s,
    episodesOfCare: (s.episodesOfCare ?? []).map((e) => (e.id === episodeId ? updated : e)),
  }))

  return updated
}

/**
 * Sets the referral diagnoses on an episode. In production these arrive via an
 * "uthopp" (context launch) from TakeCare; the demo simulates that launch.
 */
export function setReferralDiagnoses(
  episodeId: string,
  diagnoses: Referral['diagnoses'],
  source: DiagnosisSource,
  userId: string,
  userRole: Role,
): EpisodeOfCare {
  const state = getStore()
  const episode = state.episodesOfCare?.find((e) => e.id === episodeId)
  if (!episode) throw new Error(`Episode ${episodeId} not found`)
  if (!episode.referral) throw new Error(`Episode ${episodeId} has no referral`)

  const updated: EpisodeOfCare = {
    ...episode,
    referral: { ...episode.referral, diagnoses, diagnosisSource: source },
    updatedAt: now(),
  }

  patchStore((s) => {
    const next = {
      ...s,
      episodesOfCare: (s.episodesOfCare ?? []).map((e) => (e.id === episodeId ? updated : e)),
    }
    if (!episode.primaryCaseId) return next
    return addAuditEvent(next, episode.primaryCaseId, userId, userRole, 'REFERRAL_DIAGNOSES_SET', {
      codes: diagnoses.map((d) => d.code),
      source,
    })
  })

  return updated
}
