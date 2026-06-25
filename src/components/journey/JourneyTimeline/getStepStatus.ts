import { FormResponse } from '@/api/schemas'
import { EffectiveStep } from '@/api/service'

import { StepStatus } from './types'

export function getStepStatus(step: EffectiveStep, responses: FormResponse[]): StepStatus {
  const submitted = responses.some((r) => r.templateId === step.templateId)
  if (submitted) return 'SUBMITTED'
  const today = new Date().toISOString().slice(0, 10)
  if (step.scheduledDate < today) return 'OVERDUE'
  return 'UPCOMING'
}
