import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'

import type { PolicyRule } from '@/api/schemas'
import { PolicyRulesTable } from '@/components/policy'

import i18n from '../i18n'

const RULES: PolicyRule[] = [
  {
    id: 'r1',
    journeyTemplateId: 't1',
    name: 'High pain',
    expression: 'PNRS_week4 >= 7',
    severity: 'HIGH',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'r2',
    journeyTemplateId: 't1',
    name: 'Low function',
    expression: 'OSS_week4 < 25',
    severity: 'LOW',
    enabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function setup() {
  const props = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      <PolicyRulesTable rules={RULES} deleting={null} {...props} />
    </I18nextProvider>,
  )
  return props
}

describe('PolicyRulesTable', () => {
  it('renders switches with state-dependent labels and toggles a rule', async () => {
    const { onToggle } = setup()
    const on = screen.getByRole('switch', {
      name: i18n.t('policy.deactivateRule', { name: 'High pain' }),
    })
    const off = screen.getByRole('switch', {
      name: i18n.t('policy.activateRule', { name: 'Low function' }),
    })
    expect(on).toHaveAttribute('aria-checked', 'true')
    expect(off).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(`Low function · ${i18n.t('policy.inactive')}`)).toBeInTheDocument()
    await userEvent.click(off)
    expect(onToggle).toHaveBeenCalledWith(RULES[1])
  })

  it('edits via the edit button and deletes via the more-actions menu', async () => {
    const { onEdit, onDelete } = setup()
    await userEvent.click(screen.getAllByRole('button', { name: i18n.t('common.edit') })[0])
    expect(onEdit).toHaveBeenCalledWith(RULES[0])
    await userEvent.click(screen.getAllByRole('button', { name: i18n.t('common.moreActions') })[1])
    await userEvent.click(await screen.findByRole('menuitem', { name: i18n.t('common.delete') }))
    expect(onDelete).toHaveBeenCalledWith('r2')
  })
})
