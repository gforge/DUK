import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import GppMaybeIcon from '@mui/icons-material/GppMaybeOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartmentOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfiedOutlined'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PolicyRule } from '@/api/schemas'
import type { TagVariant } from '@/components/common'
import { GridTableHeader, GridTableRow, SectionCard, Tag } from '@/components/common'
import { useSeverityLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

interface Props {
  rules: PolicyRule[]
  deleting: string | null
  onToggle: (rule: PolicyRule) => void
  onEdit: (rule: PolicyRule) => void
  onDelete: (id: string) => void
}

const COLUMNS = '64px minmax(200px,1.4fr) minmax(180px,1fr) 130px 88px'
const MIN_WIDTH = 760

const SEVERITY_TAG: Record<PolicyRule['severity'], { variant: TagVariant; icon: React.ReactNode }> =
  {
    HIGH: { variant: 'error', icon: <ErrorOutlineIcon /> },
    MEDIUM: { variant: 'clinical', icon: <WarningAmberIcon /> },
    LOW: { variant: 'admin', icon: <InfoOutlinedIcon /> },
  }

/**
 * Rules have no explicit type, so the icon is inferred from the measurement the
 * expression refers to: pain (PNRS / HIGH_PAIN), function scores, or quality of life.
 */
function ruleIcon(expression: string): React.ReactNode {
  const expr = expression.toUpperCase()
  if (/PNRS|HIGH_PAIN|PAIN/.test(expr)) return <LocalFireDepartmentIcon />
  if (/EQ5D|EQ_VAS|QOL/.test(expr)) return <SentimentDissatisfiedIcon />
  if (/OSS|OKS|OHS|PRWE|MOXFQ|DASH|LOW_FUNCTION|FUNCTION/.test(expr)) return <TrendingDownIcon />
  return <GppMaybeIcon />
}

/** Compact 36×20 switch matching the design; a native button with role="switch". */
function RuleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <ButtonBase
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      sx={{
        width: 36,
        height: 20,
        borderRadius: '10px',
        bgcolor: checked ? tokens.primary : tokens.switchOff,
        position: 'relative',
        transition: 'background-color 120ms',
        '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 2 },
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: tokens.paper,
          transition: 'left 120ms',
        }}
      />
    </ButtonBase>
  )
}

export default function PolicyRulesTable({ rules, deleting, onToggle, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const getSeverityLabel = useSeverityLabel()
  const [menu, setMenu] = useState<{ anchor: HTMLElement; rule: PolicyRule } | null>(null)

  return (
    <SectionCard aria-label={t('policy.title')}>
      <Box role="table" aria-label={t('policy.title')}>
        <GridTableHeader columns={COLUMNS} minWidth={MIN_WIDTH}>
          <Box role="columnheader">{t('policy.enabled')}</Box>
          <Box role="columnheader">{t('policy.rule')}</Box>
          <Box role="columnheader">{t('policy.condition')}</Box>
          <Box role="columnheader">{t('policy.severity')}</Box>
          <Box role="columnheader" />
        </GridTableHeader>
        {rules.map((rule) => {
          const sev = SEVERITY_TAG[rule.severity]
          return (
            <GridTableRow key={rule.id} columns={COLUMNS} minWidth={MIN_WIDTH}>
              <Box role="cell">
                <RuleSwitch
                  checked={rule.enabled}
                  label={
                    rule.enabled
                      ? t('policy.deactivateRule', { name: rule.name })
                      : t('policy.activateRule', { name: rule.name })
                  }
                  onChange={() => onToggle(rule)}
                />
              </Box>
              <Box role="cell" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: rule.enabled ? 600 : 400,
                    color: rule.enabled ? 'text.primary' : tokens.textMuted,
                    '& svg': {
                      fontSize: 18,
                      color: rule.enabled ? tokens.textSecondary : tokens.textMuted,
                      flexShrink: 0,
                    },
                  }}
                >
                  {ruleIcon(rule.expression)}
                  <span>
                    {rule.name}
                    {!rule.enabled && ` · ${t('policy.inactive')}`}
                  </span>
                </Box>
                {rule.description && (
                  <Typography
                    variant="body2"
                    sx={{ color: tokens.textSecondary, fontSize: 12, mt: 0.25, pl: 3.25 }}
                  >
                    {rule.description}
                  </Typography>
                )}
              </Box>
              <Box role="cell" sx={{ minWidth: 0 }}>
                <Box
                  component="code"
                  sx={{
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fontSize: 12,
                    bgcolor: tokens.greyFill,
                    color: tokens.text2,
                    px: 1,
                    py: '3px',
                    borderRadius: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {rule.expression}
                </Box>
              </Box>
              <Box role="cell">
                <Tag
                  shape="pill"
                  variant={sev.variant}
                  icon={sev.icon}
                  label={getSeverityLabel(rule.severity)}
                />
              </Box>
              <Box
                role="cell"
                sx={{
                  display: 'flex',
                  gap: 0.25,
                  justifyContent: 'flex-end',
                  '& .MuiIconButton-root': { color: tokens.textSecondary, borderRadius: 1.5 },
                  '& svg': { fontSize: 18 },
                }}
              >
                <IconButton size="small" aria-label={t('common.edit')} onClick={() => onEdit(rule)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t('common.moreActions')}
                  aria-haspopup="menu"
                  disabled={deleting === rule.id}
                  onClick={(e) => setMenu({ anchor: e.currentTarget, rule })}
                >
                  {deleting === rule.id ? <CircularProgress size={14} /> : <MoreVertIcon />}
                </IconButton>
              </Box>
            </GridTableRow>
          )
        })}
        {rules.length === 0 && (
          <Typography color="text.secondary" variant="body2" align="center" sx={{ p: 3 }}>
            {t('policy.noRules')}
          </Typography>
        )}
      </Box>
      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menu) onDelete(menu.rule.id)
            setMenu(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </SectionCard>
  )
}
