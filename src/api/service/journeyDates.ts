import type { PatientJourney } from '../schemas'

/**
 * When a journey is suspended the live pause days need to be added on top of
 * the stored totalPausedDays so that every scheduled date shifts forward in
 * real time without the UI writing to the store on every render.
 */
export function computeTotalPauseShift(journey: PatientJourney): number {
  const total = journey.totalPausedDays ?? 0
  if (journey.status === 'SUSPENDED' && journey.pausedAt) {
    const currentPause = Math.floor(
      (Date.now() - new Date(journey.pausedAt).getTime()) / 86_400_000,
    )
    return total + currentPause
  }
  return total
}

/**
 * Convert an offset in days (relative to journey start) to an ISO date string,
 * taking an optional pause shift into account.  Expects startMs =
 * Date.parse(journey.startDate).
 */
export function toScheduledDate(startMs: number, offsetDays: number, pauseShift = 0): string {
  return new Date(startMs + (offsetDays + pauseShift) * 86_400_000).toISOString().slice(0, 10)
}
