import React from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import RouteIcon from '@mui/icons-material/Route'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ScienceIcon from '@mui/icons-material/Science'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useApi } from '../hooks/useApi'
import * as client from '../api/client'
import StatusChip from '../components/common/StatusChip'
import PatientJourneyResearchCard from '../components/patients/PatientJourneyResearchCard'
import { formatPersonnummer } from '../api/utils/personnummer'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: patient, loading, error } = useApi(() => client.getPatient(id!), [id])
  const { data: cases } = useApi(() => client.getCasesByPatient(id!), [id])
  const { data: journeys, refetch: refetchJourneys } = useApi(
    () => client.getPatientJourneys(id!),
    [id],
  )
  const { data: journeyTemplates } = useApi(() => client.getJourneyTemplates(), [])
  const { data: researchModules } = useApi(() => client.getResearchModules(), [])
  const { data: consents, refetch: refetchConsents } = useApi(
    () => client.getResearchConsents(id!),
    [id],
  )

  const handleResearchChanged = () => {
    refetchJourneys()
    refetchConsents()
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !patient) {
    return (
      <Box p={3}>
        <Alert severity="error">{t('patientDetail.notFound')}</Alert>
      </Box>
    )
  }

  const templateName = (templateId: string) =>
    journeyTemplates?.find((jt) => jt.id === templateId)?.name ?? templateId

  const sortedCases = [...(cases ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sortedJourneys = [...(journeys ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const journeyStatusColor = (status: string): 'primary' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'primary'
      case 'SUSPENDED':
        return 'warning'
      case 'COMPLETED':
      default:
        return 'default'
    }
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          to="/patients"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <PersonIcon fontSize="small" />
          {t('patients.title')}
        </MuiLink>
        <Typography color="text.primary" fontWeight={600}>
          {patient.displayName}
        </Typography>
      </Breadcrumbs>

      {/* Patient summary */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            {patient.displayName}
          </Typography>
        </Stack>
        <Stack direction="row" gap={4} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('patients.personalNumber')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatPersonnummer(patient.personalNumber)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('patients.dateOfBirth')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {patient.dateOfBirth}
            </Typography>
          </Box>
          {patient.lastOpenedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('patient.lastOpened')}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {format(new Date(patient.lastOpenedAt), 'dd MMM yyyy HH:mm')}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('patientDetail.registered')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {format(new Date(patient.createdAt), 'dd MMM yyyy')}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Cases */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <AssignmentIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('patientDetail.cases')}
          </Typography>
          <Chip label={sortedCases.length} size="small" variant="outlined" />
        </Stack>

        {sortedCases.length === 0 ? (
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
              {sortedCases.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <TableCell>
                    <StatusChip status={c.status} />
                  </TableCell>
                  <TableCell>
                    <Chip label={t(`category.${c.category}`)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {c.triggers.length > 0 ? (
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {c.triggers.map((tr) => (
                          <Chip
                            key={tr}
                            label={t(`trigger.${tr}`)}
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

      {/* Journeys */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <RouteIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('patientDetail.journeys')}
          </Typography>
          <Chip label={sortedJourneys.length} size="small" variant="outlined" />
        </Stack>

        {sortedJourneys.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('patientDetail.noJourneys')}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('patientDetail.journeyTemplate')}</TableCell>
                <TableCell>{t('case.status')}</TableCell>
                <TableCell>{t('patientDetail.startDate')}</TableCell>
                <TableCell>{t('patientDetail.created')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedJourneys.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {templateName(j.journeyTemplateId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`journey.journeyStatus.${j.status}`)}
                      size="small"
                      color={journeyStatusColor(j.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{j.startDate}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {format(new Date(j.createdAt), 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Research studies per journey */}
      {researchModules && researchModules.length > 0 && sortedJourneys.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <ScienceIcon color="secondary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('patients.research.sectionTitle')}
            </Typography>
          </Stack>
          <Stack gap={3}>
            {sortedJourneys.map((j, idx) => (
              <Box key={j.id}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {templateName(j.journeyTemplateId)}
                  </Typography>
                  <Chip
                    label={t(`journey.journeyStatus.${j.status}`)}
                    size="small"
                    color={journeyStatusColor(j.status)}
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Stack>
                <PatientJourneyResearchCard
                  journey={j}
                  patientId={id!}
                  allModules={researchModules}
                  consents={consents ?? []}
                  onChanged={handleResearchChanged}
                />
                {idx < sortedJourneys.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
