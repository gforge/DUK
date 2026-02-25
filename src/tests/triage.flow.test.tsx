import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import TriageActionCards from '../components/case/triage/TriageActionCards'
import TriageContextBar from '../components/case/triage/TriageContextBar'
import TriageForm from '../components/case/triage/TriageForm'
import { SEED_STATE } from '../api/seed'
import { initStore } from '../api/storage'

beforeAll(() => {
  initStore(structuredClone(SEED_STATE))
})

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

const CASE_NEEDS_REVIEW = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!

// ─── TriageActionCards ────────────────────────────────────────────────────────

describe('TriageActionCards', () => {
  it('renders all 6 action cards', () => {
    const onSelect = vi.fn()
    wrap(<TriageActionCards onSelect={onSelect} />)

    // Labels come from i18n sv keys
    expect(screen.getByText('Digital kontroll')).toBeInTheDocument()
    expect(screen.getByText('Telefonkontakt')).toBeInTheDocument()
    expect(screen.getByText('Sköterskebesök')).toBeInTheDocument()
    expect(screen.getByText('Läkarbesök')).toBeInTheDocument()
    expect(screen.getByText('Fysiobesök')).toBeInTheDocument()
    expect(screen.getByText('Stäng kontrollpunkt')).toBeInTheDocument()
  })

  it('calls onSelect with the correct action key on click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    wrap(<TriageActionCards onSelect={onSelect} />)

    await user.click(screen.getByText('Digital kontroll'))
    expect(onSelect).toHaveBeenCalledWith('DIGITAL_CONTROL')
  })

  it('calls onSelect when Enter is pressed on a card', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    wrap(<TriageActionCards onSelect={onSelect} />)

    const card = screen.getByRole('button', { name: /telefonkontakt/i })
    card.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('PHONE_CALL')
  })

  it('calls onSelect when Space is pressed on a card', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    wrap(<TriageActionCards onSelect={onSelect} />)

    const card = screen.getByRole('button', { name: /läkarbesök/i })
    card.focus()
    await user.keyboard(' ')
    expect(onSelect).toHaveBeenCalledWith('DOCTOR_VISIT')
  })
})

// ─── TriageContextBar ─────────────────────────────────────────────────────────

describe('TriageContextBar', () => {
  it('renders status and category chips', () => {
    const caseData = SEED_STATE.cases[0]
    wrap(<TriageContextBar caseData={caseData} />)
    // Status chip renders the translated status
    expect(document.querySelector('[class*="MuiChip"]')).toBeInTheDocument()
  })
})

// ─── TriageForm step flow ─────────────────────────────────────────────────────

describe('TriageForm — step flow', () => {
  it('shows action cards on initial render (step 1)', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    expect(screen.getByText('Digital kontroll')).toBeInTheDocument()
    // Deadline field should NOT be visible yet
    expect(screen.queryByLabelText(/deadline/i)).not.toBeInTheDocument()
  })

  it('selecting DIGITAL_CONTROL shows deadline field in step 2', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Digital kontroll'))

    // Step 2 should render deadline
    await waitFor(() => {
      expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument()
    })
    // Action cards should be gone
    expect(screen.queryByText('Telefonkontakt')).not.toBeInTheDocument()
  })

  it('selecting CLOSE_NOW shows confirmation text and no deadline field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Stäng kontrollpunkt'))

    await waitFor(() => {
      expect(screen.getByText(/stängs utan uppföljning/i)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/deadline/i)).not.toBeInTheDocument()
  })

  it('back button returns to step 1', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Digital kontroll'))
    await waitFor(() => screen.getAllByRole('button', { name: /välj annan åtgärd/i }))

    // Click the first "back" button
    await user.click(screen.getAllByRole('button', { name: /välj annan åtgärd/i })[0])

    // Should be back at step 1
    await waitFor(() => {
      expect(screen.getByText('Digital kontroll')).toBeInTheDocument()
    })
  })

  it('submitting DIGITAL_CONTROL with default deadline calls onSubmit with correct data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Digital kontroll'))
    await waitFor(() => screen.getByLabelText(/deadline/i))

    // Submit with pre-filled deadline "2v"
    await user.click(screen.getByRole('button', { name: /bekräfta triage/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nextStep: 'DIGITAL_CONTROL',
          closeImmediately: false,
          assignedRole: 'NURSE',
        }),
      )
    })
  })

  it('CLOSE_NOW pre-fills closeImmediately=true and nextStep=NO_ACTION on submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByText('Stäng kontrollpunkt'))
    await waitFor(() => screen.getByText(/stängs utan uppföljning/i))

    await user.click(screen.getByText('Bekräfta triage'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nextStep: 'NO_ACTION',
          closeImmediately: true,
        }),
      )
    })
  })
})
