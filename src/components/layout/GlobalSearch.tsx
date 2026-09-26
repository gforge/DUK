import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  ButtonBase,
  Dialog,
  DialogContent,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { Patient } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'
import { useRole } from '@/store/roleContext'
import { tokens } from '@/theme'
const MAX_RESULTS = 10
export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isRole } = useRole()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const hasFetched = useRef(false)
  const isClinician = isRole('NURSE', 'DOCTOR')
  function handleOpen() {
    setOpen(true)
    if (!hasFetched.current) {
      hasFetched.current = true
      client
        .getPatients()
        .then(setPatients)
        .catch(() => {})
    }
  }
  function handleClose() {
    setOpen(false)
    setQuery('')
  }
  function handleSelect(patient: Patient) {
    handleClose()
    navigate(`/patients/${patient.id}`)
  }
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return patients.slice(0, MAX_RESULTS)
    return patients
      .filter((p) => p.displayName.toLowerCase().includes(q) || p.personalNumber.includes(q))
      .slice(0, MAX_RESULTS)
  }, [patients, query])
  if (!isClinician) return null
  return (
    <>
      <ButtonBase
        aria-label={t('common.search')}
        onClick={handleOpen}
        sx={{
          font: 'inherit',
          width: '100%',
          maxWidth: 420,
          height: 36,
          borderRadius: 2,
          bgcolor: tokens.greyFill,
          color: tokens.textSecondary,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          px: 1.5,
          gap: 1,
          '&:hover': { bgcolor: tokens.segmentBg },
          '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
        }}
      >
        <SearchIcon sx={{ fontSize: 18 }} />
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('common.searchPatients')}
        </Box>
      </ButtonBase>

      <Dialog open={open} onClose={handleClose} fullWidth sx={{ maxWidth: 'sm' }}>
        <DialogContent sx={{ p: 0 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder={t('common.searchPatients')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { border: 0 },
              '& .MuiOutlinedInput-root': { borderRadius: 0 },
            }}
          />
          <Divider />
          {filtered.length === 0 && query.trim() ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.searchNoResults')}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filtered.map((patient) => (
                <ListItemButton key={patient.id} onClick={() => handleSelect(patient)} divider>
                  <PersonIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 'small' }} />
                  <ListItemText
                    primary={patient.displayName}
                    secondary={formatPersonnummer(patient.personalNumber)}
                    slotProps={{ secondary: { variant: 'caption' } }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
