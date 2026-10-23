import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import FilterListIcon from '@mui/icons-material/FilterList'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import { DropdownButton, PageHeader, SegmentedControl } from '@/components/common'
import { PatientTable, RegisterPatientDialog } from '@/components/patients'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { tokens } from '@/theme'

type Scope = 'all' | 'mine' | 'withoutActiveJourney'
const ALL_TEMPLATES = '__all__'

const normalizePnr = (value: string) => value.replace(/[-+\s]/g, '')

export default function Patients() {
  const { t } = useTranslation()
  const { isRole, currentUser } = useRole()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [journeyTemplateId, setJourneyTemplateId] = useState<string>(ALL_TEMPLATES)
  const navigate = useNavigate()
  const { data: patients, loading, error } = useApi(() => client.getPatients(), [])
  const { data: allJourneys } = useApi(() => client.getPatientJourneys(), [])
  const { data: allEpisodes } = useApi(() => client.getEpisodesOfCare(), [])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const isClinician = isRole('NURSE') || isRole('DOCTOR')

  // Current user is PAL when set as the patient's PAL or responsible for an active journey
  const palPatientIds = useMemo(() => {
    const ids = new Set<string>()
    if (!isClinician) return ids
    const palByPatientId = new Map((patients ?? []).map((p) => [p.id, p.palId]))
    const episodesById = new Map((allEpisodes ?? []).map((e) => [e.id, e]))
    for (const [patientId, palId] of palByPatientId) {
      if (palId === currentUser.id) ids.add(patientId)
    }
    for (const journey of allJourneys ?? []) {
      if (journey.status !== 'ACTIVE' || journey.responsiblePhysicianUserId === null) continue
      const episodeOwner = journey.episodeId
        ? episodesById.get(journey.episodeId)?.responsibleUserId
        : undefined
      const responsible =
        journey.responsiblePhysicianUserId ?? episodeOwner ?? palByPatientId.get(journey.patientId)
      if (responsible === currentUser.id) ids.add(journey.patientId)
    }
    return ids
  }, [isClinician, patients, allEpisodes, allJourneys, currentUser.id])

  const journeyIndex = useMemo(() => {
    const templatesByPatient = new Map<string, Set<string>>()
    const withActive = new Set<string>()
    for (const journey of allJourneys ?? []) {
      const set = templatesByPatient.get(journey.patientId) ?? new Set<string>()
      set.add(journey.journeyTemplateId)
      templatesByPatient.set(journey.patientId, set)
      if (journey.status === 'ACTIVE') withActive.add(journey.patientId)
    }
    return { templatesByPatient, withActive }
  }, [allJourneys])

  const journeyTemplateOptions = useMemo(() => {
    const inUse = new Set((allJourneys ?? []).map((j) => j.journeyTemplateId))
    return [
      { value: ALL_TEMPLATES, label: t('patients.journeyFilter.all') },
      ...(journeyTemplates ?? [])
        .filter((jt) => inUse.has(jt.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((jt) => ({ value: jt.id, label: jt.name })),
    ]
  }, [allJourneys, journeyTemplates, t])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const pnrQuery = normalizePnr(query)
    return (patients ?? []).filter(
      (p) =>
        (!query ||
          p.displayName.toLowerCase().includes(query) ||
          (pnrQuery !== '' && normalizePnr(p.personalNumber).includes(pnrQuery))) &&
        (scope !== 'mine' || palPatientIds.has(p.id)) &&
        (scope !== 'withoutActiveJourney' || !journeyIndex.withActive.has(p.id)) &&
        (journeyTemplateId === ALL_TEMPLATES ||
          journeyIndex.templatesByPatient.get(p.id)?.has(journeyTemplateId) === true),
    )
  }, [patients, search, scope, palPatientIds, journeyIndex, journeyTemplateId])

  const total = patients?.length ?? 0
  const subtitle = patients
    ? [
        t('patients.summary', { count: total }),
        ...(isClinician ? [t('patients.summaryPal', { count: palPatientIds.size })] : []),
      ].join(' · ')
    : undefined

  return (
    <Stack sx={{ gap: 2.5 }}>
      <PageHeader
        title={t('patients.title')}
        subtitle={subtitle}
        actions={
          isClinician && (
            <Button
              variant="contained"
              startIcon={<PersonAddAltIcon />}
              disableElevation
              onClick={() => setRegisterOpen(true)}
              sx={{ fontWeight: 600, px: 1.75, py: 1, borderRadius: 2 }}
            >
              {t('patients.register.action')}
            </Button>
          )
        }
      />

      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('patients.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': { height: 36, bgcolor: tokens.paper, borderRadius: 2 },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.inputBorder },
          }}
          slotProps={{
            htmlInput: { 'aria-label': t('patients.searchPlaceholder') },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: tokens.textMuted }} />
                </InputAdornment>
              ),
            },
          }}
        />
        {isClinician && (
          <>
            <SegmentedControl<Scope>
              aria-label={t('patients.filters.label')}
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: t('patients.filters.all') },
                {
                  value: 'mine',
                  label: t('patients.filters.mine'),
                  icon: <AssignmentIndIcon sx={{ fontSize: 16 }} />,
                },
                {
                  value: 'withoutActiveJourney',
                  label: t('patients.filters.withoutActiveJourney'),
                },
              ]}
            />
            <Box sx={{ ml: 'auto' }}>
              <DropdownButton
                aria-label={t('patients.journeyFilter.ariaLabel')}
                icon={<FilterListIcon />}
                label={`${t('patients.journeyFilter.label')}:`}
                value={journeyTemplateId}
                options={journeyTemplateOptions}
                onChange={setJourneyTemplateId}
              />
            </Box>
          </>
        )}
      </Stack>

      <Alert severity="info">{t('patients.fictitiousPnr')}</Alert>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <PatientTable
          patients={filtered}
          journeys={allJourneys ?? []}
          journeyTemplates={journeyTemplates ?? []}
          palPatientIds={palPatientIds}
        />
      )}

      <RegisterPatientDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={(patientId) => navigate(`/patients/${patientId}`)}
      />
    </Stack>
  )
}
