import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect,useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { CaseCategory, Patient } from '@/api/schemas'
import DashboardToolbar from '@/components/dashboard/DashboardToolbar'
import QueueColumn from '@/components/dashboard/QueueColumn'
import type { SortMode } from '@/components/dashboard/sortCases'
import { sortCases } from '@/components/dashboard/sortCases'
import { useApi } from '@/hooks/useApi'
import { useFocusRestore } from '@/hooks/useFocusRestore'
import { useHotkeys } from '@/hooks/useHotkeys'
import { useRole } from '@/store/roleContext'

type PalFilter = 'all' | 'mine' | 'created_by_me'

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentUser, isRole } = useRole()
  const { restore } = useFocusRestore()
  const searchRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [palFilter, setPalFilter] = useState<PalFilter>('all')
  const [showWaiting, setShowWaiting] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [expanded, setExpanded] = useState<Set<CaseCategory>>(new Set())

  const toggleExpanded = useCallback((cat: CaseCategory) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  useEffect(() => {
    restore()
  }, [restore])

  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch,
  } = useApi(() => client.getCasesForDashboard(), [])
  const { data: patients, loading: patientsLoading } = useApi(() => client.getPatients(), [])

  useHotkeys(
    useMemo(
      () => ({ '/': () => searchRef.current?.focus(), 'g d': () => navigate('/dashboard') }),
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
      if (palFilter === 'mine') {
        if (patientMap.get(c.patientId)?.palId !== currentUser.id) return false
      }
      if (palFilter === 'created_by_me') {
        if (c.createdByUserId !== currentUser.id && c.triagedByUserId !== currentUser.id)
          return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const patient = patientMap.get(c.patientId)
        if (
          !patient?.displayName.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q) &&
          !c.patientId.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [cases, palFilter, currentUser.id, search, patientMap])

  const { activeCases, waitingCases } = useMemo(() => {
    const active = filteredCases.filter((c) => c.activeCategory !== null)
    const waiting = filteredCases.filter((c) => c.activeCategory === null)
    return { activeCases: active, waitingCases: waiting }
  }, [filteredCases])

  const effectiveShowWaiting = showWaiting || search.trim().length > 0
  const sortedActiveCases = useMemo(
    () => sortCases(activeCases, sortMode, patientMap),
    [activeCases, sortMode, patientMap],
  )
  const sortedWaitingCases = useMemo(
    () => sortCases(waitingCases, sortMode, patientMap),
    [waitingCases, sortMode, patientMap],
  )

  const byCategory = useCallback(
    (cat: CaseCategory) => sortedActiveCases.filter((c) => c.activeCategory === cat),
    [sortedActiveCases],
  )
  const waitingByCategory = useCallback(
    (cat: CaseCategory) =>
      effectiveShowWaiting ? sortedWaitingCases.filter((c) => c.category === cat) : [],
    [sortedWaitingCases, effectiveShowWaiting],
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('dashboard.title')}
      </Typography>

      <DashboardToolbar
        searchRef={searchRef}
        search={search}
        onSearch={setSearch}
        palFilter={palFilter}
        onPalFilter={setPalFilter}
        sortMode={sortMode}
        onSortMode={setSortMode}
        showWaiting={showWaiting}
        onToggleWaiting={() => setShowWaiting((v) => !v)}
        waitingCount={waitingCases.length}
        showPalFilter={isRole('PAL', 'DOCTOR', 'NURSE')}
        showMineFilter={isRole('PAL')}
      />

      {casesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {casesError}
        </Alert>
      )}

      {casesLoading || patientsLoading ? (
        <Stack gap={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : (
        <Stack gap={1.5}>
          {(['ACUTE', 'SUBACUTE', 'CONTROL'] as CaseCategory[]).map((cat) => (
            <QueueColumn
              key={cat}
              category={cat}
              cases={byCategory(cat)}
              waitingCases={waitingByCategory(cat)}
              patients={patientMap}
              onRefresh={refetch}
              expanded={expanded.has(cat)}
              onToggle={() => toggleExpanded(cat)}
              sortMode={sortMode}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
