import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useRole } from '../store/roleContext'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import * as client from '../api/client'
import PatientSummaryCard from '../components/patientView/PatientSummaryCard'
import PatientActions from '../components/patientView/PatientActions'
import PatientCareplan from '../components/patientView/PatientCareplan'
import PatientCaseList from '../components/patientView/PatientCaseList'

export default function PatientView() {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isRole('PATIENT')) navigate('/dashboard', { replace: true })
  }, [isRole, navigate])

  const {
    data: cases,
    loading,
    error,
    refetch,
  } = useApi(() => client.getCasesByPatient(currentUser.id), [currentUser.id])

  const { data: patient, loading: patientLoading } = useApi(
    () => client.getPatient(currentUser.id),
    [currentUser.id],
  )

  const { data: journeys } = useApi(
    () => client.getPatientJourneys(currentUser.id),
    [currentUser.id],
  )
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  const activeJourney = journeys?.find((j) => j.status === 'ACTIVE')

  if (!isRole('PATIENT')) return null

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('patient.myPage')}
      </Typography>

      <PatientSummaryCard patient={patient} loading={patientLoading} />

      <PatientActions userId={currentUser.id} cases={cases} onRefetch={refetch} />

      <PatientCareplan activeJourney={activeJourney} journeyTemplates={journeyTemplates ?? []} />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('patient.myCases')}
      </Typography>

      <PatientCaseList cases={cases} loading={loading} error={error} />
    </Box>
  )
}
