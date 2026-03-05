import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/hooks/useApi'
import * as client from '@/api/client'
import { format } from 'date-fns'

interface AuditLogTabProps {
  caseId: string
}

const ROLE_COLORS = {
  PATIENT: 'default',
  NURSE: 'info',
  DOCTOR: 'primary',
  PAL: 'secondary',
} as const

export default function AuditLogTab({ caseId }: AuditLogTabProps) {
  const { t } = useTranslation()
  const { data: events, loading, error } = useApi(() => client.getAuditEvents(caseId), [caseId])

  if (loading) return <CircularProgress />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!events || events.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {t('audit.noEvents')}
      </Typography>
    )
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table size="small" aria-label={t('audit.title')}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 600 }}>{t('audit.timestamp')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('audit.action')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('audit.user')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('audit.details')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((event) => (
            <TableRow key={event.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                {format(new Date(event.timestamp), 'dd MMM yyyy HH:mm:ss')}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {t(`audit.actions.${event.action}`, { defaultValue: event.action })}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5} alignItems="center">
                  <Chip
                    label={t(`role.${event.userRole}`)}
                    size="small"
                    color={ROLE_COLORS[event.userRole]}
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {event.userId}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                {event.details ? (
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.7rem',
                      m: 0,
                      p: 0.5,
                      bgcolor: 'background.default',
                      borderRadius: 0.5,
                      maxWidth: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                    }}
                  >
                    {JSON.stringify(event.details, null, 2)}
                  </Box>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
