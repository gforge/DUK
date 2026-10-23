import { Box, ButtonBase } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

export interface SegmentOption<T extends string> {
  readonly value: T
  readonly label: React.ReactNode
  readonly icon?: React.ReactNode
}

interface SegmentedControlProps<T extends string> {
  readonly value: T
  readonly options: readonly SegmentOption<T>[]
  readonly onChange: (value: T) => void
  readonly 'aria-label': string
}

/** Grey pill group with a white raised selected segment (filters, sub-tabs). */
export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        gap: 0.5,
        bgcolor: tokens.segmentBg,
        p: '3px',
        borderRadius: 2,
        alignSelf: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <ButtonBase
            key={o.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            sx={{
              font: 'inherit',
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              gap: 0.75,
              fontWeight: selected ? 600 : 500,
              bgcolor: selected ? tokens.paper : 'transparent',
              color: selected ? tokens.text : tokens.text2,
              boxShadow: selected ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
              '& svg': { fontSize: 18 },
              '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
            }}
          >
            {o.icon}
            {o.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
