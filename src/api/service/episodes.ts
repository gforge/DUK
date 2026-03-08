import type { EpisodeOfCare } from '../schemas'
import { getStore, patchStore } from '../storage'
import { now, uuid } from './utils'

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
