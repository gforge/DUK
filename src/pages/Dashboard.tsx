import { Alert, Skeleton, Stack } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { CaseCategory, Patient } from '@/api/schemas'
import { PageHeader } from '@/components/common'
import type { PalFilter, SortMode } from '@/components/dashboard'
import {
  DashboardToolbar,
  LONG_WAIT_DAYS,
  QueueColumn,
  sortCases,
  waitedDays,
} from '@/components/dashboard'
import { useApi } from '@/hooks/useApi'
import { useCollapsedSections } from '@/hooks/useCollapsedSections'
import { useFocusRestore } from '@/hooks/useFocusRestore'
import { useHotkeys } from '@/hooks/useHotkeys'
import { useRovingTabIndex } from '@/hooks/useRovingTabIndex'
import { useRole } from '@/store/roleContext'

const CATEGORIES: CaseCategory[] = ['ACUTE', 'SUBACUTE', 'CONTROL']

const toggleIn = (prev: Set<CaseCategory>, cat: CaseCategory) => {
  const next = new Set(prev)
  if (next.has(cat)) next.delete(cat)
  else next.add(cat)
  return next
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentUser, isRole } = useRole()
  const { restore } = useFocusRestore()
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [palFilter, setPalFilter] = useState<PalFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [showWaiting, setShowWaiting] = useState<Set<CaseCategory>>(() => new Set())
  const [showClosed, setShowClosed] = useState<Set<CaseCategory>>(() => new Set())
  const sectionsState = useCollapsedSections<CaseCategory>('dashboard.collapsedCategories')
  useEffect(() => {
    restore()
  }, [restore])
  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
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
  const { activeCases, waitingCases, closedCases } = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoMs = sevenDaysAgo.getTime()
    const active = filteredCases.filter((c) => c.status !== 'CLOSED' && c.activeCategory !== null)
    const waiting = filteredCases.filter((c) => c.status !== 'CLOSED' && c.activeCategory === null)
    const closed = filteredCases.filter((c) => {
      if (c.status !== 'CLOSED') return false
      const ts = c.closedAt ?? c.lastActivityAt
      return new Date(ts).getTime() >= sevenDaysAgoMs
    })
    return { activeCases: active, waitingCases: waiting, closedCases: closed }
  }, [filteredCases])
  const searchActive = search.trim().length > 0
  const sortedActiveCases = useMemo(
    () => sortCases(activeCases, sortMode, patientMap),
    [activeCases, sortMode, patientMap],
  )
  const sortedWaitingCases = useMemo(
    () => sortCases(waitingCases, sortMode, patientMap),
    [waitingCases, sortMode, patientMap],
  )

  const sections = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat,
        cases: sortedActiveCases.filter((c) => c.activeCategory === cat),
        waitingCases: sortedWaitingCases.filter((c) => c.category === cat),
        closedCases: closedCases.filter((c) => c.category === cat),
        waitingVisible: searchActive || showWaiting.has(cat),
        closedVisible: showClosed.has(cat),
        open: sectionsState.isOpen(cat),
      })),
    [
      sortedActiveCases,
      sortedWaitingCases,
      closedCases,
      searchActive,
      showWaiting,
      showClosed,
      sectionsState,
    ],
  )

  // One roving tab index across all sections (rows are queried in DOM order).
  const sectionRowCounts = sections.map((s) =>
    !s.open
      ? 0
      : s.cases.length +
        (s.waitingVisible ? s.waitingCases.length : 0) +
        (s.closedVisible ? s.closedCases.length : 0),
  )
  const totalRows = sectionRowCounts.reduce((a, b) => a + b, 0)
  const { getItemProps } = useRovingTabIndex(totalRows)
  const sectionOffset = (idx: number) => sectionRowCounts.slice(0, idx).reduce((a, b) => a + b, 0)

  const subtitle = useMemo(() => {
    const now = new Date()
    const awaitingTriage = activeCases.filter(
      (c) => c.status === 'NEW' || c.status === 'NEEDS_REVIEW',
    ).length
    const longWait = activeCases.filter((c) => waitedDays(c, now) >= LONG_WAIT_DAYS).length
    return [
      t('dashboard.subtitleAwaitingTriage', { count: awaitingTriage }),
      longWait > 0
        ? t('dashboard.subtitleLongWait', { count: longWait, days: LONG_WAIT_DAYS })
        : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [activeCases, t])

  const toggleWaiting = useCallback(
    (cat: CaseCategory) => setShowWaiting((prev) => toggleIn(prev, cat)),
    [],
  )
  const toggleClosed = useCallback(
    (cat: CaseCategory) => setShowClosed((prev) => toggleIn(prev, cat)),
    [],
  )

  const loading = casesLoading || patientsLoading

  return (
    <Stack sx={{ gap: 2.5 }}>
      <PageHeader title={t('dashboard.title')} subtitle={loading ? undefined : subtitle} />

      <DashboardToolbar
        searchRef={searchRef}
        search={search}
        onSearch={setSearch}
        palFilter={palFilter}
        onPalFilter={setPalFilter}
        sortMode={sortMode}
        onSortMode={setSortMode}
        showPalFilter={isRole('DOCTOR', 'NURSE')}
        showMineFilter={isRole('DOCTOR', 'NURSE')}
        allCollapsed={sections.every((s) => !s.open)}
        onToggleAll={() => sectionsState.toggleAll(CATEGORIES)}
      />

      {casesError && <Alert severity="error">{casesError}</Alert>}

      {loading
        ? [0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" sx={{ borderRadius: 3, height: 120 }} />
          ))
        : sections.map((s, idx) => {
            const offset = sectionOffset(idx)
            return (
              <QueueColumn
                key={s.category}
                category={s.category}
                cases={s.cases}
                waitingCases={s.waitingCases}
                closedCases={s.closedCases}
                patients={patientMap}
                showWaiting={s.waitingVisible}
                onToggleWaiting={searchActive ? undefined : () => toggleWaiting(s.category)}
                showClosed={s.closedVisible}
                onToggleClosed={() => toggleClosed(s.category)}
                open={s.open}
                onToggleOpen={() => sectionsState.toggle(s.category)}
                getItemProps={(i) => getItemProps(offset + i)}
              />
            )
          })}
    </Stack>
  )
}
