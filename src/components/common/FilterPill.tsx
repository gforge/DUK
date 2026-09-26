import { ButtonBase } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

interface FilterPillProps {
  readonly selected: boolean
  readonly onClick: () => void
  readonly label: React.ReactNode
  readonly icon?: React.ReactNode
}

/** Rounded on/off toggle for quick filters ("Mina tilldelade", "Mina patienter"). */
export default function FilterPill({ selected, onClick, label, icon }: FilterPillProps) {
  return (
    <ButtonBase
      role="switch"
      aria-checked={selected}
      onClick={onClick}
      sx={{
        font: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: selected ? tokens.primary : tokens.inputBorder,
        bgcolor: selected ? tokens.selectedBg : tokens.paper,
        color: selected ? tokens.primaryDark : tokens.text2,
        fontWeight: selected ? 600 : 400,
        '& svg': { fontSize: 16 },
        '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
      }}
    >
      {icon}
      {label}
    </ButtonBase>
  )
}
