import React from 'react'
import {
  Box,
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
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import type { PolicyRule } from '../../api/schemas'

interface Props {
  rules: PolicyRule[]
  deleting: string | null
  onToggle: (rule: PolicyRule) => void
  onEdit: (rule: PolicyRule) => void
  onDelete: (id: string) => void
}

const severityColor = (s: string) =>
  s === 'HIGH' ? 'error' : s === 'MEDIUM' ? 'warning' : 'success'

export default function PolicyRulesTable({ rules, deleting, onToggle, onEdit, onDelete }: Props) {
  const { t } = useTranslation()

  return (
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
          {rules.map((rule) => (
            <TableRow key={rule.id} hover>
              <TableCell>
                <Switch
                  size="small"
                  checked={rule.enabled}
                  onChange={() => onToggle(rule)}
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
                  color={severityColor(rule.severity) as 'error' | 'warning' | 'success'}
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
                    onClick={() => onEdit(rule)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t('common.delete')}
                    color="error"
                    onClick={() => onDelete(rule.id)}
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
          {rules.length === 0 && (
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
  )
}
