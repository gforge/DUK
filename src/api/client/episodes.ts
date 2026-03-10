import type { EpisodeOfCare } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getEpisodesOfCare = (patientId?: string): Promise<EpisodeOfCare[]> =>
  withDelay(() => service.getEpisodesOfCare(patientId))

export const getEpisodeById = (episodeId: string): Promise<EpisodeOfCare | undefined> =>
  withDelay(() => service.getEpisodeById(episodeId))

export const createEpisode = (
  patientId: string,
  label: string,
  options?: { clinicalArea?: string; responsibleUserId?: string; primaryCaseId?: string },
): Promise<EpisodeOfCare> => withDelay(() => service.createEpisode(patientId, label, options))

export const updateEpisodeStatus = (
  episodeId: string,
  status: 'OPEN' | 'COMPLETED' | 'DISCHARGED',
): Promise<EpisodeOfCare> => withDelay(() => service.updateEpisodeStatus(episodeId, status))

export const updateEpisodeResponsibleUser = (
  episodeId: string,
  responsibleUserId?: string,
): Promise<EpisodeOfCare> =>
  withDelay(() => service.updateEpisodeResponsibleUser(episodeId, responsibleUserId))
