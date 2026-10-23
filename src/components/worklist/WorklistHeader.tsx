import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/common'
import { COMPLETED_WINDOW_DAYS } from '@/hooks/useWorklistQueue'
import { tokens } from '@/theme'

export type WorklistTab = 'active' | 'monitoring' | 'completed'

interface WorklistHeaderProps {
  tab: WorklistTab
  onTabChange: (tab: WorklistTab) => void
  activeCount: number
  monitoringCount: number
  completedCount: number
  pulseCount: boolean
  pulseCompletedCount: boolean
}

const pulseSx = {
  animation: 'worklistPulse 0.5s ease-in-out',
  '@keyframes worklistPulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.14)' },
    '100%': { transform: 'scale(1)' },
  },
}

function CountBadge({
  count,
  selected,
  pulse,
}: {
  count: number
  selected: boolean
  pulse: boolean
}) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: 12,
        fontWeight: 400,
        px: '7px',
        py: '1px',
        borderRadius: '10px',
        bgcolor: selected ? tokens.selectedBg : tokens.greyFill,
        color: selected ? tokens.primaryDark : tokens.text2,
        ...(pulse ? pulseSx : {}),
      }}
    >
      {count}
    </Box>
  )
}

export default function WorklistHeader({
  tab,
  onTabChange,
  activeCount,
  monitoringCount,
  completedCount,
  pulseCount,
  pulseCompletedCount,
}: WorklistHeaderProps) {
  const { t } = useTranslation()
  const tabs: Array<{ value: WorklistTab; label: string; count: number; pulse: boolean }> = [
    { value: 'active', label: t('worklist.activeLabel'), count: activeCount, pulse: pulseCount },
    {
      value: 'monitoring',
      label: t('worklist.monitoringLabel'),
      count: monitoringCount,
      pulse: false,
    },
    {
      value: 'completed',
      label: t('worklist.completedLabel'),
      count: completedCount,
      pulse: pulseCompletedCount,
    },
  ]
  const info =
    tab === 'active'
      ? t('worklist.infoActive')
      : tab === 'monitoring'
        ? t('worklist.infoMonitoring')
        : t('worklist.infoCompleted', { count: COMPLETED_WINDOW_DAYS })

  return (
    <>
      <PageHeader title={t('worklist.title')} subtitle={t('worklist.subtitle')} />
      <Tabs
        value={tab}
        onChange={(_, value: WorklistTab) => onTabChange(value)}
        aria-label={t('worklist.tabsLabel')}
        sx={{
          minHeight: 0,
          borderBottom: `1px solid ${tokens.border}`,
          '& .MuiTabs-indicator': { height: 2, bgcolor: tokens.primary },
          '& .MuiTabs-flexContainer': { gap: 0.5 },
        }}
      >
        {tabs.map((item) => {
          const selected = item.value === tab
          return (
            <Tab
              key={item.value}
              value={item.value}
              id={`worklist-tab-${item.value}`}
              aria-controls="worklist-tabpanel"
              disableRipple
              label={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.label}
                  <CountBadge count={item.count} selected={selected} pulse={item.pulse} />
                </Box>
              }
              sx={{
                minHeight: 0,
                minWidth: 0,
                px: 1.75,
                py: 1.25,
                textTransform: 'none',
                fontSize: 'inherit',
                fontWeight: selected ? 600 : 400,
                color: tokens.textSecondary,
                '&.Mui-selected': { color: tokens.primary },
              }}
            />
          )
        })}
      </Tabs>
      <Typography
        component="div"
        sx={{
          color: tokens.textSecondary,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
        {info}
      </Typography>
    </>
  )
}
