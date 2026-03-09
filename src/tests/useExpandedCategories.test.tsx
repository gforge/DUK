import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useExpandedCategories, EXPANDED_STORAGE_KEY } from '@/hooks/useExpandedCategories'

function TestComp() {
  const { expanded, toggleExpanded } = useExpandedCategories()
  return (
    <>
      <button onClick={() => toggleExpanded('ACUTE')}>toggle acute</button>
      <div data-testid="value">{Array.from(expanded).join(',')}</div>
    </>
  )
}

describe('useExpandedCategories hook', () => {
  beforeEach(() => {
    localStorage.removeItem(EXPANDED_STORAGE_KEY)
  })

  it('toggles a category and mirrors storage', async () => {
    render(<TestComp />)
    const btn = screen.getByRole('button', { name: /toggle acute/i })
    const value = screen.getByTestId('value')

    expect(value).toHaveTextContent('')

    await userEvent.click(btn)
    expect(value).toHaveTextContent('ACUTE')
    expect(JSON.parse(localStorage.getItem(EXPANDED_STORAGE_KEY)!)).toEqual(['ACUTE'])

    await userEvent.click(btn)
    expect(value).toHaveTextContent('')
    expect(JSON.parse(localStorage.getItem(EXPANDED_STORAGE_KEY)!)).toEqual([])
  })
})
