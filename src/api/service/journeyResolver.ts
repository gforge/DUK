import { getStore } from '../storage'
import { buildPolicyScope } from './utils'
import type { JourneyTemplateEntry, CaseCategory, FormResponse } from '../schemas'

/**
 * A resolved, ordered step for a specific patient — after modifications and research overlays.
 * resolvedInstruction is hydrated from instructionTemplateId (preferred) or instructionText.
 */
export type EffectiveStep = JourneyTemplateEntry & {
  isAdded: boolean
  isResearch: boolean
  researchModuleId?: string
  replacesStepId?: string
  scheduledDate: string // YYYY-MM-DD relative to journey.startDate
  resolvedInstruction?: string // hydrated instruction content (markdown)
}

/**
 * Resolves the effective, ordered steps for a patient journey.
 * Applies ADD_STEP / REMOVE_STEP modifications in chronological order.
 * SWITCH_TEMPLATE is already reflected in journey.journeyTemplateId and startDate.
 * Research module entries are then merged/inserted.
 * Instruction content is hydrated from instructionTemplateId or instructionText.
 */
export function getEffectiveSteps(journeyId: string): EffectiveStep[] {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) return []

  const template = state.journeyTemplates.find((t) => t.id === journey.journeyTemplateId)
  if (!template) return []

  const startMs = new Date(journey.startDate).getTime()
  const toDate = (offsetDays: number) =>
    new Date(startMs + offsetDays * 86_400_000).toISOString().slice(0, 10)

  const resolveInstruction = (entry: JourneyTemplateEntry): string | undefined => {
    if (entry.instructionTemplateId) {
      const it = (state.instructionTemplates ?? []).find(
        (t) => t.id === entry.instructionTemplateId,
      )
      return it?.content ?? entry.instructionText
    }
    return entry.instructionText
  }

  let steps: EffectiveStep[] = template.entries.map((e) => ({
    ...e,
    isAdded: false,
    isResearch: false,
    scheduledDate: toDate(e.offsetDays),
    resolvedInstruction: resolveInstruction(e),
  }))

  const removedIds = new Set<string>()
  for (const mod of journey.modifications) {
    if (mod.type === 'REMOVE_STEP' && mod.stepId) {
      removedIds.add(mod.stepId)
    } else if (mod.type === 'ADD_STEP' && mod.entry) {
      steps.push({
        ...mod.entry,
        isAdded: true,
        isResearch: false,
        scheduledDate: toDate(mod.entry.offsetDays),
        resolvedInstruction: resolveInstruction(mod.entry),
      })
    }
  }
  steps = steps.filter((s) => !removedIds.has(s.id))

  for (const moduleId of journey.researchModuleIds) {
    const module = state.researchModules.find((m) => m.id === moduleId)
    if (!module) continue
    for (const entry of module.entries) {
      if (entry.replaceStepId) {
        const original = steps.find((s) => s.id === entry.replaceStepId)
        const researchStep: EffectiveStep = {
          id: entry.id,
          label: entry.label,
          offsetDays: original?.offsetDays ?? 0,
          windowDays: original?.windowDays ?? 2,
          order: original?.order ?? 999,
          templateId: entry.templateId,
          scoreAliases: original?.scoreAliases ?? {},
          scoreAliasLabels: original?.scoreAliasLabels ?? {},
          dashboardCategory: (original?.dashboardCategory ?? 'CONTROL') as CaseCategory,
          isAdded: false,
          isResearch: true,
          researchModuleId: moduleId,
          replacesStepId: entry.replaceStepId,
          scheduledDate: original?.scheduledDate ?? toDate(0),
          resolvedInstruction: original?.resolvedInstruction,
        }
        steps = steps.filter((s) => s.id !== entry.replaceStepId)
        steps.push(researchStep)
      } else if (entry.offsetDays !== undefined) {
        steps.push({
          id: entry.id,
          label: entry.label,
          offsetDays: entry.offsetDays,
          windowDays: 3,
          order: entry.offsetDays,
          templateId: entry.templateId,
          scoreAliases: {},
          scoreAliasLabels: {},
          dashboardCategory: 'CONTROL',
          isAdded: false,
          isResearch: true,
          researchModuleId: moduleId,
          scheduledDate: toDate(entry.offsetDays),
        })
      }
    }
  }

  return steps.sort((a, b) => a.offsetDays - b.offsetDays || a.order - b.order)
}

/**
 * Builds the policy evaluation scope, also injecting semantic score aliases
 * from the patient's active journey steps (e.g. PNRS_week4, OSS_week8).
 */
export function buildPolicyScopeWithAliases(
  responses: FormResponse[],
  patientId: string,
): Record<string, number> {
  const state = getStore()
  const scope = buildPolicyScope(responses)

  const journey = state.patientJourneys
    .filter((j) => j.patientId === patientId && j.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  if (!journey) return scope

  for (const step of getEffectiveSteps(journey.id)) {
    if (Object.keys(step.scoreAliases).length === 0) continue
    const stepResponses = responses
      .filter((r) => r.templateId === step.templateId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    const latest = stepResponses[0]
    if (!latest) continue
    for (const [rawKey, alias] of Object.entries(step.scoreAliases)) {
      const value =
        latest.scores[rawKey] !== undefined ? latest.scores[rawKey] : Number(latest.answers[rawKey])
      if (!isNaN(value)) scope[alias] = value
    }
  }

  return scope
}
