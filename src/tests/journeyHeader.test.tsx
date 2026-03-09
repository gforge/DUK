import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import JourneyHeader from '@/components/case/JourneyTab/JourneyHeader'

import i18n from '../i18n'

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

function baseProps() {
  return {
    template: SEED_STATE.journeyTemplates[0],
    showStatusChip: false,
    pauseLoading: false,
    onPauseClick: vi.fn(),
    onModifyClick: vi.fn(),
    onResume: vi.fn(),
    onCancelClick: vi.fn(),
  }
}

describe('JourneyHeader action hierarchy', () => {
  it('shows start-next-phase as primary for ACTIVE and puts pause/cancel in overflow', async () => {
    const user = userEvent.setup()
    const active = SEED_STATE.patientJourneys.find((j) => j.status === 'ACTIVE')
    if (!active) throw new Error('Expected at least one ACTIVE journey in seed')

    const props = baseProps()
    wrap(<JourneyHeader journey={active} onStartNextPhase={vi.fn()} {...props} />)

    expect(
      screen.getByRole('button', { name: i18n.t('journey.startNextPhase') }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: i18n.t('journey.modify.action') }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: i18n.t('common.moreActions') })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: i18n.t('journey.resume') })).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('journey.pause'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('journey.cancel'))).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: i18n.t('common.moreActions') }))
    expect(
      await screen.findByRole('menuitem', { name: i18n.t('journey.pause') }),
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: i18n.t('journey.cancel') })).toBeInTheDocument()
  })

  it('shows resume as primary for SUSPENDED and hides pause from overflow', async () => {
    const user = userEvent.setup()
    const active = SEED_STATE.patientJourneys.find((j) => j.status === 'ACTIVE')
    if (!active) throw new Error('Expected at least one ACTIVE journey in seed')

    const suspended = {
      ...active,
      id: `${active.id}-suspended`,
      status: 'SUSPENDED' as const,
      pausedAt: new Date().toISOString(),
    }

    const props = baseProps()
    wrap(<JourneyHeader journey={suspended} {...props} />)

    expect(screen.getByRole('button', { name: i18n.t('journey.resume') })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: i18n.t('journey.modify.action') }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: i18n.t('common.moreActions') }))
    expect(
      await screen.findByRole('menuitem', { name: i18n.t('journey.cancel') }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: i18n.t('journey.pause') }),
    ).not.toBeInTheDocument()
  })

  it('omits start-next-phase when callback is not provided', () => {
    const active = SEED_STATE.patientJourneys.find((j) => j.status === 'ACTIVE')
    if (!active) throw new Error('Expected at least one ACTIVE journey in seed')

    wrap(<JourneyHeader journey={active} {...baseProps()} />)

    expect(
      screen.queryByRole('button', { name: i18n.t('journey.startNextPhase') }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: i18n.t('journey.modify.action') }),
    ).toBeInTheDocument()
  })
})
