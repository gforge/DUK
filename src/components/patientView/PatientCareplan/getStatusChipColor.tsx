import type { PatientJourney } from '@/api/schemas'

export const getStatusChipColor = (status: PatientJourney['status']) => {
  if (status === 'ACTIVE') return 'primary'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}
