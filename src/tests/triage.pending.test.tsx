import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'
import TriageTab from '@/components/case/TriageTab'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

function wrap(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <RoleProvider>
          <SnackProvider>{ui}</SnackProvider>
        </RoleProvider>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

beforeAll(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('TriageTab pending-review guard', () => {
  it('shows a warning alert and hides the form when pending reviews exist', () => {
    const baseCase = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!
    // create a pending review via service so the store is updated
    service.createReview(baseCase.id, 'LAB', 'user-doc-1', 'DOCTOR')
    const updatedCase = service.getCase(baseCase.id)!

    wrap(<TriageTab caseData={updatedCase} onTriaged={vi.fn()} routeContactMode={null} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(i18n.t('triage.pendingReviews'))

    // the submit button from the triage form should not be present
    expect(screen.queryByText(i18n.t('triage.submit'))).toBeNull()
  })

  it('renders the triage form when no reviews are pending', () => {
    // build a case object identical to one in seed but with no reviews at all
    const original = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!
    const cleanCase = { ...original, reviews: [] }

    wrap(<TriageTab caseData={cleanCase} onTriaged={vi.fn()} routeContactMode={null} />)

    // contact mode options are part of the form (Swedish text in default locale)
    expect(screen.getByText(/Digital uppföljning/i)).toBeInTheDocument()
  })
})

describe('TriageTab colleague review', () => {
  it('lets the requested reviewer answer, also on an already triaged case', async () => {
    const triaged = SEED_STATE.cases.find((c) => c.status === 'TRIAGED' && c.triageDecision)!
    // the test session user is user-pal-1
    service.requestColleagueReview(
      triaged.id,
      'user-pal-1',
      'Räcker telefon?',
      'user-nurse-1',
      'NURSE',
    )
    const onTriaged = vi.fn()
    wrap(
      <TriageTab
        caseData={service.getCase(triaged.id)!}
        onTriaged={onTriaged}
        routeContactMode={null}
      />,
    )

    expect(screen.getByText('Räcker telefon?')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(i18n.t('triage.colleagueReview.responseLabel')), 'Ja')
    await user.click(screen.getByRole('button', { name: i18n.t('triage.colleagueReview.respond') }))
    await waitFor(() => expect(onTriaged).toHaveBeenCalled())
    const review = service.getCase(triaged.id)!.colleagueReviews.slice(-1)[0]
    expect(review.response).toBe('Ja')
  })

  it('shows the request link in the decision aside of an open case', () => {
    const original = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!
    wrap(
      <TriageTab
        caseData={{ ...original, reviews: [] }}
        onTriaged={vi.fn()}
        routeContactMode={null}
      />,
    )
    expect(
      screen.getByRole('button', { name: i18n.t('triage.colleagueReview.request') }),
    ).toBeInTheDocument()
  })
})
