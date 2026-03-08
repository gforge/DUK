import AddIcon from '@mui/icons-material/Add'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import ScienceIcon from '@mui/icons-material/Science'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import {
  Chip,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type {
  JourneyModification,
  JourneyTemplate,
  Patient,
  PatientJourney,
  ResearchModule,
} from '@/api/schemas'
import { useJourneyStatusLabel } from '@/hooks/labels'

const MOD_ICON: Record<string, React.ReactNode> = {
  ADD_STEP: <AddIcon fontSize="inherit" />,
  REMOVE_STEP: <RemoveCircleOutlineIcon fontSize="inherit" />,
  SWITCH_TEMPLATE: <SwapHorizIcon fontSize="inherit" />,
}

interface Props {
  patientJourneys: PatientJourney[] | null
  loading: boolean
  patients: Patient[] | null
  journeyTemplates: JourneyTemplate[] | null
  researchModules: ResearchModule[] | null
}

function modSummary(mod: JourneyModification, templateName: (id: string) => string) {
  if (mod.type === 'ADD_STEP') return `+${mod.entry?.label ?? ''}`
  if (mod.type === 'REMOVE_STEP') return `-${mod.stepId ?? ''}`
  if (mod.type === 'SWITCH_TEMPLATE') return `→ ${templateName(mod.newTemplateId ?? '')}`
  return mod.type
}

export default function PatientJourneysTable({
  patientJourneys,
  loading,
  patients,
  journeyTemplates,
  researchModules,
}: Props) {
  const { t } = useTranslation()
  const getJourneyStatusLabel = useJourneyStatusLabel()

  const patientName = (id: string) => patients?.find((p) => p.id === id)?.displayName ?? id
  const templateName = (id: string) => journeyTemplates?.find((jt) => jt.id === id)?.name ?? id

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
  if (!patientJourneys?.length)
    return <Typography color="text.secondary">{t('journey.editor.noPatientJourneys')}</Typography>

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{t('journey.patient')}</TableCell>
          <TableCell>{t('journey.template.label')}</TableCell>
          <TableCell>{t('journey.startDate')}</TableCell>
          <TableCell>{t('journey.journeyStatus.label')}</TableCell>
          <TableCell>{t('journey.researchLabel')}</TableCell>
          <TableCell>{t('journey.modifications')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {patientJourneys.map((pj) => (
          <TableRow key={pj.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight={600}>
                {patientName(pj.patientId)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{templateName(pj.journeyTemplateId)}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="caption">{pj.startDate}</Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={getJourneyStatusLabel(pj.status)}
                size="small"
                color={
                  pj.status === 'ACTIVE'
                    ? 'primary'
                    : pj.status === 'COMPLETED'
                      ? 'success'
                      : 'default'
                }
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
            </TableCell>
            <TableCell>
              {pj.researchModuleIds.length > 0 ? (
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {pj.researchModuleIds.map((rmId) => (
                    <Chip
                      key={rmId}
                      icon={<ScienceIcon />}
                      label={researchModules?.find((rm) => rm.id === rmId)?.name ?? rmId}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 20 }}
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
              {pj.modifications.length > 0 ? (
                <Stack gap={0.25}>
                  {pj.modifications.map((mod) => (
                    <Stack key={mod.id} direction="row" alignItems="center" gap={0.5}>
                      {MOD_ICON[mod.type]}
                      <Typography variant="caption">{modSummary(mod, templateName)}</Typography>
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {mod.reason.slice(0, 40)}
                        {mod.reason.length > 40 ? '…' : ''}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  —
                </Typography>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
