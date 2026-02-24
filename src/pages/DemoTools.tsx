import React, { useRef, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import RestoreIcon from '@mui/icons-material/Restore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTranslation } from 'react-i18next'
import { useSnack } from '../store/snackContext'
import * as client from '../api/client'

type ConfirmAction = 'reset' | 'reseed' | 'import' | null

export default function DemoTools() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [loading, setLoading] = useState(false)
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [parseError, setParseError] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  async function handleExport() {
    setLoading(true)
    try {
      const state = await client.exportState()
      const json = JSON.stringify(state, null, 2)
      setExported(json)
      showSnack(t('demoTools.exportSuccess'), 'success')
    } catch {
      showSnack(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyExport() {
    if (!exported) return
    await navigator.clipboard.writeText(exported)
    showSnack(t('demoTools.copied'), 'success')
  }

  function handleDownload() {
    if (!exported) return
    const blob = new Blob([exported], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `duk-state-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImportPrepare() {
    setParseError('')
    if (!importText.trim()) {
      setParseError(t('demoTools.importEmpty'))
      return
    }
    try {
      JSON.parse(importText)
    } catch {
      setParseError(t('demoTools.importInvalidJson'))
      return
    }
    setConfirmAction('import')
  }

  async function confirmAndExecute() {
    setLoading(true)
    setConfirmAction(null)
    try {
      if (confirmAction === 'reset' || confirmAction === 'reseed') {
        await client.resetAndReseed()
        showSnack(t('demoTools.resetSuccess'), 'success')
      } else if (confirmAction === 'import') {
        const parsed = JSON.parse(importText)
        await client.importState(parsed)
        showSnack(t('demoTools.importSuccess'), 'success')
        setImportText('')
      }
    } catch (e: any) {
      showSnack(e?.message ?? t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('demoTools.title')}
      </Typography>
      <Alert severity="warning" sx={{ mb: 3 }}>
        {t('demoTools.warning')}
      </Alert>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Export */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('demoTools.exportTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('demoTools.exportDescription')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
          >
            {t('demoTools.export')}
          </Button>
          {exported && (
            <>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyExport}>
                {t('demoTools.copyJson')}
              </Button>
              <Button variant="outlined" onClick={handleDownload}>
                {t('demoTools.downloadJson')}
              </Button>
            </>
          )}
        </Stack>
        {exported && (
          <Box
            component="textarea"
            ref={textAreaRef}
            value={exported}
            readOnly
            rows={8}
            sx={{
              mt: 2,
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              resize: 'vertical',
            }}
          />
        )}
      </Paper>

      {/* Import */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('demoTools.importTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('demoTools.importDescription')}
        </Typography>
        <TextField
          multiline
          rows={6}
          fullWidth
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value)
            setParseError('')
          }}
          placeholder={t('demoTools.importPlaceholder')}
          error={!!parseError}
          helperText={parseError}
          sx={{ mt: 1.5, fontFamily: 'monospace' }}
          inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
        />
        <Button
          variant="contained"
          color="warning"
          startIcon={<UploadIcon />}
          onClick={handleImportPrepare}
          disabled={loading || !importText.trim()}
          sx={{ mt: 1.5 }}
        >
          {t('demoTools.import')}
        </Button>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Reset / Re-seed */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('demoTools.resetTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('demoTools.resetDescription')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestoreIcon />}
            onClick={() => setConfirmAction('reseed')}
            disabled={loading}
          >
            {t('demoTools.reseed')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setConfirmAction('reset')}
            disabled={loading}
          >
            {t('demoTools.reset')}
          </Button>
        </Stack>
      </Paper>

      {/* Confirm dialog */}
      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmAction === 'import'
            ? t('demoTools.confirmImportTitle')
            : t('demoTools.confirmResetTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'import'
              ? t('demoTools.confirmImportText')
              : t('demoTools.confirmResetText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color={confirmAction === 'import' ? 'warning' : 'error'}
            onClick={confirmAndExecute}
            autoFocus
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
