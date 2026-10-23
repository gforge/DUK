import AddIcon from '@mui/icons-material/Add'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined'
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { PolicyRule } from '@/api/schemas'
import { PageHeader } from '@/components/common'
import type { RuleForm } from '@/components/policy'
import {
  PolicyHelpDialog,
  PolicyRuleDialog,
  PolicyRulesTable,
  PolicyTemplatePicker,
} from '@/components/policy'
import { useApi } from '@/hooks/useApi'
import { useSnack } from '@/store/snackContext'
import { tokens } from '@/theme'

const EMPTY_FORM: RuleForm = { severity: 'MEDIUM', name: '', expression: '', description: '' }

export function PolicyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { data: templates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: allVariables } = useApi(() => client.getAvailablePolicyVariables(), [])
  const [pickedTemplateId, setPickedTemplateId] = useState<string>('')
  // Default to the first template so the page opens with rules visible
  const selectedTemplateId = pickedTemplateId || templates?.[0]?.id || ''
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
  const activeCount = rules?.filter((r) => r.enabled).length ?? 0

  return (
    <Stack sx={{ gap: 2.5 }}>
      <PageHeader
        title={
          <>
            {t('policy.title')}
            <Tooltip title={t('policy.help')}>
              <IconButton
                size="small"
                onClick={() => setHelpOpen(true)}
                aria-label={t('policy.help')}
                sx={{ color: tokens.textMuted, p: 0.5 }}
              >
                <HelpOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        }
        subtitle={t('policy.subtitle')}
        actions={
          selectedTemplateId ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              disableElevation
              sx={{ fontWeight: 600, borderRadius: 2, px: 1.75, py: 1 }}
            >
              {t('policy.addRule')}
            </Button>
          ) : undefined
        }
      />

      {/* Template selector + summary */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <PolicyTemplatePicker
          templates={templates ?? []}
          value={selectedTemplateId}
          onChange={(id) => {
            setPickedTemplateId(id)
            setOpen(false)
          }}
        />
        {selectedTemplateId && rules && (
          <Typography sx={{ color: tokens.textSecondary }}>
            {t('policy.ruleCount', { count: rules.length })} ·{' '}
            {t('policy.activeCount', { count: activeCount })}
          </Typography>
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
    </Stack>
  )
}
