import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useTranslation } from 'react-i18next'
import { useApi } from '../hooks/useApi'
import { useSnack } from '../store/snackContext'
import * as client from '../api/client'
import type { PolicyRule } from '../api/schemas'
import PolicyRuleDialog, { ruleSchema, SEVERITIES } from '../components/policy/PolicyRuleDialog'
import PolicyHelpDialog from '../components/policy/PolicyHelpDialog'
import type { RuleForm } from '../components/policy/PolicyRuleDialog'

const EMPTY_FORM: RuleForm = { severity: 'MEDIUM', name: '', expression: '', description: '' }

const severityColor = (s: string) =>
  s === 'HIGH' ? 'error' : s === 'MEDIUM' ? 'warning' : 'success'

// suppress unused imports
void ruleSchema
void SEVERITIES

export default function PolicyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { data: rules, loading, error, refetch } = useApi(() => client.getPolicyRules(), [])

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<RuleForm>(EMPTY_FORM)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

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
    setSaving(true)
    try {
      await client.savePolicyRule({
        id: editingId ?? `rule-${Date.now()}`,
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
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} flex={1}>
          {t('policy.title')}
        </Typography>
        <Tooltip title={t('policy.help')}>
          <IconButton size="small" onClick={() => setHelpOpen(true)}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('policy.addRule')}
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('policy.enabled')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('policy.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('policy.expression')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('policy.severity')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('policy.description')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(rules ?? []).map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Switch
                      size="small"
                      checked={rule.enabled}
                      onChange={() => handleToggle(rule)}
                      inputProps={{ 'aria-label': t('policy.toggleEnabled', { name: rule.name }) }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      component="code"
                      sx={{
                        fontSize: '0.72rem',
                        bgcolor: 'background.default',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                      }}
                    >
                      {rule.expression}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`severity.${rule.severity}`)}
                      size="small"
                      color={severityColor(rule.severity) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {rule.description ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        aria-label={t('common.edit')}
                        onClick={() => openEdit(rule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={t('common.delete')}
                        color="error"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleting === rule.id}
                      >
                        {deleting === rule.id ? (
                          <CircularProgress size={14} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!rules?.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" variant="body2" align="center">
                      {t('policy.noRules')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <PolicyRuleDialog
        open={open}
        editingId={editingId}
        saving={saving}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
        formValues={formValues}
      />
      <PolicyHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  )
}
