import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { format } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { tokens } from '@/theme'

interface Props {
  readonly patientName: string
  readonly phone: string | undefined
  /** When the clinician chose "ringer nu"; shown as "Samtal startat 15:04". */
  readonly startedAt: Date | null
}

/** The number to dial, a copy button and when the call started. */
export function PhoneBox({ patientName, phone, startedAt }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    if (!phone) return
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
    } catch {
      /* clipboard unavailable: the number is still visible */
    }
  }

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1.75,
        p: '12px 14px',
        border: `1px solid ${tokens.border}`,
        borderRadius: '10px',
        bgcolor: tokens.headerBg,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: tokens.textSecondary }}>
          {t('triage.phone.call', { name: patientName })}
        </Typography>
        {phone ? (
          <Typography
            component="a"
            href={`tel:${phone.replace(/[\s-]/g, '')}`}
            sx={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.2,
              color: tokens.text,
              textDecoration: 'none',
            }}
          >
            {phone}
          </Typography>
        ) : (
          <Typography sx={{ fontWeight: 600, color: tokens.textSecondary }}>
            {t('triage.phone.missing')}
          </Typography>
        )}
      </Box>
      {phone && (
        <Tooltip title={copied ? t('triage.phone.copied') : t('triage.phone.copy')}>
          <IconButton
            aria-label={t('triage.phone.copy')}
            onClick={() => void copy()}
            sx={{
              border: `1px solid ${tokens.border}`,
              borderRadius: '10px',
              bgcolor: tokens.paper,
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {startedAt && (
        <Typography sx={{ fontSize: 12, color: tokens.textSecondary, whiteSpace: 'nowrap' }}>
          {t('triage.phone.started', { time: format(startedAt, 'HH:mm') })}
        </Typography>
      )}
    </Stack>
  )
}
