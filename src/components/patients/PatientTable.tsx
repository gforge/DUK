import React, { useState } from 'react'
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
} from '@mui/material'
import RouteIcon from '@mui/icons-material/Route'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Patient, PatientJourney, JourneyTemplate } from '../../api/schemas'
import { formatPersonnummer } from '../../api/utils/personnummer'

interface Props {
  patients: Patient[]
  journeys: PatientJourney[]
  journeyTemplates: JourneyTemplate[]
  isClinician: boolean
  onAssign: (target: { id: string; name: string }) => void
}

export default function PatientTable({
  patients,
  journeys,
  journeyTemplates,
  isClinician,
  onAssign,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Clamp page to valid range when the patient list shrinks (e.g. after filtering)
  const maxPage = Math.max(0, Math.ceil(patients.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const visible = patients.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)

  const activeJourneyCount = (patientId: string) =>
    journeys.filter((j) => j.patientId === patientId && j.status === 'ACTIVE').length

  const latestJourneyName = (patientId: string): string | null => {
    const sorted = journeys
      .filter((j) => j.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (!sorted.length) return null
    return journeyTemplates.find((jt) => jt.id === sorted[0].journeyTemplateId)?.name ?? null
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('patients.displayName')}</TableCell>
            <TableCell>{t('patients.personalNumber')}</TableCell>
            <TableCell>{t('patients.dateOfBirth')}</TableCell>
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
            const count = activeJourneyCount(patient.id)
            const name = latestJourneyName(patient.id)
            return (
              <TableRow
                key={patient.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {patient.displayName}
                  </Typography>
                </TableCell>
                <TableCell>{formatPersonnummer(patient.personalNumber)}</TableCell>
                <TableCell>{patient.dateOfBirth}</TableCell>
                <TableCell>
                  {name ? (
                    <Chip
                      size="small"
                      icon={<RouteIcon />}
                      label={`${name}${count > 1 ? ` +${count - 1}` : ''}`}
                      color={count > 0 ? 'primary' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('patients.noJourney')}
                    </Typography>
                  )}
                </TableCell>
                {isClinician && (
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RouteIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAssign({ id: patient.id, name: patient.displayName })
                      }}
                    >
                      {t('patients.assignJourney')}
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
