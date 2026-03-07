import React, { useState } from 'react'
import {
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Stack,
  Divider,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useTranslation } from 'react-i18next'
import { useSeverityLabel } from '@/hooks/labels'
import type { PolicyWarning } from '@/api/schemas'
import { format, parseISO } from 'date-fns'

interface AutoWarningsBadgeProps {
  warnings: PolicyWarning[]
  lastActivityAt?: string
}

const SEVERITY_COLOR: Record<PolicyWarning['severity'], 'error' | 'warning' | 'info'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
}

export default function AutoWarningsBadge({ warnings, lastActivityAt }: AutoWarningsBadgeProps) {
  const { t } = useTranslation()
  const getSeverityLabel = useSeverityLabel()
  const [open, setOpen] = useState(false)

  if (warnings.length === 0) return null

  const highestSeverity = warnings.some((w) => w.severity === 'HIGH')
    ? 'HIGH'
    : warnings.some((w) => w.severity === 'MEDIUM')
      ? 'MEDIUM'
      : 'LOW'

  const tooltipContent = warnings.map((w) => w.ruleName).join(', ')
  const lastCalc = lastActivityAt ? format(parseISO(lastActivityAt), 'dd MMM HH:mm') : '—'

  return (
    <>
      <Tooltip title={tooltipContent} arrow enterDelay={200}>
        <Chip
          icon={<WarningAmberIcon fontSize="inherit" />}
          label={t('case.autoWarnings', { count: warnings.length })}
          size="small"
          color={SEVERITY_COLOR[highestSeverity]}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
          aria-label={t('case.autoWarningsAriaLabel', { count: warnings.length })}
          sx={{ fontSize: 10, height: 22, cursor: 'pointer', fontWeight: 600 }}
        />
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="warnings-dialog-title"
      >
        <DialogTitle id="warnings-dialog-title">
          <Stack direction="row" alignItems="center" gap={1}>
            <WarningAmberIcon color="warning" />
            {t('case.autoWarningsDialogTitle')}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {t('case.autoWarningsLastCalc', { date: lastCalc })}
          </Typography>
          <List disablePadding>
            {warnings.map((w, i) => (
              <React.Fragment key={w.ruleId}>
                {i > 0 && <Divider />}
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <WarningAmberIcon fontSize="small" color={SEVERITY_COLOR[w.severity]} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {w.ruleName}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('case.autoWarningsExpression')}: <code>{w.expression}</code>
                        </Typography>
                        {Object.entries(w.triggeredValues).length > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t('case.autoWarningsValues')}:{' '}
                            {Object.entries(w.triggeredValues)
                              .map(([k, v]) => `${k} = ${v}`)
                              .join(', ')}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          display="inline-block"
                          mt={0.5}
                          sx={{
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor:
                              w.severity === 'HIGH'
                                ? 'error.main'
                                : w.severity === 'MEDIUM'
                                  ? 'warning.main'
                                  : 'info.main',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                          }}
                        >
                          {getSeverityLabel(w.severity)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
