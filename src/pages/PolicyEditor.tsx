import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Tooltip,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useApi } from '../hooks/useApi'
import { useSnack } from '../store/snackContext'
import * as client from '../api/client'
import { validateExpression } from '../api/policyParser'
import type { PolicyRule } from '../api/schemas'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expression: z
    .string()
    .min(1, 'Expression is required')
    .superRefine((val, ctx) => {
      const err = validateExpression(val)
      if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err })
    }),
  severity: z.enum(SEVERITIES),
  description: z.string().optional(),
})
type RuleForm = z.infer<typeof ruleSchema>

const AVAILABLE_VARS = [
  'PNRS_1',
  'PNRS_2',
  'OSS.total',
  'EQ5D.index',
  'EQ_VAS',
  'OSS.function',
  'OSS.pain',
  'numResponsesTotal',
  'daysSinceTherapy',
]

export default function PolicyEditor() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const { data: rules, loading, error, refetch } = useApi(() => client.getPolicyRules(), [])

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const { control, handleSubmit, reset, formState, watch } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { severity: 'MEDIUM', name: '', expression: '', description: '' },
  })

  const watchedExpr = watch('expression')
  const exprError = watchedExpr ? validateExpression(watchedExpr) : null

  function openCreate() {
    setEditingId(null)
    reset({ severity: 'MEDIUM', name: '', expression: '', description: '' })
    setOpen(true)
  }

  function openEdit(rule: PolicyRule) {
    setEditingId(rule.id)
    reset({
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
    } catch (e) {
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

  const severityColor = (s: string) =>
    s === 'HIGH' ? 'error' : s === 'MEDIUM' ? 'warning' : 'success'

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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{editingId ? t('policy.editRule') : t('policy.addRule')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t('policy.name')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    required
                    size="small"
                  />
                )}
              />
              <Controller
                name="expression"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t('policy.expression')}
                    error={!!fieldState.error || !!exprError}
                    helperText={
                      fieldState.error?.message || exprError || t('policy.expressionHint')
                    }
                    fullWidth
                    required
                    size="small"
                    inputProps={{ style: { fontFamily: 'monospace' } }}
                  />
                )}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t('policy.availableVars')}:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {AVAILABLE_VARS.map((v) => (
                    <Chip
                      key={v}
                      label={v}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: 11 }}
                    />
                  ))}
                </Stack>
              </Box>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('policy.severity')}
                    fullWidth
                    required
                    size="small"
                  >
                    {SEVERITIES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {t(`severity.${s}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t('policy.description')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={saving || !formState.isValid}>
              {saving ? <CircularProgress size={18} /> : t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('policy.syntaxTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {t('policy.syntaxDescription')}
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'background.default',
              p: 1.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}
          >
            {`PNRS_1 >= 7
OSS.total < 22 && PNRS_2 > 5
EQ5D.index <= 0.5 || EQ_VAS < 30
(OSS.total + PNRS_1) > 25`}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t('policy.operators')}: {`< <= > >= == != && ||`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
