import { z } from 'zod'

/** A clinical team (e.g. "Höft", "Trauma") whose members share a task queue. */
export const CareTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberUserIds: z.array(z.string()),
})
export type CareTeam = z.infer<typeof CareTeamSchema>
