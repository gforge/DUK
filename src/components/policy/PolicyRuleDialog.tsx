import React from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { validateExpression } from '../../api/policyParser'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export { SEVERITIES }

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

export const ruleSchema = z.object({
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
export type RuleForm = z.infer<typeof ruleSchema>

interface Props {
  open: boolean
  editingId: string | null
  saving: boolean
  onClose: () => void
  onSubmit: (data: RuleForm) => Promise<void>
  formValues: RuleForm
}

export default function PolicyRuleDialog({
  open,
  editingId,
  saving,
  onClose,
  onSubmit,
  formValues,
}: Props) {
  const { t } = useTranslation()
  const { control, handleSubmit, watch, formState } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    values: formValues,
  })

  const watchedExpr = watch('expression')
  const exprError = watchedExpr ? validateExpression(watchedExpr) : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                  helperText={fieldState.error?.message || exprError || t('policy.expressionHint')}
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
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving || !formState.isValid}>
            {saving ? <CircularProgress size={18} /> : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
