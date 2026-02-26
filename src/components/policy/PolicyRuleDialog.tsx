import React, { useRef } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { validateExpression } from '../../api/policyParser'
import type { PolicyVariable } from '../../api/service'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export { SEVERITIES }

/** General variables not tied to a specific journey template. */
const GENERAL_VARS: { name: string; labelKey: string }[] = [
  { name: 'numResponsesTotal', labelKey: 'policy.varNumResponses' },
  { name: 'daysSinceTherapy', labelKey: 'policy.varDaysSinceTherapy' },
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
  /** Available policy variables derived from journey template score aliases. */
  variables?: PolicyVariable[]
}

export default function PolicyRuleDialog({
  open,
  editingId,
  saving,
  onClose,
  onSubmit,
  formValues,
  variables = [],
}: Props) {
  const { t } = useTranslation()
  const exprRef = useRef<HTMLInputElement>(null)

  const { control, handleSubmit, watch, formState, setValue, getValues } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    values: formValues,
  })

  const watchedExpr = watch('expression')
  const exprError = watchedExpr ? validateExpression(watchedExpr) : null

  /** Insert a variable name at the current cursor position in the expression field. */
  const insertVar = (varName: string) => {
    const currentVal = getValues('expression') ?? ''
    const input = exprRef.current
    const pos = input?.selectionStart ?? currentVal.length
    const newVal = currentVal.slice(0, pos) + varName + currentVal.slice(pos)
    setValue('expression', newVal, { shouldValidate: true })
    setTimeout(() => {
      if (input) {
        input.focus()
        input.setSelectionRange(pos + varName.length, pos + varName.length)
      }
    }, 0)
  }

  // Group journey variables by template name
  const grouped = variables.reduce<Record<string, PolicyVariable[]>>((acc, v) => {
    if (!acc[v.templateName]) acc[v.templateName] = []
    acc[v.templateName].push(v)
    return acc
  }, {})
  const templateGroups = Object.entries(grouped)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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

            {/* ── Variable palette ──────────────────────────────────────── */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {t('policy.clickVarToInsert')}
              </Typography>

              {templateGroups.length === 0 ? (
                <Typography variant="caption" color="text.disabled" fontStyle="italic">
                  {t('policy.noVars')}
                </Typography>
              ) : (
                <Stack gap={1.5}>
                  {templateGroups.map(([templateName, vars]) => (
                    <Box key={templateName}>
                      <Typography
                        variant="overline"
                        fontSize={10}
                        color="text.disabled"
                        display="block"
                        sx={{ lineHeight: 1.4, mb: 0.5 }}
                      >
                        {templateName}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {vars.map((v) => (
                          <Tooltip key={v.name} title={v.name} placement="top">
                            <Chip
                              label={v.label}
                              size="small"
                              color="primary"
                              variant="outlined"
                              onClick={() => insertVar(v.name)}
                              sx={{ cursor: 'pointer', fontSize: 11, maxWidth: 260 }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Typography
                variant="overline"
                fontSize={10}
                color="text.disabled"
                display="block"
                sx={{ lineHeight: 1.4, mb: 0.5 }}
              >
                {t('policy.generalVars')}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {GENERAL_VARS.map((v) => (
                  <Tooltip key={v.name} title={v.name} placement="top">
                    <Chip
                      label={t(v.labelKey)}
                      size="small"
                      variant="outlined"
                      onClick={() => insertVar(v.name)}
                      sx={{ cursor: 'pointer', fontSize: 11 }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            {/* ── Expression field ──────────────────────────────────────── */}
            <Controller
              name="expression"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('policy.expression')}
                  placeholder={t('policy.expressionPlaceholder')}
                  error={!!fieldState.error || !!exprError}
                  helperText={fieldState.error?.message || exprError || t('policy.expressionHint')}
                  fullWidth
                  required
                  size="small"
                  inputRef={exprRef}
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                />
              )}
            />

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
