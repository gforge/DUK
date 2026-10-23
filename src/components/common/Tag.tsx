import { Box, ButtonBase } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

export type TagVariant =
  | 'clinical'
  | 'admin'
  | 'warning'
  | 'info'
  | 'success'
  | 'error'
  | 'selected'
  | 'muted'

const VARIANT: Record<TagVariant, { bg: string; fg: string }> = {
  clinical: { bg: tokens.clinicalBg, fg: tokens.clinicalFg },
  admin: { bg: tokens.greyFill, fg: tokens.text2 },
  warning: { bg: tokens.warningBg, fg: tokens.warningFg },
  info: { bg: tokens.infoBg, fg: tokens.infoFg },
  success: { bg: tokens.successBg, fg: tokens.successFg },
  error: { bg: tokens.errorBg, fg: tokens.errorFg },
  selected: { bg: tokens.selectedBg, fg: tokens.primaryDark },
  muted: { bg: tokens.greyFill, fg: tokens.textMuted },
}

interface TagProps {
  readonly label: React.ReactNode
  readonly variant?: TagVariant
  readonly icon?: React.ReactNode
  /** `tag` = small rounded rectangle (signals), `pill` = fully rounded (status). */
  readonly shape?: 'tag' | 'pill'
  readonly onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  readonly title?: string
  readonly 'aria-label'?: string
}

/**
 * Compact coloured label. Colour semantics: clinical = amber, admin = grey,
 * warning = orange (auto-warnings), info = blue status, success = green.
 */
export default function Tag({
  label,
  variant = 'admin',
  icon,
  shape = 'tag',
  onClick,
  title,
  'aria-label': ariaLabel,
}: TagProps) {
  const c = VARIANT[variant]
  const sx = {
    font: 'inherit',
    fontSize: 12,
    fontWeight: shape === 'pill' || variant === 'warning' ? 600 : 500,
    px: shape === 'pill' ? 1.25 : 1,
    py: shape === 'pill' ? 0.5 : '3px',
    borderRadius: shape === 'pill' ? '12px' : 1.5,
    bgcolor: c.bg,
    color: c.fg,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.4,
    '& svg': { fontSize: 14 },
  }
  if (onClick) {
    return (
      <ButtonBase onClick={onClick} title={title} aria-label={ariaLabel} sx={sx}>
        {icon}
        {label}
      </ButtonBase>
    )
  }
  return (
    <Box component="span" title={title} aria-label={ariaLabel} sx={sx}>
      {icon}
      {label}
    </Box>
  )
}
