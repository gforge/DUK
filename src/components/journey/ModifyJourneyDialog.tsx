import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { QuestionnaireTemplate } from '@/api/schemas'
import type { EffectiveStep } from '@/api/service'

import { AddStepForm, RemoveStepForm } from './modify/ModifyForms'

interface ModifyJourneyDialogProps {
  open: boolean
  onClose: () => void
  journeyId: string
  currentTemplateName: string
  currentStartDate: string
  steps: EffectiveStep[]
  questionnaireTemplates: QuestionnaireTemplate[]
  onModify: (
    type: 'ADD_STEP' | 'REMOVE_STEP' | 'CANCEL',
    payload: {
      reason: string
      entry?: { label: string; offsetDays: number; windowDays: number; templateId: string }
      stepId?: string
    },
  ) => Promise<void>
}

export default function ModifyJourneyDialog({
  open,
  onClose,
  currentTemplateName,
  currentStartDate,
  steps,
  questionnaireTemplates,
  onModify,
}: ModifyJourneyDialogProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addLabel, setAddLabel] = useState('')
  const [addOffset, setAddOffset] = useState('')
  const [addWindow, setAddWindow] = useState('2')
  const [addTemplateId, setAddTemplateId] = useState('')
  const [addReason, setAddReason] = useState('')

  const [removeStepId, setRemoveStepId] = useState('')
  const [removeReason, setRemoveReason] = useState('')

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    try {
      if (tab === 0) {
        if (!addLabel.trim() || !addOffset || !addTemplateId || !addReason.trim()) {
          setError(t('journey.modify.requiredFields'))
          return
        }
        await onModify('ADD_STEP', {
          reason: addReason,
          entry: {
            label: addLabel,
            offsetDays: Number(addOffset),
            windowDays: Number(addWindow) || 2,
            templateId: addTemplateId,
          },
        })
      } else if (tab === 1) {
        if (!removeStepId || !removeReason.trim()) {
          setError(t('journey.modify.requiredFields'))
          return
        }
        await onModify('REMOVE_STEP', { reason: removeReason, stepId: removeStepId })
      }
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('journey.modify.title')} — {currentTemplateName}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v)
            setError(null)
          }}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('journey.modify.addStep')} />
          <Tab label={t('journey.modify.removeStep')} />
        </Tabs>
        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {tab === 0 && (
            <AddStepForm
              label={addLabel}
              setLabel={setAddLabel}
              offset={addOffset}
              setOffset={setAddOffset}
              window={addWindow}
              setWindow={setAddWindow}
              templateId={addTemplateId}
              setTemplateId={setAddTemplateId}
              reason={addReason}
              setReason={setAddReason}
              questionnaireTemplates={questionnaireTemplates}
              startDate={currentStartDate}
            />
          )}
          {tab === 1 && (
            <RemoveStepForm
              steps={steps}
              selectedStepId={removeStepId}
              onSelectStep={setRemoveStepId}
              reason={removeReason}
              setReason={setRemoveReason}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} disableElevation>
          {saving ? t('journey.modify.saving') : t('journey.modify.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
