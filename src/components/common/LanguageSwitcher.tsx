import LanguageIcon from '@mui/icons-material/Language'
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'sv', label: 'Svenska' },
  { code: 'en', label: 'English' },
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          color="inherit"
          aria-label={t('common.language')}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={i18n.language === lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code)
              setAnchorEl(null)
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
