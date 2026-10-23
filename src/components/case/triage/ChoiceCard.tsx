import { Box, Radio } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

interface Props {
  readonly name: string
  readonly value: string
  readonly checked: boolean
  readonly onSelect: () => void
  readonly label: React.ReactNode
  readonly hint?: React.ReactNode
  readonly icon?: React.ReactNode
  /** Selected border/background colour; defaults to the primary blue. */
  readonly accent?: string
  readonly accentBg?: string
  /** Extra content shown inside the card when selected (e.g. retry time chips). */
  readonly children?: React.ReactNode
  readonly disabled?: boolean
}

/**
 * A radio option drawn as a bordered card: label, one-line hint and an optional
 * icon, as in step 2 "När och av vem?". A native radio keeps it keyboard-accessible.
 */
export function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  label,
  hint,
  icon,
  accent = tokens.primary,
  accentBg = tokens.selectedCardBg,
  children,
  disabled,
}: Props) {
  return (
    <Box
      component="label"
      sx={{
        display: 'flex',
        gap: 1.25,
        alignItems: 'flex-start',
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: '10px',
        // keep the outer size stable when the border grows to 2px
        p: checked ? '13px' : '14px',
        border: checked ? `2px solid ${accent}` : `1px solid ${tokens.border}`,
        bgcolor: checked ? accentBg : tokens.paper,
        opacity: disabled ? 0.5 : 1,
        '&:hover': disabled ? undefined : { borderColor: accent },
        '&:has(:focus-visible)': { outline: `2px solid ${accent}`, outlineOffset: 2 },
      }}
    >
      <Radio
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        size="small"
        sx={{ p: 0, mt: '1px', color: tokens.textMuted, '&.Mui-checked': { color: accent } }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1 }}>
        <Box
          component="span"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 600 }}
        >
          {icon}
          {label}
        </Box>
        {hint && (
          <Box
            component="span"
            sx={{ fontSize: 13, lineHeight: 1.45, color: tokens.textSecondary }}
          >
            {hint}
          </Box>
        )}
        {checked && children}
      </Box>
    </Box>
  )
}
