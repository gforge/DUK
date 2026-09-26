import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, ButtonBase, Typography } from '@mui/material'
import React, { useId } from 'react'

import { tokens } from '@/theme'

interface SectionCardProps {
  readonly title?: React.ReactNode
  readonly description?: React.ReactNode
  /** Right-aligned summary in the header, e.g. "3 patienter". */
  readonly count?: React.ReactNode
  /** Small coloured square before the title (queue category). */
  readonly markerColor?: string
  /** Icon in a grey rounded square before the title (worklist groups). */
  readonly icon?: React.ReactNode
  readonly children: React.ReactNode
  readonly 'aria-label'?: string
  /** When set, the header becomes a toggle and the body is hidden while `open` is false. */
  readonly onToggle?: () => void
  readonly open?: boolean
  /** Keeps the header as wide as the table so both scroll together. */
  readonly headerMinWidth?: number
}

/** White bordered card that holds a table or list; scrolls horizontally on narrow screens. */
export default function SectionCard({
  title,
  description,
  count,
  markerColor,
  icon,
  children,
  'aria-label': ariaLabel,
  onToggle,
  open = true,
  headerMinWidth,
}: SectionCardProps) {
  const bodyId = useId()
  const collapsible = Boolean(onToggle)

  const headerContent = (
    <>
      {markerColor && (
        <Box
          component="span"
          sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: markerColor, flexShrink: 0 }}
        />
      )}
      {icon && (
        <Box
          component="span"
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: tokens.greyFill,
            color: tokens.text2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        component={collapsible ? 'span' : 'h2'}
        sx={{ m: 0, fontSize: 16, fontWeight: 700 }}
      >
        {title}
      </Typography>
      {description && <Typography color="text.secondary">{description}</Typography>}
      {count !== undefined && (
        <Typography
          component="span"
          sx={{ ml: 'auto', color: tokens.text2, fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          {count}
        </Typography>
      )}
      {collapsible && (
        <Box
          component="span"
          sx={{
            ml: count === undefined ? 'auto' : 0,
            color: tokens.textSecondary,
            display: 'flex',
            '& svg': { fontSize: 22 },
          }}
        >
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      )}
    </>
  )

  const headerSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: 2,
    py: 1.75,
    minWidth: headerMinWidth,
    borderBottom: open ? `1px solid ${tokens.border}` : 'none',
  }

  return (
    <Box
      component="section"
      aria-label={ariaLabel}
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${tokens.border}`,
        borderRadius: 3,
        overflowX: 'auto',
      }}
    >
      {title &&
        (collapsible ? (
          <Box component="h2" sx={{ m: 0, font: 'inherit' }}>
            <ButtonBase
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={bodyId}
              sx={{
                ...headerSx,
                width: '100%',
                font: 'inherit',
                textAlign: 'left',
                justifyContent: 'flex-start',
                '&:hover': { bgcolor: tokens.headerBg },
                '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: -2 },
              }}
            >
              {headerContent}
            </ButtonBase>
          </Box>
        ) : (
          <Box sx={headerSx}>{headerContent}</Box>
        ))}
      <Box id={bodyId} hidden={!open}>
        {open && children}
      </Box>
    </Box>
  )
}
