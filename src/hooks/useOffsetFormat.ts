import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

export type OffsetFormat = { label: string; tooltip: string }

export function formatOffsetDays(days: number, t: TFunction): OffsetFormat {
  const tooltip = t('journey.offsetFormat.exactDays', { count: days })
  if (days >= 365)
    return { label: t('journey.offsetFormat.years', { count: Math.round(days / 365) }), tooltip }
  if (days >= 60)
    return { label: t('journey.offsetFormat.months', { count: Math.round(days / 30) }), tooltip }
  if (days >= 14)
    return { label: t('journey.offsetFormat.weeks', { count: Math.round(days / 7) }), tooltip }
  return { label: t('journey.offsetFormat.days', { count: days }), tooltip: '' }
}

export function useOffsetFormat() {
  const { t } = useTranslation()
  return (days: number) => formatOffsetDays(days, t)
}
