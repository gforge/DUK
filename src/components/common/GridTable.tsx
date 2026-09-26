import type { SxProps, Theme } from '@mui/material'
import { Box } from '@mui/material'
import React from 'react'

import { tokens } from '@/theme'

interface GridBaseProps {
  /** CSS grid-template-columns shared by header and rows. */
  readonly columns: string
  /** Minimum row width before the parent SectionCard scrolls horizontally. */
  readonly minWidth?: number
  readonly children: React.ReactNode
  readonly sx?: SxProps<Theme>
}

/** Column header row for a grid-based table inside a SectionCard. */
export function GridTableHeader({ columns, minWidth, children, sx }: GridBaseProps) {
  return (
    <Box
      role="row"
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: columns,
          gap: 1.5,
          minWidth,
          px: 2,
          py: 1,
          bgcolor: tokens.headerBg,
          color: tokens.textSecondary,
          fontSize: 12,
          fontWeight: 600,
          borderBottom: `1px solid ${tokens.rowDivider}`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

interface GridTableRowProps extends GridBaseProps {
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  readonly onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  readonly tabIndex?: number
  readonly 'aria-label'?: string
  readonly muted?: boolean
  /** Marks the row for useRovingTabIndex arrow-key navigation. */
  readonly 'data-list-item'?: boolean
}

/** Body row for a grid-based table. Clickable rows get hover, focus ring and Enter/Space. */
export const GridTableRow = React.forwardRef<HTMLDivElement, GridTableRowProps>(
  function GridTableRow(
    {
      columns,
      minWidth,
      children,
      sx,
      onClick,
      onKeyDown,
      tabIndex,
      muted,
      'aria-label': ariaLabel,
      'data-list-item': dataListItem,
    },
    ref,
  ) {
    const clickable = Boolean(onClick)
    return (
      <Box
        ref={ref}
        role="row"
        aria-label={ariaLabel}
        data-list-item={dataListItem || undefined}
        tabIndex={clickable ? (tabIndex ?? 0) : tabIndex}
        onClick={onClick}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (
            clickable &&
            !e.defaultPrevented &&
            e.target === e.currentTarget &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault()
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
        }}
        sx={[
          {
            display: 'grid',
            gridTemplateColumns: columns,
            gap: 1.5,
            minWidth,
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${tokens.rowDivider}`,
            cursor: clickable ? 'pointer' : 'default',
            opacity: muted ? 0.65 : 1,
            '&:hover': { bgcolor: tokens.rowHover },
            '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: -2 },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    )
  },
)
