import { Box, Tooltip } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { JourneyTemplateEntry, JourneyTemplateInstruction } from '@/api/schemas'
import { tokens } from '@/theme'

interface Props {
  readonly entries: JourneyTemplateEntry[]
  readonly instructions: JourneyTemplateInstruction[]
  readonly instructionName: (instr: JourneyTemplateInstruction) => string
}

const TICK_DAYS = [0, 14, 30, 90, 182, 365, 730, 1095, 1825]
const LABEL_ROW = 16
const AXIS_TOP = 66
const LANE_TOP = 88
const LANE_HEIGHT = 26

/**
 * Horizontal overview of a journey template: each form step is a dot with its
 * ± answer window, each instruction a purple bar over the days it is shown.
 * Uses a square-root scale so early, dense steps stay readable next to 1–2 year follow-ups.
 */
export function TemplateTimeline({ entries, instructions, instructionName }: Props) {
  const { t } = useTranslation()
  const max = Math.max(
    90,
    ...entries.map((e) => e.offsetDays + e.windowDays),
    ...instructions.map((i) => i.endDayOffset ?? i.startDayOffset),
  )
  const pos = (d: number) => Math.sqrt(Math.min(Math.max(d, 0), max) / max) * 100
  const x = (d: number) => `${pos(d)}%`
  const span = (from: number, to: number) => `${Math.max(pos(to) - pos(from), 0)}%`

  const tickLabel = (d: number) => {
    if (d === 0) return t('journey.editor.browser.tickStart')
    if (d < 30) return t('journey.editor.browser.tickWeeks', { count: Math.round(d / 7) })
    if (d < 365) return t('journey.editor.browser.tickMonths', { count: Math.round(d / 30) })
    return t('journey.editor.browser.tickYears', { count: Math.round(d / 365) })
  }
  const ticks = TICK_DAYS.filter((d) => d <= max)
  const height = LANE_TOP + instructions.length * LANE_HEIGHT + 22

  return (
    <Box sx={{ minWidth: 640, pl: 4.5, pr: 6 }}>
      <Box sx={{ position: 'relative', height }}>
        {ticks.map((d) => (
          <React.Fragment key={`tick-${d}`}>
            <Box
              sx={{
                position: 'absolute',
                left: x(d),
                top: 46,
                bottom: 18,
                width: '1px',
                bgcolor: tokens.rowDivider,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: x(d),
                bottom: 0,
                transform: 'translateX(-50%)',
                fontSize: 11,
                color: tokens.textMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {tickLabel(d)}
            </Box>
          </React.Fragment>
        ))}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: AXIS_TOP,
            height: 2,
            bgcolor: tokens.border,
            borderRadius: 1,
          }}
        />
        {entries.map((e, i) => {
          const from = Math.max(0, e.offsetDays - e.windowDays)
          const to = e.offsetDays + e.windowDays
          return (
            <React.Fragment key={e.id}>
              <Tooltip
                title={`${e.label} · ${t('journey.editor.browser.windowDays', { count: e.windowDays })}`}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: x(from),
                    width: span(from, to),
                    minWidth: 4,
                    top: AXIS_TOP - 5,
                    height: 12,
                    bgcolor: tokens.windowBar,
                    borderRadius: '6px',
                  }}
                />
              </Tooltip>
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: x(e.offsetDays),
                  top: AXIS_TOP - 6,
                  width: 14,
                  height: 14,
                  ml: '-7px',
                  borderRadius: '50%',
                  bgcolor: tokens.primary,
                  border: `2px solid ${tokens.paper}`,
                  boxShadow: `0 0 0 1px ${tokens.primary}`,
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: x(e.offsetDays),
                  top: (i % 3) * LABEL_ROW,
                  transform: 'translateX(-50%)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.text,
                  whiteSpace: 'nowrap',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={e.label}
              >
                {e.label}
              </Box>
            </React.Fragment>
          )
        })}
        {instructions.map((instr, i) => {
          const end = instr.endDayOffset ?? max
          const name = instructionName(instr)
          return (
            <Box
              key={instr.id}
              title={name}
              sx={{
                position: 'absolute',
                left: x(instr.startDayOffset),
                width: span(instr.startDayOffset, end),
                minWidth: 8,
                top: LANE_TOP + i * LANE_HEIGHT,
                height: 20,
                bgcolor: tokens.instructionBar,
                borderLeft: `3px solid ${tokens.instructionAccent}`,
                borderRadius: 1,
                color: tokens.instructionFg,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '20px',
                px: 0.75,
                whiteSpace: 'nowrap',
                overflow: 'visible',
              }}
            >
              {name}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
