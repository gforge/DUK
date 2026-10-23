import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Case } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import { WorklistRow } from '@/components/worklist'

import i18n from '../i18n'

const base = SEED_STATE.cases[0]
const patient = SEED_STATE.patients.find((p) => p.id === base.patientId)

const teamCase: Case = {
  ...base,
  id: 'row-team-case',
  status: 'TRIAGED',
  assignedUserId: undefined,
  internalNote: 'Kontrollera sårläkning',
  triageDecision: {
    contactMode: 'PHONE',
    careRole: 'NURSE',
    assignmentMode: 'TEAM',
    assignedTeamIds: ['team-a'],
    assignedUserId: null,
    dueAt: null,
    note: null,
  },
}

function renderRow(caseData: Case, onClaim = vi.fn()) {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/worklist']}>
        <Routes>
          <Route
            path="/worklist"
            element={
              <WorklistRow
                caseData={caseData}
                patient={patient}
                mode="active"
                userMap={new Map()}
                teamMap={new Map([['team-a', { id: 'team-a', name: 'Höft', memberUserIds: [] }]])}
                onClaim={onClaim}
                onMarkDone={vi.fn()}
              />
            }
          />
          <Route path="/cases/:id" element={<div>case page</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('WorklistRow', () => {
  it('shows team recipient and note, and claims without opening the case', async () => {
    const onClaim = vi.fn()
    renderRow(teamCase, onClaim)
    expect(screen.getByText('Höft')).toBeInTheDocument()
    expect(screen.getByText('Kontrollera sårläkning')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: i18n.t('worklist.claim') }))
    expect(onClaim).toHaveBeenCalledWith(teamCase.id)
    expect(screen.queryByText('case page')).not.toBeInTheDocument()
  })

  it('opens the case when the row is clicked', async () => {
    renderRow(teamCase)
    const name = patient?.displayName ?? teamCase.patientId
    await userEvent.click(
      screen.getByRole('row', { name: i18n.t('worklist.openCaseFor', { name }) }),
    )
    expect(screen.getByText('case page')).toBeInTheDocument()
  })
})
