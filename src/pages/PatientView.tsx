import React, { useEffect, useState } from 'react'
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
import PatientDueForms from '../components/patientView/PatientDueForms'
import PatientQuestionnaireForm from '../components/patientView/PatientQuestionnaireForm'
import type { MergedDueStep } from '../api/service'
import type { QuestionnaireTemplate } from '../api/schemas'

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

  // Form-filling state
  const [activeForm, setActiveForm] = useState<{
    step: MergedDueStep
    template: QuestionnaireTemplate
  } | null>(null)

  if (!isRole('PATIENT')) return null

  // Find the first non-closed case for this patient (used for form submission context)
  const activeCase = cases?.find((c) => c.status !== 'CLOSED') ?? cases?.[0]

  // When a form is active, show the questionnaire full-screen
  if (activeForm && activeCase) {
    return (
      <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
        <PatientQuestionnaireForm
          step={activeForm.step}
          template={activeForm.template}
          patientId={currentUser.id}
          caseId={activeCase.id}
          onDone={() => {
            setActiveForm(null)
            refetch()
          }}
          onCancel={() => setActiveForm(null)}
        />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('patient.myPage')}
      </Typography>

      <PatientSummaryCard patient={patient} loading={patientLoading} />

      <PatientActions userId={currentUser.id} cases={cases} onRefetch={refetch} />

      {/* Due questionnaire forms */}
      <PatientDueForms
        patientId={currentUser.id}
        onSelectForm={(step, template) => setActiveForm({ step, template })}
      />

      <PatientCareplan
        journeys={journeys ?? []}
        journeyTemplates={journeyTemplates ?? []}
        patientId={currentUser.id}
      />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('patient.myCases')}
      </Typography>

      <PatientCaseList cases={cases} loading={loading} error={error} />
    </Box>
  )
}
