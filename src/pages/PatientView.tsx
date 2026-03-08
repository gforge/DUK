import { Alert, Box, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as client from '@/api/client'
import type { QuestionnaireTemplate } from '@/api/schemas'
import type { MergedDueStep } from '@/api/service'
import { PatientCareplan } from '@/components/patientView'
import PatientActions from '@/components/patientView/PatientActions'
import PatientCaseList from '@/components/patientView/PatientCaseList'
import PatientDueForms from '@/components/patientView/PatientDueForms'
import PatientQuestionnaireForm from '@/components/patientView/PatientQuestionnaireForm'
import PatientSummaryCard from '@/components/patientView/PatientSummaryCard'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'

export default function PatientView() {
  const { t } = useTranslation()
  const { currentUser, isRole, currentPatientId } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isRole('PATIENT')) navigate('/dashboard', { replace: true })
  }, [isRole, navigate])

  const patientId = currentPatientId ?? currentUser.id
  const {
    data: cases,
    loading,
    error,
    refetch,
  } = useApi(
    () => (patientId ? client.getCasesByPatient(patientId) : Promise.resolve([])),
    [patientId],
  )

  const { data: patient, loading: patientLoading } = useApi(
    () => (patientId ? client.getPatient(patientId) : Promise.resolve(undefined)),
    [patientId],
  )

  const { data: journeys } = useApi(
    () => (patientId ? client.getPatientJourneys(patientId) : Promise.resolve([])),
    [patientId],
  )
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])

  // Form-filling state
  const [activeForm, setActiveForm] = useState<{
    step: MergedDueStep
    template: QuestionnaireTemplate
  } | null>(null)
  const [dueFormsRefresh, setDueFormsRefresh] = useState(0)

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
          patientId={patientId}
          caseId={activeCase.id}
          onDone={() => {
            setActiveForm(null)
            refetch()
            setDueFormsRefresh((prev) => prev + 1)
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

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('patient.viewTemporaryWarning')}
      </Alert>

      <PatientSummaryCard patient={patient} loading={patientLoading} />

      <PatientActions patientId={patientId} cases={cases} onRefetch={refetch} />

      {/* Due questionnaire forms */}
      <PatientDueForms
        patientId={patientId}
        refreshKey={dueFormsRefresh}
        onSelectForm={(step, template) => setActiveForm({ step, template })}
      />

      <PatientCareplan
        journeys={journeys ?? []}
        journeyTemplates={journeyTemplates ?? []}
        patientId={patientId}
      />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('patient.myCases')}
      </Typography>

      <PatientCaseList cases={cases} loading={loading} error={error} />
    </Box>
  )
}
