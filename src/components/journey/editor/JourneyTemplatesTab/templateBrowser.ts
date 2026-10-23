import type {
  InstructionTemplate,
  JourneyTemplate,
  JourneyTemplateEntry,
  JourneyTemplateInstruction,
  PatientJourney,
  QuestionnaireTemplate,
} from '@/api/schemas'

/** Separator used in phase template names, e.g. "Knäartros — Remissfas". */
const NAME_SEPARATOR = ' — '

export interface TemplateGroup {
  /** Group label; null means "ungrouped" (rendered with a translated fallback). */
  label: string | null
  templates: JourneyTemplate[]
  /** True when the group's templates form a multi-phase care pathway. */
  phased: boolean
}

/**
 * Resolves the group a template belongs to: its explicit `group`, else the
 * group of the template it was derived from, else the name prefix before
 * " — " (legacy naming convention for phase templates).
 */
export function resolveGroup(
  template: JourneyTemplate,
  byId: Map<string, JourneyTemplate>,
  seen: Set<string> = new Set(),
): string | null {
  if (template.group?.trim()) return template.group.trim()
  if (template.parentTemplateId && !seen.has(template.id)) {
    const parent = byId.get(template.parentTemplateId)
    if (parent) {
      seen.add(template.id)
      const g = resolveGroup(parent, byId, seen)
      if (g) return g
    }
  }
  const idx = template.name.indexOf(NAME_SEPARATOR)
  return idx > 0 ? template.name.slice(0, idx).trim() : null
}

/** Stable key for a group (used for collapse state). */
export function groupKey(label: string | null) {
  return label ?? '__ungrouped__'
}

/** Groups templates in first-appearance order; phase templates are sorted by phaseOrder. */
export function groupTemplates(templates: JourneyTemplate[]): TemplateGroup[] {
  const byId = new Map(templates.map((t) => [t.id, t]))
  const groups = new Map<string | null, JourneyTemplate[]>()
  for (const t of templates) {
    const g = resolveGroup(t, byId)
    const list = groups.get(g) ?? []
    list.push(t)
    groups.set(g, list)
  }
  const result: TemplateGroup[] = []
  for (const [label, list] of groups) {
    const phased = list.some((t) => t.phaseOrder !== undefined)
    const sorted = phased
      ? [...list].sort(
          (a, b) =>
            (a.phaseOrder ?? Number.MAX_SAFE_INTEGER) - (b.phaseOrder ?? Number.MAX_SAFE_INTEGER),
        )
      : list
    result.push({ label, templates: sorted, phased })
  }
  // Ungrouped templates go last
  return [...result.filter((g) => g.label !== null), ...result.filter((g) => g.label === null)]
}

/** Name without the "Group — " prefix, used in the grouped list and phase chips. */
export function shortName(template: JourneyTemplate, group: string | null): string {
  const prefix = group ? `${group}${NAME_SEPARATOR}` : null
  if (prefix && template.name.startsWith(prefix)) return template.name.slice(prefix.length)
  return template.name
}

/** Care-pathway phases the template belongs to (empty when it isn't a phase). */
export function getPhases(template: JourneyTemplate, groups: TemplateGroup[]): JourneyTemplate[] {
  if (template.phaseOrder === undefined) return []
  const group = groups.find((g) => g.templates.some((t) => t.id === template.id))
  if (!group) return []
  return group.templates.filter((t) => t.phaseOrder !== undefined)
}

export function sortedEntries(template: JourneyTemplate): JourneyTemplateEntry[] {
  return [...template.entries].sort((a, b) => a.offsetDays - b.offsetDays || a.order - b.order)
}

export function sortedInstructions(template: JourneyTemplate): JourneyTemplateInstruction[] {
  return [...template.instructions].sort(
    (a, b) => a.startDayOffset - b.startDayOffset || a.order - b.order,
  )
}

/**
 * Attaches each instruction to the last step whose offset is at or before the
 * instruction's start (instructions before the first step go to the first step).
 * Returns a map from entry id to its instructions.
 */
export function attachInstructions(
  entries: JourneyTemplateEntry[],
  instructions: JourneyTemplateInstruction[],
): Map<string, JourneyTemplateInstruction[]> {
  const map = new Map<string, JourneyTemplateInstruction[]>()
  if (entries.length === 0) return map
  for (const instr of instructions) {
    let owner = entries[0]
    for (const e of entries) {
      if (e.offsetDays <= instr.startDayOffset) owner = e
      else break
    }
    const list = map.get(owner.id) ?? []
    list.push(instr)
    map.set(owner.id, list)
  }
  return map
}

function sameRecord(a: Record<string, string>, b: Record<string, string>) {
  const ka = Object.keys(a)
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
}

export interface Customisation {
  /** Entry ids of the child that differ from (or are missing in) the parent. */
  customEntryIds: Set<string>
  /** Instruction ids of the child that differ from the parent. */
  customInstructionIds: Set<string>
}

/**
 * Compares a derived template with its parent. Entries are matched the same
 * way as computeParentDiff (offsetDays + order); instructions by instruction
 * template and day span.
 */
export function computeCustomisation(
  child: JourneyTemplate,
  parent: JourneyTemplate | undefined,
): Customisation {
  const customEntryIds = new Set<string>()
  const customInstructionIds = new Set<string>()
  if (!parent) return { customEntryIds, customInstructionIds }
  for (const ce of child.entries) {
    const pe = parent.entries.find((e) => e.offsetDays === ce.offsetDays && e.order === ce.order)
    if (
      !pe ||
      pe.label !== ce.label ||
      pe.windowDays !== ce.windowDays ||
      pe.templateId !== ce.templateId ||
      pe.dashboardCategory !== ce.dashboardCategory ||
      !sameRecord(pe.scoreAliases ?? {}, ce.scoreAliases ?? {})
    ) {
      customEntryIds.add(ce.id)
    }
  }
  for (const ci of child.instructions) {
    const match = parent.instructions.some(
      (pi) =>
        pi.instructionTemplateId === ci.instructionTemplateId &&
        pi.startDayOffset === ci.startDayOffset &&
        pi.endDayOffset === ci.endDayOffset,
    )
    if (!match) customInstructionIds.add(ci.id)
  }
  return { customEntryIds, customInstructionIds }
}

/** Number of distinct patients with an active journey on each template. */
export function countActivePatients(journeys: PatientJourney[] | null): Map<string, number> {
  const sets = new Map<string, Set<string>>()
  for (const j of journeys ?? []) {
    if (j.status !== 'ACTIVE') continue
    const s = sets.get(j.journeyTemplateId) ?? new Set<string>()
    s.add(j.patientId)
    sets.set(j.journeyTemplateId, s)
  }
  return new Map([...sets].map(([k, s]) => [k, s.size]))
}

export type SearchHit =
  { kind: 'template' } | { kind: 'step' | 'instruction' | 'form' | 'alias'; label: string }

export interface SearchContext {
  questionnaires: Map<string, QuestionnaireTemplate>
  instructionTemplates: Map<string, InstructionTemplate>
}

/**
 * Full-text search across a template: name/description, step labels,
 * instruction titles and bodies, form names/codes and score aliases.
 * Returns what matched first, or null when nothing matches.
 */
export function findSearchHit(
  template: JourneyTemplate,
  query: string,
  ctx: SearchContext,
): SearchHit | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const has = (...parts: (string | undefined)[]) =>
    parts.some((p) => p?.toLowerCase().includes(q) ?? false)

  if (has(template.name, template.description, template.group)) return { kind: 'template' }
  const entries = sortedEntries(template)
  const step = entries.find((e) => has(e.label, e.stepKey))
  if (step) return { kind: 'step', label: step.label }
  for (const instr of sortedInstructions(template)) {
    const it = ctx.instructionTemplates.get(instr.instructionTemplateId)
    if (has(instr.label, it?.name, it?.content))
      return { kind: 'instruction', label: instr.label ?? it?.name ?? instr.instructionTemplateId }
  }
  for (const e of entries) {
    if (!e.templateId) continue
    const qt = ctx.questionnaires.get(e.templateId)
    if (has(e.templateId, qt?.name)) return { kind: 'form', label: qt?.name ?? e.templateId }
  }
  const alias = entries.find((e) =>
    Object.entries(e.scoreAliases ?? {}).some(
      ([raw, a]) => has(raw, a) || has(e.scoreAliasLabels?.[a]),
    ),
  )
  if (alias) return { kind: 'alias', label: alias.label }
  return null
}
