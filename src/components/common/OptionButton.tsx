import CheckIcon from '@mui/icons-material/Check'
import { Box, ButtonBase } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

interface OptionButtonProps {
  readonly selected: boolean
  readonly onClick: () => void
  readonly label: React.ReactNode
  readonly icon?: React.ReactNode
  /** Secondary text; rendered below the label for `solid`, inline for `chip`. */
  readonly sub?: React.ReactNode
  /**
   * `solid` = rectangular, filled primary when selected (single-choice form steps).
   * `chip` = rounded, light-blue with a check when selected (multi-choice).
   */
  readonly variant?: 'solid' | 'chip'
  readonly disabled?: boolean
  readonly role?: string
}

/** Selectable option used for the triage steps and similar pick-one/pick-many lists. */
export default function OptionButton({
  selected,
  onClick,
  label,
  icon,
  sub,
  variant = 'solid',
  disabled,
  role = 'radio',
}: OptionButtonProps) {
  const chip = variant === 'chip'
  const stacked = !chip && sub !== undefined
  return (
    <ButtonBase
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      sx={{
        font: 'inherit',
        fontWeight: 500,
        px: chip ? 1.5 : 1.75,
        py: chip ? 0.75 : 1,
        borderRadius: chip ? '16px' : 2,
        border: '1px solid',
        borderColor: selected ? tokens.primary : tokens.inputBorder,
        bgcolor: selected ? (chip ? tokens.selectedBg : tokens.primary) : tokens.paper,
        color: selected ? (chip ? tokens.primaryDark : '#fff') : tokens.text,
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'flex-start' : 'center',
        gap: stacked ? '1px' : 0.75,
        opacity: disabled ? 0.5 : 1,
        '& svg': { fontSize: chip ? 16 : 18 },
        '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 2 },
      }}
    >
      {stacked ? (
        <>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {selected && '✓ '}
            {label}
          </Box>
          <Box component="span" sx={{ fontSize: 12, color: selected ? '#fff' : tokens.textSecondary }}>
            {sub}
          </Box>
        </>
      ) : (
        <>
          {chip && selected && <CheckIcon />}
          {icon && (
            <Box component="span" sx={{ display: 'inline-flex', color: chip ? tokens.textSecondary : 'inherit' }}>
              {icon}
            </Box>
          )}
          {label}
          {sub && (
            <Box component="span" sx={{ color: tokens.textSecondary, fontWeight: 400 }}>
              {sub}
            </Box>
          )}
        </>
      )}
    </ButtonBase>
  )
}
