import AddIcon from '@mui/icons-material/Add'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import RouteIcon from '@mui/icons-material/Route'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { PolicyRule } from '@/api/schemas'
import type { RuleForm } from '@/components/policy'
import {
  PolicyHelpDialog,
  PolicyRuleDialog,
  PolicyRulesTable,
  ruleSchema,
  SEVERITIES,
} from '@/components/policy'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'

const EMPTY_FORM: RuleForm = { severity: 'MEDIUM', name: '', expression: '', description: '' }

// suppress unused imports
void ruleSchema
void SEVERITIES

export function PolicyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()

  const { data: templates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: allVariables } = useApi(() => client.getAvailablePolicyVariables(), [])

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // Reload rules whenever the selected template changes
  const {
    data: rules,
    loading,
    error,
    refetch,
  } = useApi(
    () => (selectedTemplateId ? client.getPolicyRules(selectedTemplateId) : Promise.resolve(null)),
    [selectedTemplateId],
  )

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<RuleForm>(EMPTY_FORM)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Variables scoped to the currently selected template
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId)
  const templateVariables =
    allVariables?.filter((v) => v.templateName === selectedTemplate?.name) ?? []

  function openCreate() {
    setEditingId(null)
    setFormValues(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(rule: PolicyRule) {
    setEditingId(rule.id)
    setFormValues({
      name: rule.name,
      expression: rule.expression,
      severity: rule.severity,
      description: rule.description ?? '',
    })
    setOpen(true)
  }

  async function onSubmit(data: RuleForm) {
    if (!selectedTemplateId) return
    setSaving(true)
    try {
      await client.savePolicyRule({
        id: editingId ?? undefined,
        journeyTemplateId: selectedTemplateId,
        ...data,
        description: data.description || undefined,
        enabled: true,
      })
      await refetch()
      showSnack(t('policy.ruleSaved'), 'success')
      setOpen(false)
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(rule: PolicyRule) {
    try {
      await client.savePolicyRule({ ...rule, enabled: !rule.enabled })
      await refetch()
    } catch {
      showSnack(t('common.error'), 'error')
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await client.deletePolicyRule(id)
      await refetch()
      showSnack(t('policy.ruleDeleted'), 'success')
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} flex={1}>
          {t('policy.title')}
        </Typography>
        <Tooltip title={t('policy.help')}>
          <IconButton size="small" onClick={() => setHelpOpen(true)} aria-label={t('policy.help')}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Template selector */}
      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <RouteIcon color="primary" />
        <TextField
          select
          label={t('policy.selectTemplate')}
          value={selectedTemplateId}
          onChange={(e) => {
            setSelectedTemplateId(e.target.value)
            setOpen(false)
          }}
          size="small"
          sx={{ minWidth: 280 }}
        >
          {(templates ?? []).map((jt) => (
            <MenuItem key={jt.id} value={jt.id}>
              {jt.name}
            </MenuItem>
          ))}
        </TextField>
        {selectedTemplateId && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disableElevation>
            {t('policy.addRule')}
          </Button>
        )}
      </Stack>

      {!selectedTemplateId ? (
        <Typography color="text.secondary" variant="body2">
          {t('policy.noTemplateSelected')}
        </Typography>
      ) : loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : rules && rules.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {t('policy.noRules')}
        </Typography>
      ) : (
        <PolicyRulesTable
          rules={rules ?? []}
          deleting={deleting}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <PolicyRuleDialog
        open={open}
        editingId={editingId}
        formValues={formValues}
        saving={saving}
        variables={templateVariables}
        onSubmit={onSubmit}
        onClose={() => setOpen(false)}
      />

      <PolicyHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  )
}
