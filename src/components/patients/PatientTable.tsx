import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { JourneyTemplate,Patient, PatientJourney } from '@/api/schemas'
import { formatPersonnummer } from '@/api/utils/personnummer'

import JourneyChips from './JourneyChips'

interface Props {
  readonly patients: Patient[]
  readonly journeys: PatientJourney[]
  readonly journeyTemplates: JourneyTemplate[]
  readonly isClinician: boolean
}

export default function PatientTable({ patients, journeys, journeyTemplates, isClinician }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Clamp page to valid range when the patient list shrinks (e.g. after filtering)
  const maxPage = Math.max(0, Math.ceil(patients.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const visible = patients.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)

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
            const patientJourneys = journeys.filter((j) => j.patientId === patient.id)
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
