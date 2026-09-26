import { tokens } from '@/theme'

/** White bordered card used for the triage form, the aside and summaries. */
export const cardSx = {
  bgcolor: tokens.paper,
  border: `1px solid ${tokens.border}`,
  borderRadius: '12px',
} as const
