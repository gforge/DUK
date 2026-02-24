import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useRole } from '../store/roleContext'
import { useHotkeys } from '../hooks/useHotkeys'
import { useFocusRestore } from '../hooks/useFocusRestore'
import * as client from '../api/client'
import type { Case, CaseCategory, Patient } from '../api/schemas'
import QueueColumn from '../components/dashboard/QueueColumn'

type PalFilter = 'all' | 'mine' | 'created_by_me'

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentUser, isRole } = useRole()
  const { restore } = useFocusRestore()
  const searchRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [palFilter, setPalFilter] = useState<PalFilter>('all')

  // Restore focus when coming back from a case
  useEffect(() => {
    restore()
  }, [restore])

  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch,
  } = useApi(() => client.getCases(), [])
  const { data: patients, loading: patientsLoading } = useApi(() => client.getPatients(), [])

  // Hotkeys
  useHotkeys(
    useMemo(
      () => ({
        '/': () => searchRef.current?.focus(),
        'g d': () => navigate('/dashboard'),
      }),
      [navigate],
    ),
  )

  const patientMap = useMemo(() => {
    const m = new Map<string, Patient>()
    patients?.forEach((p) => m.set(p.id, p))
    return m
  }, [patients])

  const filteredCases = useMemo(() => {
    if (!cases) return []
    return cases.filter((c) => {
      // PAL filter
      if (palFilter === 'mine') {
        const patient = patientMap.get(c.patientId)
        if (patient?.palId !== currentUser.id) return false
      }
      if (palFilter === 'created_by_me') {
        if (c.createdByUserId !== currentUser.id && c.triagedByUserId !== currentUser.id)
          return false
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const patient = patientMap.get(c.patientId)
        const nameMatch = patient?.displayName.toLowerCase().includes(q)
        const idMatch = c.id.toLowerCase().includes(q) || c.patientId.toLowerCase().includes(q)
        if (!nameMatch && !idMatch) return false
      }

      return true
    })
  }, [cases, palFilter, currentUser.id, search, patientMap])

  const byCategory = useCallback(
    (cat: CaseCategory) => filteredCases.filter((c) => c.category === cat),
    [filteredCases],
  )

  const loading = casesLoading || patientsLoading

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('dashboard.title')}
      </Typography>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            inputRef={searchRef}
            size="small"
            placeholder={t('dashboard.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 240 }}
            aria-label={t('dashboard.search')}
          />

          {isRole('PAL', 'DOCTOR', 'NURSE') && (
            <ToggleButtonGroup
              value={palFilter}
              exclusive
              onChange={(_, v) => v && setPalFilter(v)}
              size="small"
              aria-label="patient filter"
            >
              <ToggleButton value="all" aria-label={t('dashboard.filterAll')}>
                {t('dashboard.filterAll')}
              </ToggleButton>
              {isRole('PAL') && (
                <ToggleButton value="mine" aria-label={t('dashboard.filterMine')}>
                  {t('dashboard.filterMine')}
                </ToggleButton>
              )}
              <ToggleButton value="created_by_me" aria-label={t('dashboard.filterCreatedByMe')}>
                {t('dashboard.filterCreatedByMe')}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Paper>

      {casesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {casesError}
        </Alert>
      )}

      {loading ? (
        <Stack direction={{ xs: 'column', lg: 'row' }} gap={2}>
          {[0, 1, 2].map((i) => (
            <Box key={i} flex={1}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems="flex-start">
          <QueueColumn
            category="ACUTE"
            cases={byCategory('ACUTE')}
            patients={patientMap}
            onRefresh={refetch}
          />
          <QueueColumn
            category="SUBACUTE"
            cases={byCategory('SUBACUTE')}
            patients={patientMap}
            onRefresh={refetch}
          />
          <QueueColumn
            category="CONTROL"
            cases={byCategory('CONTROL')}
            patients={patientMap}
            onRefresh={refetch}
          />
        </Stack>
      )}
    </Box>
  )
}
