import BadgeIcon from '@mui/icons-material/Badge'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { differenceInYears, parseISO } from 'date-fns'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { EpisodeOfCare, JourneyTemplate, Patient, PatientJourney } from '@/api/schemas'
import PersonalNumberCopy from '@/components/common/PersonalNumberCopy'

import JourneyChips from './JourneyChips'

interface Props {
  readonly patients: Patient[]
  readonly journeys: PatientJourney[]
  readonly episodes: EpisodeOfCare[]
  readonly journeyTemplates: JourneyTemplate[]
  readonly isClinician: boolean
  readonly currentUserId?: string
}

export default function PatientTable({
  patients,
  journeys,
  episodes,
  journeyTemplates,
  isClinician,
  currentUserId,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Clamp page to valid range when the patient list shrinks (e.g. after filtering)
  const maxPage = Math.max(0, Math.ceil(patients.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const visible = patients.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)

  const episodesById = useMemo(
    () => new Map(episodes.map((episode) => [episode.id, episode])),
    [episodes],
  )

  const journeysByPatientId = useMemo(() => {
    const map = new Map<string, PatientJourney[]>()
    for (const journey of journeys) {
      const list = map.get(journey.patientId) ?? []
      list.push(journey)
      map.set(journey.patientId, list)
    }
    return map
  }, [journeys])

  const patientPalById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.palId])),
    [patients],
  )

  const hasActiveJourneyResponsibilityByPatientId = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!currentUserId || !isClinician) return map

    for (const journey of journeys) {
      if (journey.status !== 'ACTIVE') continue
      if (journey.responsiblePhysicianUserId === null) continue

      const episodeOwner = journey.episodeId
        ? episodesById.get(journey.episodeId)?.responsibleUserId
        : undefined
      const patientOwner = patientPalById.get(journey.patientId)
      const responsiblePhysicianUserId =
        journey.responsiblePhysicianUserId ?? episodeOwner ?? patientOwner

      if (responsiblePhysicianUserId === currentUserId) {
        map.set(journey.patientId, true)
      }
    }

    return map
  }, [currentUserId, episodesById, isClinician, journeys, patientPalById])

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('patients.displayName')}</TableCell>
            <TableCell>{t('patients.personalNumber')}</TableCell>
            <TableCell>{t('patients.age')}</TableCell>
            <TableCell>{t('patients.activeJourney')}</TableCell>
            {isClinician && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary">
                  {t('patients.noResults')}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {visible.map((patient) => {
            const patientJourneys = journeysByPatientId.get(patient.id) ?? []
            const isResponsiblePhysician =
              Boolean(currentUserId) &&
              isClinician &&
              (patient.palId === currentUserId ||
                hasActiveJourneyResponsibilityByPatientId.get(patient.id) === true)
            return (
              <TableRow
                key={patient.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                      {patient.displayName}
                    </Typography>

                    <Box
                      sx={{
                        width: 18,
                        minWidth: 18,
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {isResponsiblePhysician && (
                        <Tooltip title={t('patients.myResponsiblePhysician')} arrow>
                          <BadgeIcon fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <PersonalNumberCopy
                    personalNumber={patient.personalNumber}
                    labelFormat="short"
                    color="text.primary"
                  />
                </TableCell>
                <TableCell align="center">
                  {patient.dateOfBirth
                    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
                    : '—'}
                </TableCell>
                <TableCell>
                  <JourneyChips journeys={patientJourneys} journeyTemplates={journeyTemplates} />
                </TableCell>
                {isClinician && (
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      endIcon={<ChevronRightIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/patients/${patient.id}`)
                      }}
                    >
                      {t('patients.openView')}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={patients.length}
        page={safePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value)
          setPage(0)
        }}
        labelRowsPerPage={t('common.rowsPerPage')}
      />
    </>
  )
}
