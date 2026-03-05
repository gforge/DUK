import React, { useState, useMemo } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import PersonIcon from '@mui/icons-material/Person'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/hooks/useApi'
import * as client from '@/api/client'
import { useRole } from '@/store/roleContext'
import PatientTable from '@/components/patients/PatientTable'
import RegisterPatientDialog from '@/components/patients/RegisterPatientDialog'

export default function Patients() {
  const { t } = useTranslation()
  const { isRole } = useRole()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: patients, loading, error, refetch } = useApi(() => client.getPatients(), [])
  const { data: allJourneys } = useApi(() => client.getPatientJourneys(), [])
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const isClinician = isRole('NURSE') || isRole('DOCTOR') || isRole('PAL')

  const filtered = useMemo(
    () =>
      (patients ?? []).filter(
        (p) =>
          !search.trim() ||
          p.displayName.toLowerCase().includes(search.toLowerCase()) ||
          p.personalNumber.includes(search),
      ),
    [patients, search],
  )

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            {t('patients.title')}
          </Typography>
        </Stack>
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

      <TextField
        size="small"
        placeholder={t('patients.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
      />

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <PatientTable
          patients={filtered}
          journeys={allJourneys ?? []}
          journeyTemplates={journeyTemplates ?? []}
          isClinician={isClinician}
        />
      )}

      <RegisterPatientDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={refetch}
      />
    </Box>
  )
}
