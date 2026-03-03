import React from 'react'
import { Chip, Tooltip, Stack } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import BugReportIcon from '@mui/icons-material/BugReport'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import { useTranslation } from 'react-i18next'
import type { TriggerType } from '../../api/schemas'

interface TriggerChipsProps {
  readonly triggers: TriggerType[]
  readonly maxVisible?: number
}

type TriggerConfig = {
  icon: React.ReactElement
  color: 'error' | 'warning' | 'info' | 'default'
}

const TRIGGER_CONFIG: Record<TriggerType, TriggerConfig> = {
  HIGH_PAIN: { icon: <LocalFireDepartmentIcon fontSize="inherit" />, color: 'error' },
  LOW_FUNCTION: { icon: <TrendingDownIcon fontSize="inherit" />, color: 'warning' },
  LOW_QOL: { icon: <SentimentDissatisfiedIcon fontSize="inherit" />, color: 'warning' },
  NOT_OPENED: { icon: <SmartphoneIcon fontSize="inherit" />, color: 'warning' },
  NO_RESPONSE: { icon: <PhoneMissedIcon fontSize="inherit" />, color: 'warning' },
  SEEK_CONTACT: { icon: <SupportAgentIcon fontSize="inherit" />, color: 'info' },
  INFECTION_SUSPECTED: { icon: <BugReportIcon fontSize="inherit" />, color: 'error' },
  ABNORMAL_ANSWER: { icon: <ReportProblemIcon fontSize="inherit" />, color: 'error' },
  LAB_PENDING: { icon: <BiotechIcon fontSize="inherit" />, color: 'info' },
  XRAY_PENDING: { icon: <ImageIcon fontSize="inherit" />, color: 'info' },
}

export default function TriggerChips({ triggers, maxVisible = 3 }: TriggerChipsProps) {
  const { t } = useTranslation()
  if (triggers.length === 0) return null

  const visible = triggers.slice(0, maxVisible)
  const overflow = triggers.length - maxVisible

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={0.5}
      role="list"
      aria-label={t('dashboard.triggers')}
    >
      {visible.map((trigger) => {
        const cfg = TRIGGER_CONFIG[trigger]
        return (
          <Tooltip key={trigger} title={t(`trigger.${trigger}`)} arrow enterDelay={300}>
            <Chip
              role="listitem"
              icon={cfg.icon}
              label={t(`trigger.${trigger}`)}
              size="small"
              variant="outlined"
              color={cfg.color}
              aria-label={t(`trigger.${trigger}`)}
              sx={{ fontSize: 10, height: 22 }}
            />
          </Tooltip>
        )
      })}
      {overflow > 0 && (
        <Tooltip
          title={triggers
            .slice(maxVisible)
            .map((tr) => t(`trigger.${tr}`))
            .join(', ')}
          arrow
        >
          <Chip
            label={`+${overflow}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 10, height: 22 }}
          />
        </Tooltip>
      )}
    </Stack>
  )
}
