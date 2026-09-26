import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { ButtonBase, Menu, MenuItem } from '@mui/material'
import React, { useState } from 'react'

import { tokens } from '@/theme'

interface DropdownButtonProps<T extends string> {
  /** Text before the value, e.g. "Sortera:". */
  readonly label?: React.ReactNode
  readonly value: T
  readonly options: readonly { value: T; label: React.ReactNode }[]
  readonly onChange: (value: T) => void
  readonly icon?: React.ReactNode
  readonly 'aria-label': string
}

/** Compact outlined "Label: Value ▾" button that opens a menu (sort and filter pickers). */
export default function DropdownButton<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  'aria-label': ariaLabel,
}: DropdownButtonProps<T>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const current = options.find((o) => o.value === value)
  return (
    <>
      <ButtonBase
        aria-label={ariaLabel}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          font: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          color: tokens.text2,
          px: 1.25,
          py: 0.75,
          border: `1px solid ${tokens.inputBorder}`,
          borderRadius: 2,
          bgcolor: tokens.paper,
          '& svg': { fontSize: 16 },
          '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
        }}
      >
        {icon}
        {label}
        <strong style={{ fontWeight: 600 }}>{current?.label}</strong>
        <ArrowDropDownIcon />
      </ButtonBase>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            selected={o.value === value}
            onClick={() => {
              onChange(o.value)
              setAnchor(null)
            }}
          >
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
