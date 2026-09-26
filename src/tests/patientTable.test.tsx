import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { Patient, PatientJourney } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import PatientTable from '@/components/patients/PatientTable'

import i18n from '../i18n'

const template = SEED_STATE.journeyTemplates[0]
const baseJourney = SEED_STATE.patientJourneys[0]

function makePatient(id: string, name: string): Patient {
  return { ...SEED_STATE.patients[0], id, displayName: name }
}

function makeJourney(id: string, patientId: string, status: PatientJourney['status']) {
  return { ...baseJourney, id, patientId, status, journeyTemplateId: template.id }
}

function renderTable(props: {
  patients: Patient[]
  journeys?: PatientJourney[]
  palPatientIds?: Set<string>
}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/patients']}>
        <Routes>
          <Route
            path="/patients"
            element={
              <PatientTable
                patients={props.patients}
                journeys={props.journeys ?? []}
                journeyTemplates={SEED_STATE.journeyTemplates}
                palPatientIds={props.palPatientIds ?? new Set()}
              />
            }
          />
          <Route path="/patients/:id" element={<div>patient page</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('PatientTable', () => {
  it('shows PAL tag, journey tags with overflow and the no-journey text', () => {
    const a = makePatient('p-a', 'Anna Andersson')
    const b = makePatient('p-b', 'Bo Berg')
    renderTable({
      patients: [a, b],
      journeys: [
        makeJourney('j1', a.id, 'ACTIVE'),
        makeJourney('j2', a.id, 'COMPLETED'),
        makeJourney('j3', a.id, 'SUSPENDED'),
      ],
      palPatientIds: new Set([a.id]),
    })

    const rowA = screen.getByRole('row', {
      name: i18n.t('patients.openPatient', { name: a.displayName }),
    })
    expect(within(rowA).getByText(i18n.t('patients.palTag'))).toBeInTheDocument()
    expect(within(rowA).getAllByText(template.name)).toHaveLength(2)
    expect(within(rowA).getByText('+1')).toBeInTheDocument()

    const rowB = screen.getByRole('row', {
      name: i18n.t('patients.openPatient', { name: b.displayName }),
    })
    expect(within(rowB).queryByText(i18n.t('patients.palTag'))).not.toBeInTheDocument()
    expect(within(rowB).getByText(i18n.t('patients.noJourney'))).toBeInTheDocument()
  })

  it('navigates to the patient when a row is clicked', async () => {
    const user = userEvent.setup()
    const a = makePatient('p-a', 'Anna Andersson')
    renderTable({ patients: [a] })
    await user.click(screen.getByText(a.displayName))
    expect(screen.getByText('patient page')).toBeInTheDocument()
  })

  it('paginates 25 rows per page by default', async () => {
    const user = userEvent.setup()
    const patients = Array.from({ length: 30 }, (_, i) =>
      makePatient(`p-${i}`, `Patient ${String(i).padStart(2, '0')}`),
    )
    renderTable({ patients })
    expect(screen.getByText('Patient 24')).toBeInTheDocument()
    expect(screen.queryByText('Patient 25')).not.toBeInTheDocument()
    expect(
      screen.getByText(i18n.t('patients.displayedRows', { from: 1, to: 25, count: 30 })),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next page|nästa sida/i }))
    expect(screen.getByText('Patient 25')).toBeInTheDocument()
  })

  it('shows empty state when there are no patients', () => {
    renderTable({ patients: [] })
    expect(screen.getByText(i18n.t('patients.noResults'))).toBeInTheDocument()
  })
})
