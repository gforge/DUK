import FilterListIcon from '@mui/icons-material/FilterList'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import { PatientTable, RegisterPatientDialog } from '@/components/patients'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'

export default function Patients() {
  const { t } = useTranslation()
  const { isRole, currentUser } = useRole()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [palOnly, setPalOnly] = useState(false)
  const [selectedJourneyTemplateIds, setSelectedJourneyTemplateIds] = useState<string[]>([])

  const navigate = useNavigate()
  const { data: patients, loading, error } = useApi(() => client.getPatients(), [])
  const { data: allJourneys } = useApi(() => client.getPatientJourneys(), [])
  const { data: allEpisodes } = useApi(() => client.getEpisodesOfCare(), [])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const isClinician = isRole('NURSE') || isRole('DOCTOR')

  const journeyTemplateOptions = useMemo(
    () =>
      (journeyTemplates ?? []).map((jt) => ({
        id: jt.id,
        name: jt.name,
      })),
    [journeyTemplates],
  )

  const selectedJourneyTemplateOptions = useMemo(
    () => journeyTemplateOptions.filter((opt) => selectedJourneyTemplateIds.includes(opt.id)),
    [journeyTemplateOptions, selectedJourneyTemplateIds],
  )

  const patientJourneyTemplateIds = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const journey of allJourneys ?? []) {
      const set = map.get(journey.patientId) ?? new Set<string>()
      set.add(journey.journeyTemplateId)
      map.set(journey.patientId, set)
    }
    return map
  }, [allJourneys])

  const filtered = useMemo(
    () =>
      (patients ?? []).filter(
        (p) =>
          (!search.trim() ||
            p.displayName.toLowerCase().includes(search.toLowerCase()) ||
            p.personalNumber.includes(search)) &&
          (!palOnly || p.palId === currentUser.id) &&
          (selectedJourneyTemplateIds.length === 0 ||
            selectedJourneyTemplateIds.some((templateId) =>
              patientJourneyTemplateIds.get(p.id)?.has(templateId),
            )),
      ),
    [
      patients,
      search,
      palOnly,
      currentUser.id,
      selectedJourneyTemplateIds,
      patientJourneyTemplateIds,
    ],
  )

  const activeFilterCount = Number(palOnly) + Number(selectedJourneyTemplateIds.length > 0)

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            {t('patients.title')}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1}>
          {isClinician && (
            <Button
              variant="contained"
              startIcon={<PersonAddAltIcon />}
              disableElevation
              onClick={() => setRegisterOpen(true)}
            >
              {t('patients.register.action')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t('patients.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320 }}
        />
        {isClinician && (
          <Tooltip title={t('patients.filters.toggle')}>
            <IconButton
              color={showFilters || activeFilterCount > 0 ? 'primary' : 'default'}
              onClick={() => setShowFilters((v) => !v)}
              aria-label={t('patients.filters.toggle')}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {isClinician && (
        <Collapse in={showFilters}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            gap={1.5}
            sx={{ mb: 2 }}
          >
            <Button
              variant={palOnly ? 'contained' : 'outlined'}
              onClick={() => setPalOnly((v) => !v)}
            >
              {t('patients.filters.pal')}
            </Button>

            <Autocomplete
              multiple
              size="small"
              options={journeyTemplateOptions}
              value={selectedJourneyTemplateOptions}
              onChange={(_, values) => setSelectedJourneyTemplateIds(values.map((v) => v.id))}
              getOptionLabel={(option) => option.name}
              sx={{ minWidth: 320, maxWidth: 520 }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label={t('patients.filters.journeys')} />
              )}
            />

            <Button
              variant="text"
              onClick={() => {
                setPalOnly(false)
                setSelectedJourneyTemplateIds([])
              }}
              disabled={!palOnly && selectedJourneyTemplateIds.length === 0}
            >
              {t('patients.filters.clear')}
            </Button>
          </Stack>
        </Collapse>
      )}

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <PatientTable
          patients={filtered}
          journeys={allJourneys ?? []}
          episodes={allEpisodes ?? []}
          journeyTemplates={journeyTemplates ?? []}
          isClinician={isClinician}
          currentUserId={currentUser.id}
        />
      )}

      <RegisterPatientDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={(patientId) => navigate(`/patients/${patientId}`)}
      />
    </Box>
  )
}
