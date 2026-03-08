import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DownloadIcon from '@mui/icons-material/Download'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { MigrationResultErr } from '@/api/migrations'
import { CURRENT_SCHEMA_VERSION } from '@/api/schemaVersion'
import { clearState } from '@/api/storage'

interface Props {
  error: MigrationResultErr
}

/**
 * Full-screen blocking overlay shown when the persisted state cannot be
 * automatically migrated to the current schema version.
 *
 * The user can either:
 *  1. Download the raw state as JSON for offline conversion later, then clear.
 *  2. Clear immediately and start with fresh seed data.
 */
export default function MigrationErrorOverlay({ error }: Props) {
  const { t } = useTranslation()

  function handleDownload() {
    const json = JSON.stringify(error.rawState, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `duk-state-v${error.storedVersion}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleClear() {
    clearState()
    window.location.reload()
  }

  const reasonKey =
    error.reason === 'downgrade'
      ? 'migration.reasonDowngrade'
      : error.reason === 'no-path'
        ? 'migration.reasonNoPath'
        : 'migration.reasonParseError'

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      <Paper elevation={8} sx={{ maxWidth: 520, width: '100%', p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
            <Typography variant="h6" fontWeight={700}>
              {t('migration.title')}
            </Typography>
          </Stack>

          {/* Version info */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              label={`${t('migration.storedVersion')}: v${error.storedVersion}`}
              color="warning"
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${t('migration.currentVersion')}: v${CURRENT_SCHEMA_VERSION}`}
              color="primary"
              size="small"
              variant="outlined"
            />
          </Stack>

          {/* Reason */}
          <Typography variant="body2" color="text.secondary">
            {t(reasonKey)}
          </Typography>

          <Divider />

          {/* Download action */}
          <Stack spacing={0.5}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              fullWidth
            >
              {t('migration.downloadCta')}
            </Button>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {t('migration.downloadHint')}
            </Typography>
          </Stack>

          {/* Clear action */}
          <Stack spacing={0.5}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleClear}
              fullWidth
            >
              {t('migration.clearCta')}
            </Button>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {t('migration.clearHint')}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
