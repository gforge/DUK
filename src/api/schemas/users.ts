import { z } from 'zod'
import { RoleSchema } from './enums'

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleSchema,
})
export type User = z.infer<typeof UserSchema>
