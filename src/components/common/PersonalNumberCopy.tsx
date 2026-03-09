import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
  Box,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  TypographyProps,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { formatPersonnummer } from '@/api/utils/personnummer'

type LabelFormat = 'long' | 'short' | 'none'

interface PersonalNumberCopyProps extends Pick<TypographyProps, 'color' | 'sx' | 'aria-label'> {
  personalNumber?: string | null
  labelFormat?: LabelFormat
  showCopy?: boolean
  copyAsRaw?: boolean
  onCopy?: (copied: string) => void
}

export default function PersonalNumberCopy({
  personalNumber,
  labelFormat = 'short',
  showCopy = true,
  copyAsRaw = false,
  color = 'text.secondary',
  onCopy,
  'aria-label': ariaLabel,
  sx,
}: PersonalNumberCopyProps) {
  const { t } = useTranslation()

  const formatted = personalNumber ? formatPersonnummer(personalNumber) : '—'

  async function handleCopy() {
    if (!personalNumber) return
    const normalized = personalNumber.replace(/[-+\s]/g, '')
    const formattedCopy =
      normalized.length === 12 ? `${normalized.slice(0, 8)}-${normalized.slice(8)}` : formatted
    const copyText = copyAsRaw ? normalized : formattedCopy
    try {
      await navigator.clipboard.writeText(copyText)
      onCopy?.(copyText)
      setCopiedOpen(true)
    } catch {
      onCopy?.(copyText)
      setCopiedOpen(true)
    }
  }

  const showLabel = labelFormat === 'long'
  const [copiedOpen, setCopiedOpen] = React.useState(false)

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={sx}>
        {showLabel ? (
          <Typography variant="body2" color={color}>
            {t('patient.personalNumber')}:
            <Box
              component="span"
              sx={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
                ml: 0.5,
              }}
            >
              {formatted}
            </Box>
          </Typography>
        ) : (
          labelFormat === 'short' && (
            <Typography
              variant="body2"
              color={color}
              sx={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
              }}
            >
              {formatted}
            </Typography>
          )
        )}

        {showCopy && personalNumber ? (
          <Tooltip title={ariaLabel ?? t('worklist.copyPersonalNumber')}>
            <IconButton
              size="small"
              aria-label={ariaLabel ?? t('worklist.copyPersonalNumber')}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                void handleCopy()
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      <Snackbar
        open={copiedOpen}
        autoHideDuration={1500}
        onClose={() => setCopiedOpen(false)}
        message={t('demoTools.copied')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </>
  )
}
