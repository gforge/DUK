import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { initStore } from '@/api/storage'
import TriageForm from '@/components/case/triage/TriageForm'

import i18n from '../i18n'

beforeAll(() => {
  initStore(structuredClone(SEED_STATE))
})

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

const CASE_NEEDS_REVIEW = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!

describe('TriageForm two-step flow', () => {
  it('shows contact mode options in step 1', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    expect(screen.getByText('Digital')).toBeInTheDocument()
    expect(screen.getByText('Telefon')).toBeInTheDocument()
    expect(screen.getByText('Besök')).toBeInTheDocument()
    expect(screen.getByText('Avslut')).toBeInTheDocument()
  })

  it('selecting Avslut shows close info and submits CLOSE decision', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Avslut'))

    await waitFor(() => {
      expect(screen.getByText(/skapar normalt ingen rad i åtgärdslistan/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /bekräfta triage/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          triageDecision: expect.objectContaining({
            contactMode: 'CLOSE',
            careRole: null,
            assignmentMode: null,
          }),
        }),
      )
    })
  })

  it('selecting Telefon allows role + assignment and submits PHONE decision', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Telefon'))

    await user.click(screen.getByRole('button', { name: 'Sjuksköterska' }))

    await user.click(screen.getByLabelText('Tilldelning'))
    await user.click(screen.getByRole('option', { name: 'Valfri' }))

    await user.click(screen.getByRole('button', { name: /bekräfta triage/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          triageDecision: expect.objectContaining({
            contactMode: 'PHONE',
            careRole: 'NURSE',
            assignmentMode: 'ANY',
          }),
        }),
      )
    })
  })
})
