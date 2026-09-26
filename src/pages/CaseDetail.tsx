import { Alert, Badge, Box, Breadcrumbs, Link, Skeleton, Stack, Tab, Tabs } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import * as client from '@/api/client'
import {
  AuditLogTab,
  CaseHeader,
  ContactActions,
  FormResponsesTab,
  JournalTab,
  JourneyTab,
  TriageTab,
} from '@/components/case'
import { routeSegmentToContactMode } from '@/components/case/triage/routeContactMode'
import { useApi } from '@/hooks/useApi'
import { useHotkeys } from '@/hooks/useHotkeys'
import { tokens } from '@/theme'

interface TabPanelProps {
  readonly children: React.ReactNode
  readonly value: number
  readonly index: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
    >
      {value === index && children}
    </div>
  )
}

const TRIAGE_TAB = 2

export default function CaseDetail() {
  const { id, triageMode } = useParams<{
    id: string
    triageMode?: string
  }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const didAutoSelectTab = useRef(false)
  const routeContactMode = routeSegmentToContactMode(triageMode)
  const tabValue = routeContactMode ? TRIAGE_TAB : activeTab
  const {
    data: caseData,
    loading: caseLoading,
    error: caseError,
    refetch: refetchCase,
  } = useApi(() => client.getCase(id!), [id])
  const { data: patient, loading: patientLoading } = useApi(
    () => (caseData ? client.getPatient(caseData.patientId) : Promise.resolve(undefined)),
    [caseData?.patientId],
  )
  useEffect(() => {
    if (!didAutoSelectTab.current && caseData) {
      didAutoSelectTab.current = true
      if (['NEW', 'NEEDS_REVIEW'].includes(caseData.status)) {
        setActiveTab(TRIAGE_TAB) // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
  }, [caseData])
  useEffect(() => {
    if (triageMode && !routeContactMode && id) {
      navigate(`/cases/${id}`, { replace: true })
    }
  }, [triageMode, routeContactMode, navigate, id])
  useHotkeys(
    useMemo(
      () => ({
        'g d': () => navigate('/dashboard'),
        'g c': () => {}, // already here
      }),
      [navigate],
    ),
  )
  // Only block on the first load; refetches keep the page (and any in-progress triage form) mounted.
  const loading = (caseLoading && !caseData) || (patientLoading && !patient)
  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" sx={{ width: 300, height: 40 }} />
        <Skeleton variant="rectangular" sx={{ my: 2, borderRadius: 2, height: 120 }} />
        <Skeleton variant="rectangular" sx={{ borderRadius: 2, height: 400 }} />
      </Box>
    )
  }
  if (caseError || !caseData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {caseError ?? 'Case not found'}
      </Alert>
    )
  }
  const needsTriage = ['NEW', 'NEEDS_REVIEW'].includes(caseData.status)

  return (
    <Stack sx={{ gap: 2.5 }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          fontSize: 13,
          color: tokens.textSecondary,
          '& .MuiBreadcrumbs-separator': { mx: 0.75 },
        }}
      >
        <Link component={RouterLink} to="/dashboard" underline="hover" sx={{ fontSize: 'inherit' }}>
          {t('nav.dashboard')}
        </Link>
        <Link
          component={RouterLink}
          to={`/patients/${caseData.patientId}`}
          underline="hover"
          title={t('patients.openView')}
          sx={{ fontSize: 'inherit' }}
        >
          {patient?.displayName ?? caseData.patientId}
        </Link>
      </Breadcrumbs>

      <CaseHeader caseData={caseData} patient={patient} />

      {/* Contact action panel — shown when SEEK_CONTACT / NOT_OPENED triggers are active */}
      <ContactActions caseData={caseData} onRefetch={refetchCase} />

      <Box>
        <Tabs
          value={tabValue}
          onChange={(_, v: number) => {
            setActiveTab(v)
            if (v !== TRIAGE_TAB && id && triageMode) {
              navigate(`/cases/${id}`, { replace: true })
            }
          }}
          aria-label="case detail tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 0,
            borderBottom: `1px solid ${tokens.border}`,
            '& .MuiTabs-flexContainer': { gap: 0.5 },
            '& .MuiTabs-indicator': { height: 2 },
            '& .MuiTab-root': {
              minHeight: 0,
              minWidth: 0,
              px: 1.75,
              py: 1.25,
              fontSize: 14,
              fontWeight: 400,
              textTransform: 'none',
              color: tokens.textSecondary,
            },
            '& .MuiTab-root.Mui-selected': { color: tokens.primary, fontWeight: 600 },
          }}
        >
          <Tab label={t('case.tab_forms')} id="case-tab-0" aria-controls="case-tabpanel-0" />
          <Tab label={t('case.tab_journey')} id="case-tab-1" aria-controls="case-tabpanel-1" />
          <Tab
            label={
              <Badge color="error" variant="dot" invisible={!needsTriage} sx={{ pr: 1 }}>
                {t('case.tab_triage')}
              </Badge>
            }
            id="case-tab-2"
            aria-controls="case-tabpanel-2"
          />
          <Tab label={t('case.tab_journal')} id="case-tab-3" aria-controls="case-tabpanel-3" />
          <Tab label={t('case.tab_audit')} id="case-tab-4" aria-controls="case-tabpanel-4" />
        </Tabs>

        <Box sx={{ pt: 2.5 }}>
          <TabPanel value={tabValue} index={0}>
            <FormResponsesTab caseId={caseData.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <JourneyTab caseData={caseData} />
          </TabPanel>

          <TabPanel value={tabValue} index={TRIAGE_TAB}>
            <TriageTab
              caseData={caseData}
              onTriaged={refetchCase}
              routeContactMode={routeContactMode}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <JournalTab
              caseData={caseData}
              patient={patient ?? undefined}
              onCaseChange={refetchCase}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <AuditLogTab caseId={caseData.id} />
          </TabPanel>
        </Box>
      </Box>
    </Stack>
  )
}
