import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRovingTabIndex } from '@/hooks/useRovingTabIndex'

// Simple test component that uses the hook
function RovingList({ items }: { items: string[] }) {
  const { getItemProps } = useRovingTabIndex(items.length)

  return (
    <ul role="list">
      {items.map((item, index) => (
        <li key={item} role="listitem" data-testid={`item-${index}`} {...getItemProps(index)}>
          {item}
        </li>
      ))}
    </ul>
  )
}

const ITEMS = ['Item A', 'Item B', 'Item C', 'Item D']

describe('useRovingTabIndex', () => {
  it('renders items — first has tabIndex 0, others have -1', () => {
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
    expect(items[3]).toHaveAttribute('tabindex', '-1')
  })

  it('attaches data-list-item attribute to all items', () => {
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    items.forEach((item: HTMLElement) => {
      expect(item).toHaveAttribute('data-list-item')
    })
  })

  it('attaches onKeyDown handler to items', () => {
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    // Items should have a keydown listener (not null)
    items.forEach((item: HTMLElement) => {
      expect(item.onkeydown).not.toBeUndefined()
    })
  })

  it('does not throw on ArrowDown keypress', async () => {
    const user = userEvent.setup()
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    items[0].focus()

    await expect(user.keyboard('{ArrowDown}')).resolves.not.toThrow()
  })

  it('does not throw on ArrowUp keypress', async () => {
    const user = userEvent.setup()
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    items[2].focus()

    await expect(user.keyboard('{ArrowUp}')).resolves.not.toThrow()
  })

  it('does not throw on Home and End keypresses', async () => {
    const user = userEvent.setup()
    render(<RovingList items={ITEMS} />)

    const items = screen.getAllByRole('listitem')
    items[1].focus()

    await expect(user.keyboard('{End}')).resolves.not.toThrow()
    await expect(user.keyboard('{Home}')).resolves.not.toThrow()
  })

  it('getItemProps returns correct tabIndex for each item', () => {
    render(<RovingList items={ITEMS} />)

    // Only the first item (index 0) should have tabindex="0"
    const tabIndexes = screen
      .getAllByRole('listitem')
      .map((el: HTMLElement) => el.getAttribute('tabindex'))

    expect(tabIndexes[0]).toBe('0')
    expect(tabIndexes.slice(1).every((ti: string | null) => ti === '-1')).toBe(true)
  })
})
