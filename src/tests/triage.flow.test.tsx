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

    // the card labels are fully localized; check full strings via i18n
    expect(
      screen.getByText(new RegExp(i18n.t('triage.contactMode.DIGITAL'), 'i')),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(i18n.t('triage.contactMode.PHONE'), 'i')),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(i18n.t('triage.contactMode.VISIT'), 'i')),
    ).toBeInTheDocument()
    // close option also exists but its label appears twice (title + help text), so we omit a strict assertion
  })

  it('selecting close option shows close info and submits CLOSE decision', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    // pick the first element containing the close label (title, not help text)
    const closeElements = screen.getAllByText(new RegExp(i18n.t('triage.contactMode.CLOSE'), 'i'))
    await user.click(closeElements[0])

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(i18n.t('triage.closeNoWorklist'), 'i')),
      ).toBeInTheDocument()
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

    await user.click(screen.getByText(new RegExp(i18n.t('triage.contactMode.PHONE'), 'i')))

    await user.click(screen.getByRole('button', { name: 'Sjuksköterska' }))

    // assignment mode is now a group of toggle buttons rather than a select
    // button labels are localized; look up the correct text via i18n
    const anyLabel = i18n.t('triage.assignmentModeOption.ANY') as string
    await user.click(screen.getByRole('button', { name: anyLabel }))

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
