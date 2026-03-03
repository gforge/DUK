import { getStore } from '../storage'
import { toScheduledDate } from './journeyDates'
import type { JourneyTemplateEntry, CaseCategory, PatientJourney } from '../schemas'
import type { EffectiveStep } from './journeyResolver'

/**
 * Apply research module entries to a previously-computed array of steps.
 * Steps may be modified in place; the return value is the mutated array.
 */
export function applyResearchModules(
  steps: EffectiveStep[],
  journey: PatientJourney,
  startMs: number,
  totalPauseShift: number,
): EffectiveStep[] {
  const state = getStore()
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
          isRecurring: false,
          researchModuleId: moduleId,
          replacesStepId: entry.replaceStepId,
          scheduledDate: original?.scheduledDate ?? toScheduledDate(startMs, 0, totalPauseShift),
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
          isRecurring: false,
          researchModuleId: moduleId,
          scheduledDate: toScheduledDate(startMs, entry.offsetDays, totalPauseShift),
        })
      }
    }
  }
  return steps
}
