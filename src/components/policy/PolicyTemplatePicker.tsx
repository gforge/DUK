import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import RouteIcon from '@mui/icons-material/Route'
import { Box, ButtonBase, Menu, MenuItem } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { tokens } from '@/theme'

interface Props {
  templates: readonly { id: string; name: string }[]
  value: string
  onChange: (id: string) => void
}

/** Outlined "Uppföljningsmall  <name> ▾" picker that scopes the policy rules. */
export default function PolicyTemplatePicker({ templates, value, onChange }: Props) {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const current = templates.find((jt) => jt.id === value)
  return (
    <>
      <ButtonBase
        aria-label={t('policy.selectTemplate')}
        aria-haspopup="listbox"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          font: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: '7px',
          minWidth: 260,
          border: `1px solid ${tokens.inputBorder}`,
          borderRadius: 2,
          bgcolor: tokens.paper,
          color: tokens.text,
          textAlign: 'left',
          '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
        }}
      >
        <RouteIcon sx={{ fontSize: 18, color: tokens.primary }} />
        <Box component="span" sx={{ color: tokens.textSecondary }}>
          {t('policy.templateLabel')}
        </Box>
        <Box component="strong" sx={{ fontWeight: 600 }}>
          {current?.name ?? t('policy.selectTemplate')}
        </Box>
        <ArrowDropDownIcon sx={{ ml: 'auto', fontSize: 20, color: tokens.textSecondary }} />
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { role: 'listbox' } }}
      >
        {templates.map((jt) => (
          <MenuItem
            key={jt.id}
            role="option"
            aria-selected={jt.id === value}
            selected={jt.id === value}
            onClick={() => {
              onChange(jt.id)
              setAnchor(null)
            }}
          >
            {jt.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
