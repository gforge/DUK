import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, TablePagination } from '@mui/material'
import { differenceInYears, parseISO } from 'date-fns'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { JourneyTemplate, Patient, PatientJourney } from '@/api/schemas'
import { GridTableHeader, GridTableRow, SectionCard, Tag } from '@/components/common'
import PersonalNumberCopy from '@/components/common/PersonalNumberCopy'
import { tokens } from '@/theme'

import JourneyChips from './JourneyChips'

const COLUMNS = 'minmax(180px,1.2fr) 170px 60px minmax(240px,2fr) 24px'
const MIN_WIDTH = 760
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100]

interface Props {
  readonly patients: Patient[]
  readonly journeys: PatientJourney[]
  readonly journeyTemplates: JourneyTemplate[]
  /** Patients for whom the current user is PAL (patient PAL or responsible for an active journey). */
  readonly palPatientIds: ReadonlySet<string>
}

export default function PatientTable({
  patients,
  journeys,
  journeyTemplates,
  palPatientIds,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  // Clamp page to valid range when the patient list shrinks (e.g. after filtering)
  const maxPage = Math.max(0, Math.ceil(patients.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const visible = patients.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)
  const journeysByPatientId = useMemo(() => {
    const map = new Map<string, PatientJourney[]>()
    for (const journey of journeys) {
      const list = map.get(journey.patientId) ?? []
      list.push(journey)
      map.set(journey.patientId, list)
    }
    return map
  }, [journeys])
  const now = new Date()

  return (
    <SectionCard aria-label={t('patients.title')}>
      <Box role="table" aria-label={t('patients.title')}>
        <GridTableHeader columns={COLUMNS} minWidth={MIN_WIDTH}>
          <Box role="columnheader">{t('patients.displayName')}</Box>
          <Box role="columnheader">{t('patients.personalNumber')}</Box>
          <Box role="columnheader">{t('patients.age')}</Box>
          <Box role="columnheader">{t('patients.journeys')}</Box>
          <Box role="columnheader" />
        </GridTableHeader>

        {patients.length === 0 && (
          <Box
            role="row"
            sx={{
              minWidth: MIN_WIDTH,
              px: 2,
              py: 2,
              color: tokens.textSecondary,
              borderBottom: `1px solid ${tokens.rowDivider}`,
            }}
          >
            <Box role="cell">{t('patients.noResults')}</Box>
          </Box>
        )}

        {visible.map((patient) => {
          const isPal = palPatientIds.has(patient.id)
          const open = () => navigate(`/patients/${patient.id}`)
          return (
            <GridTableRow
              key={patient.id}
              columns={COLUMNS}
              minWidth={MIN_WIDTH}
              onClick={open}
              aria-label={t('patients.openPatient', { name: patient.displayName })}
              sx={{ py: '11px' }}
            >
              <Box
                role="cell"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, minWidth: 0 }}
              >
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patient.displayName}
                </Box>
                {isPal && (
                  <Tag
                    variant="selected"
                    icon={<AssignmentIndIcon />}
                    label={t('patients.palTag')}
                    title={t('patients.myResponsiblePhysician')}
                  />
                )}
              </Box>
              <Box role="cell">
                <PersonalNumberCopy
                  personalNumber={patient.personalNumber}
                  labelFormat="short"
                  sx={{
                    gap: 0.75,
                    '& > :not(style) ~ :not(style)': { ml: 0 },
                    '& .MuiTypography-root': {
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontVariantNumeric: 'tabular-nums',
                      color: tokens.text2,
                    },
                    '& .MuiIconButton-root': {
                      p: 0.5,
                      borderRadius: 1,
                      color: tokens.textMuted,
                      '&:hover': { bgcolor: tokens.greyFill, color: tokens.text2 },
                    },
                    '& .MuiIconButton-root svg': { fontSize: 14 },
                  }}
                />
              </Box>
              <Box role="cell" sx={{ color: tokens.text2, fontVariantNumeric: 'tabular-nums' }}>
                {patient.dateOfBirth ? differenceInYears(now, parseISO(patient.dateOfBirth)) : '—'}
              </Box>
              <Box role="cell">
                <JourneyChips
                  journeys={journeysByPatientId.get(patient.id) ?? []}
                  journeyTemplates={journeyTemplates}
                />
              </Box>
              <Box role="cell" aria-hidden sx={{ color: tokens.textMuted, display: 'flex' }}>
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              </Box>
            </GridTableRow>
          )
        })}
      </Box>

      <TablePagination
        component="div"
        count={patients.length}
        page={safePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value)
          setPage(0)
        }}
        labelRowsPerPage={`${t('common.rowsPerPage')}:`}
        labelDisplayedRows={({ from, to, count }) =>
          t('patients.displayedRows', { from, to, count })
        }
        sx={{
          minWidth: MIN_WIDTH,
          color: tokens.text2,
          borderBottom: 0,
          '& .MuiTablePagination-toolbar': { minHeight: 0, px: 2, py: 0.75, gap: 1 },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select':
            { fontSize: 13, m: 0 },
          '& .MuiTablePagination-input': { mr: 2 },
          '& .MuiTablePagination-displayedRows': { mr: 1 },
          '& .MuiTablePagination-actions': { ml: 1 },
          '& .MuiTablePagination-actions .MuiIconButton-root': { p: 0.5, color: tokens.text2 },
          '& .MuiTablePagination-actions .Mui-disabled': { color: tokens.inputBorder },
        }}
      />
    </SectionCard>
  )
}
