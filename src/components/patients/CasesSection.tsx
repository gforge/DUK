import React from 'react'
import {
  Paper,
  Stack,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { useTranslation } from 'react-i18next'
import { useCategoryLabel, useTriggerLabel } from '@/hooks/labels'
import { format } from 'date-fns'
import StatusChip from '@/components/common/StatusChip'
import type { Case } from '@/api/schemas'

interface CasesSectionProps {
  cases: Case[]
  onRowClick: (caseId: string) => void
}

export default function CasesSection({ cases, onRowClick }: CasesSectionProps) {
  const { t } = useTranslation()
  const getCategoryLabel = useCategoryLabel()
  const getTriggerLabel = useTriggerLabel()

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <AssignmentIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('patientDetail.cases')}
        </Typography>
        <Chip label={cases.length} size="small" variant="outlined" />
      </Stack>

      {cases.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('patientDetail.noCases')}
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('case.status')}</TableCell>
              <TableCell>{t('case.category')}</TableCell>
              <TableCell>{t('patientDetail.triggers')}</TableCell>
              <TableCell>{t('patientDetail.created')}</TableCell>
              <TableCell>{t('patientDetail.lastActivity')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((c) => (
              <TableRow
                key={c.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onRowClick(c.id)}
              >
                <TableCell>
                  <StatusChip status={c.status} />
                </TableCell>
                <TableCell>
                  <Chip label={getCategoryLabel(c.category)} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  {c.triggers.length > 0 ? (
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      {c.triggers.map((tr) => (
                        <Chip
                          key={tr}
                          label={getTriggerLabel(tr)}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {format(new Date(c.createdAt), 'dd MMM yyyy')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {format(new Date(c.lastActivityAt), 'dd MMM yyyy HH:mm')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}
