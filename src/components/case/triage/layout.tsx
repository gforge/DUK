import { Box, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { TOPBAR_HEIGHT } from '@/components/layout/layoutConstants'
import { tokens } from '@/theme'

import { cardSx } from './styles'

/** Two-column triage layout: form to the left, sticky decision aside to the right. */
export function TriageLayout({
  main,
  aside,
}: {
  readonly main: React.ReactNode
  readonly aside: React.ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(280px,340px)' },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>{main}</Box>
      <Box
        component="aside"
        sx={{
          ...cardSx,
          position: { md: 'sticky' },
          top: { md: TOPBAR_HEIGHT + 20 },
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
        }}
      >
        {aside}
      </Box>
    </Box>
  )
}

interface SectionProps {
  readonly number?: number
  readonly title: React.ReactNode
  readonly required?: boolean
  readonly optional?: boolean
  readonly trailing?: React.ReactNode
  readonly id?: string
  readonly children: React.ReactNode
}

/** Numbered form section: "1. Kontaktläge *". */
export function TriageSection({
  number,
  title,
  required,
  optional,
  trailing,
  id,
  children,
}: SectionProps) {
  const { t } = useTranslation()
  return (
    <Stack component="section" aria-labelledby={id} sx={{ gap: 1.25 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}
      >
        <Typography id={id} component="h3" sx={{ fontWeight: 700, fontSize: 15 }}>
          {number !== undefined && `${number}. `}
          {title}
          {required && (
            <Box component="span" aria-hidden sx={{ color: tokens.danger }}>
              {' *'}
            </Box>
          )}
          {optional && (
            <Box
              component="span"
              sx={{ fontWeight: 400, color: tokens.textSecondary, fontSize: 13 }}
            >
              {' '}
              {t('triage.optional')}
            </Box>
          )}
        </Typography>
        {trailing}
      </Stack>
      {children}
    </Stack>
  )
}

/** "Beslut" heading used in the aside. */
export function AsideTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <Typography component="h3" sx={{ fontWeight: 700, fontSize: 15 }}>
      {children}
    </Typography>
  )
}

export interface DecisionRow {
  readonly key: string
  readonly label: string
  readonly value: string | null | undefined
}

/** Key/value rows of the decision aside; unset values show a grey "Ej valt". */
export function DecisionRows({ rows }: { readonly rows: readonly DecisionRow[] }) {
  const { t } = useTranslation()
  return (
    <Box component="dl" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {rows.map((r) => (
        <Box
          key={r.key}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1.5,
            borderBottom: `1px solid ${tokens.greyFill}`,
            pb: 1,
          }}
        >
          <Box component="dt" sx={{ color: tokens.textSecondary }}>
            {r.label}
          </Box>
          <Box
            component="dd"
            sx={{
              m: 0,
              textAlign: 'right',
              fontWeight: r.value ? 600 : 400,
              color: r.value ? tokens.text : tokens.textMuted,
              overflowWrap: 'anywhere',
            }}
          >
            {r.value || t('triage.notChosen')}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
