export type RetryPreset = 'todayLate' | 'tomorrowMorning' | 'custom'

/** ISO time for a retry preset: today 17:00 or tomorrow 09:00. */
export function retryPresetToIso(
  preset: Exclude<RetryPreset, 'custom'>,
  from = new Date(),
): string {
  const d = new Date(from)
  if (preset === 'todayLate') d.setHours(17, 0, 0, 0)
  else {
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
  }
  return d.toISOString()
}
