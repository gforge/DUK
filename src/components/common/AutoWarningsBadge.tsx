import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, ListItemIcon, ListItemText, Stack, Tooltip, Typography, } from '@mui/material';
import { format, parseISO } from 'date-fns';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PolicyWarning } from '@/api/schemas';
import { useSeverityLabel } from '@/hooks/labels';
interface AutoWarningsBadgeProps {
    warnings: PolicyWarning[];
    lastActivityAt?: string;
}
const SEVERITY_COLOR: Record<PolicyWarning['severity'], 'error' | 'warning' | 'info'> = {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info',
};
export default function AutoWarningsBadge({ warnings, lastActivityAt }: AutoWarningsBadgeProps) {
    const { t } = useTranslation();
    const getSeverityLabel = useSeverityLabel();
    const [open, setOpen] = useState(false);
    if (warnings.length === 0)
        return null;
    const highestSeverity = warnings.some((w) => w.severity === 'HIGH')
        ? 'HIGH'
        : warnings.some((w) => w.severity === 'MEDIUM')
            ? 'MEDIUM'
            : 'LOW';
    const tooltipContent = warnings.map((w) => w.ruleName).join(', ');
    const lastCalc = lastActivityAt ? format(parseISO(lastActivityAt), 'dd MMM HH:mm') : '—';
    return (<>
      <Tooltip title={tooltipContent} arrow enterDelay={200}>
        <Chip icon={<WarningAmberIcon fontSize="inherit" />} label={t('case.autoWarnings', { count: warnings.length })} size="small" color={SEVERITY_COLOR[highestSeverity]} variant="filled" onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
        }} aria-label={t('case.autoWarningsAriaLabel', { count: warnings.length })} sx={{ fontSize: 10, height: 22, cursor: 'pointer', fontWeight: 600 }}/>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth onClick={(e) => e.stopPropagation()} aria-labelledby="warnings-dialog-title" sx={{ maxWidth: 'sm' }}>
        <DialogTitle id="warnings-dialog-title">
          <Stack sx={{ alignItems: 'center', gap: 1 }} direction="row">
            <WarningAmberIcon color="warning"/>
            {t('case.autoWarningsDialogTitle')}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ display: 'block', mb: 1 }} variant="caption" color="text.secondary">
            {t('case.autoWarningsLastCalc', { date: lastCalc })}
          </Typography>
          <List disablePadding>
            {warnings.map((w, i) => (<React.Fragment key={w.ruleId}>
                {i > 0 && <Divider />}
                <ListItem sx={{ alignItems: 'flex-start', px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <WarningAmberIcon color={SEVERITY_COLOR[w.severity]} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontWeight: 600 }} variant="body2">
                        {w.ruleName}
                      </Typography>} secondary={<Box>
                        <Typography sx={{ display: 'block' }} variant="caption" color="text.secondary">
                          {t('case.autoWarningsExpression')}: <code>{w.expression}</code>
                        </Typography>
                        {Object.entries(w.triggeredValues).length > 0 && (<Typography sx={{ display: 'block' }} variant="caption" color="text.secondary">
                            {t('case.autoWarningsValues')}:{' '}
                            {Object.entries(w.triggeredValues)
                        .map(([k, v]) => `${k} = ${v}`)
                        .join(', ')}
                          </Typography>)}
                        <Typography sx={{
                    display: 'inline-block',
                    mt: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: w.severity === 'HIGH'
                        ? 'error.main'
                        : w.severity === 'MEDIUM'
                            ? 'warning.main'
                            : 'info.main',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                }} variant="caption">
                          {getSeverityLabel(w.severity)}
                        </Typography>
                      </Box>}/>
                </ListItem>
              </React.Fragment>))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>);
}
