import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import * as client from '@/api/client'
import {
  AuditLogTab,
  FormResponsesTab,
  JournalTab,
  JourneyTab,
  NurseContactActions,
  PatientCard,
  TriageTab,
} from '@/components/case'
import { AutoWarningsBadge, StatusChip } from '@/components/common'
import { useApi } from '@/hooks/useApi'
import { useHotkeys } from '@/hooks/useHotkeys'

import { getCaseDetailBackPath } from '../utils/caseDetailBackPath'

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
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const didAutoSelectTab = useRef(false)

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
        setActiveTab(2) // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
  }, [caseData])

  useHotkeys(
    useMemo(
      () => ({
        'g d': () => navigate('/dashboard'),
        'g c': () => {}, // already here
      }),
      [navigate],
    ),
  )

  const handlePatientBack = useCallback(
    () => navigate(caseData ? `/patients/${caseData.patientId}` : '/patients'),
    [navigate, caseData],
  )

  const handleBackButton = useCallback(() => {
    navigate(getCaseDetailBackPath(caseData ?? undefined))
  }, [navigate, caseData])

  const loading = caseLoading || patientLoading

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={120} sx={{ my: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
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

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard')}
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon fontSize="inherit" />
          {t('nav.dashboard')}
        </Link>
        <Link component="button" variant="body2" onClick={handlePatientBack} underline="hover">
          {patient?.displayName ?? caseData.patientId}
        </Link>
        <Typography variant="body2" color="text.primary">
          {t('case.title')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>
          {t('case.title')}
        </Typography>
        <StatusChip status={caseData.status} size="medium" />
        <Chip label={t(`category.${caseData.category}`)} variant="outlined" size="small" />
        {caseData.policyWarnings.length > 0 && (
          <AutoWarningsBadge
            warnings={caseData.policyWarnings}
            lastActivityAt={caseData.lastActivityAt}
          />
        )}
      </Stack>

      {/* Patient card */}
      {patient && <PatientCard patient={patient} caseData={caseData} />}

      {/* Nurse contact action panel — shown when SEEK_CONTACT / NOT_OPENED triggers are active */}
      <NurseContactActions caseData={caseData} onRefetch={refetchCase} />

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          aria-label="case detail tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('case.tab_forms')} id="case-tab-0" aria-controls="case-tabpanel-0" />
          <Tab label={t('case.tab_journey')} id="case-tab-1" aria-controls="case-tabpanel-1" />
          <Tab
            label={
              <Badge
                color="error"
                variant="dot"
                invisible={!['NEW', 'NEEDS_REVIEW'].includes(caseData.status)}
                sx={{ pr: 1 }}
              >
                {t('case.tab_triage')}
              </Badge>
            }
            id="case-tab-2"
            aria-controls="case-tabpanel-2"
          />
          <Tab label={t('case.tab_journal')} id="case-tab-3" aria-controls="case-tabpanel-3" />
          <Tab label={t('case.tab_audit')} id="case-tab-4" aria-controls="case-tabpanel-4" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            <FormResponsesTab caseId={caseData.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <JourneyTab caseData={caseData} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <TriageTab caseData={caseData} onTriaged={refetchCase} />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <JournalTab
              caseData={caseData}
              patient={patient ?? undefined}
              onCaseChange={refetchCase}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <AuditLogTab caseId={caseData.id} />
          </TabPanel>
        </Box>
      </Paper>

      {/* Back button */}
      <Box sx={{ mt: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackButton} variant="outlined">
          {t('common.back')}
        </Button>
      </Box>
    </Box>
  )
}
