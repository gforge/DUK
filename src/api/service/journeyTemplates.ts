import type { JourneyTemplate, JourneyTemplateEntry } from '../schemas'
import { getStore, setStore } from '../storage'
import { now,uuid } from './utils'

export function getJourneyTemplates(): JourneyTemplate[] {
  return getStore().journeyTemplates
}

export function saveJourneyTemplate(
  template: Omit<JourneyTemplate, 'id' | 'createdAt'> & { id?: string },
): JourneyTemplate {
  const state = getStore()
  const existing = template.id ? state.journeyTemplates.find((t) => t.id === template.id) : null
  if (existing) {
    const updated: JourneyTemplate = { ...existing, ...template, id: existing.id }
    setStore({
      ...state,
      journeyTemplates: state.journeyTemplates.map((t) => (t.id === existing.id ? updated : t)),
    })
    return updated
  }
  const newTemplate: JourneyTemplate = {
    ...template,
    id: uuid(),
    createdAt: now(),
  } as JourneyTemplate
  setStore({ ...state, journeyTemplates: [...state.journeyTemplates, newTemplate] })
  return newTemplate
}

export function deleteJourneyTemplate(templateId: string): void {
  const state = getStore()
  setStore({
    ...state,
    journeyTemplates: state.journeyTemplates.filter((t) => t.id !== templateId),
  })
}

/**
 * Create a new template as a full copy of an existing one.
 * Records parentTemplateId + derivedAt so diffs can be computed later.
 */
export function deriveJourneyTemplate(parentId: string, newName: string): JourneyTemplate {
  const state = getStore()
  const parent = state.journeyTemplates.find((t) => t.id === parentId)
  if (!parent) throw new Error(`Template ${parentId} not found`)

  const child: JourneyTemplate = {
    id: uuid(),
    name: newName,
    description: parent.description,
    entries: parent.entries.map((e) => ({ ...e, id: uuid() })),
    createdAt: now(),
    parentTemplateId: parentId,
    derivedAt: now(),
    referenceDateLabel: parent.referenceDateLabel,
  }
  setStore({ ...state, journeyTemplates: [...state.journeyTemplates, child] })
  return child
}

export interface EntryDiff {
  type: 'ADDED' | 'REMOVED' | 'CHANGED'
  entryId: string
  label: string
  /** Present when changed — the updated parent entry to apply */
  parentEntry?: JourneyTemplateEntry
}

/**
 * Computes which parent entries have changed, been added, or removed since
 * the child was last synced (derivedAt timestamp is used as the marker).
 *
 * Because we don't snapshot history, we compare by entry label+offset as a stable key.
 * Entries are matched on their integer offsetDays + label combo.
 */
export function computeParentDiff(childId: string): EntryDiff[] {
  const state = getStore()
  const child = state.journeyTemplates.find((t) => t.id === childId)
  if (!child || !child.parentTemplateId) return []
  const parent = state.journeyTemplates.find((t) => t.id === child.parentTemplateId)
  if (!parent) return []

  const diffs: EntryDiff[] = []

  // Entries in parent but missing or changed in child (match by offsetDays+order)
  for (const pe of parent.entries) {
    const ce = child.entries.find((e) => e.offsetDays === pe.offsetDays && e.order === pe.order)
    if (!ce) {
      diffs.push({ type: 'ADDED', entryId: pe.id, label: pe.label, parentEntry: pe })
    } else {
      const changed =
        ce.label !== pe.label ||
        ce.windowDays !== pe.windowDays ||
        ce.templateId !== pe.templateId ||
        ce.dashboardCategory !== pe.dashboardCategory ||
        ce.instructionText !== pe.instructionText ||
        ce.instructionTemplateId !== pe.instructionTemplateId
      if (changed) {
        diffs.push({ type: 'CHANGED', entryId: ce.id, label: ce.label, parentEntry: pe })
      }
    }
  }

  // Entries in child that no longer exist in parent
  for (const ce of child.entries) {
    const stillInParent = parent.entries.some(
      (e) => e.offsetDays === ce.offsetDays && e.order === ce.order,
    )
    if (!stillInParent && !ce.id.startsWith('step-')) {
      // Only flag non-manually-added entries
      diffs.push({ type: 'REMOVED', entryId: ce.id, label: ce.label })
    }
  }

  return diffs
}

/**
 * Apply selected parent diffs to the child template.
 * entryIds refers to entryId values from the EntryDiff array.
 * Updates derivedAt so next diff is relative to this sync point.
 */
// ---------------------------------------------------------------------------
// Policy variable discovery
// ---------------------------------------------------------------------------

/**
 * A variable that can be referenced in a policy expression.
 * Journey-specific variables come from template scoreAliases + scoreAliasLabels.
 */
export interface PolicyVariable {
  /** The identifier used in policy expressions, e.g. "PNRS_baseline". */
  name: string
  /** Human-readable label shown in the UI, e.g. "Smärta dag 1–2 (PNRS)". */
  label: string
  /** Name of the journey template the variable comes from (used for grouping). */
  templateName: string
}

/**
 * Scans all journey templates in the store and collects every score alias that
 * has a human-readable label. These are the variables clinicians can reference
 * in policy expressions to compare measurements across time-points.
 */
export function getAvailablePolicyVariables(): PolicyVariable[] {
  const state = getStore()
  const seen = new Set<string>()
  const vars: PolicyVariable[] = []

  for (const jt of state.journeyTemplates) {
    for (const entry of jt.entries) {
      for (const [, alias] of Object.entries(entry.scoreAliases)) {
        if (seen.has(alias)) continue
        seen.add(alias)
        const label = entry.scoreAliasLabels?.[alias] ?? alias
        vars.push({ name: alias, label, templateName: jt.name })
      }
    }
  }

  return vars
}

export function applyParentDiff(childId: string, entryIds: string[]): JourneyTemplate {
  const state = getStore()
  const child = state.journeyTemplates.find((t) => t.id === childId)
  if (!child || !child.parentTemplateId)
    throw new Error(`Child template ${childId} not found or has no parent`)

  const diffs = computeParentDiff(childId)
  const selected = diffs.filter((d) => entryIds.includes(d.entryId))

  let entries = [...child.entries]

  for (const diff of selected) {
    if (diff.type === 'ADDED' && diff.parentEntry) {
      entries.push({ ...diff.parentEntry, id: uuid() })
    } else if (diff.type === 'REMOVED') {
      entries = entries.filter((e) => e.id !== diff.entryId)
    } else if (diff.type === 'CHANGED' && diff.parentEntry) {
      const pe = diff.parentEntry
      entries = entries.map((e) =>
        e.id === diff.entryId ? ({ ...pe, id: e.id } as JourneyTemplateEntry) : e,
      )
    }
  }

  // Re-sort by offsetDays + order
  entries.sort((a, b) => a.offsetDays - b.offsetDays || a.order - b.order)

  const updated: JourneyTemplate = { ...child, entries, derivedAt: now() }
  setStore({
    ...state,
    journeyTemplates: state.journeyTemplates.map((t) => (t.id === childId ? updated : t)),
  })
  return updated
}
