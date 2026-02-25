import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSnack } from '../store/snackContext'
import * as client from '../api/client'
import SeedPanel from '../components/demo/SeedPanel'
import ExportPanel from '../components/demo/ExportPanel'
import ImportPanel from '../components/demo/ImportPanel'
import type { ConfirmAction } from '../components/demo/SeedPanel'

export default function DemoTools() {
  const { t } = useTranslation()
  const { showSnack } = useSnack()
  const [loading, setLoading] = useState(false)
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [parseError, setParseError] = useState('')

  async function handleExport() {
    setLoading(true)
    try {
      const state = await client.exportState()
      setExported(JSON.stringify(state, null, 2))
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
    const action = confirmAction
    setConfirmAction(null)
    try {
      if (action === 'reset' || action === 'reseed-minimal') {
        await client.resetAndReseed('minimal')
        showSnack(
          action === 'reset' ? t('demoTools.resetSuccess') : t('demoTools.reseedMinimalSuccess'),
          'success',
        )
      } else if (action === 'reseed-realistic') {
        await client.resetAndReseed('realistic')
        showSnack(t('demoTools.reseedRealisticSuccess'), 'success')
      } else if (action === 'reseed-faker') {
        await client.resetAndReseed('faker')
        showSnack(t('demoTools.reseedFakerSuccess'), 'success')
      } else if (action === 'import') {
        await client.importState(JSON.parse(importText))
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

      <SeedPanel loading={loading} onSeedAction={setConfirmAction} />
      <Divider sx={{ my: 2 }} />
      <ExportPanel
        loading={loading}
        exported={exported}
        onExport={handleExport}
        onCopy={handleCopyExport}
        onDownload={handleDownload}
      />
      <ImportPanel
        loading={loading}
        importText={importText}
        parseError={parseError}
        onImportTextChange={(v) => {
          setImportText(v)
          setParseError('')
        }}
        onImportPrepare={handleImportPrepare}
      />

      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmAction === 'import'
            ? t('demoTools.confirmImportTitle')
            : confirmAction === 'reseed-realistic'
              ? t('demoTools.confirmRealisticTitle')
              : confirmAction === 'reseed-faker'
                ? t('demoTools.confirmFakerTitle')
                : t('demoTools.confirmResetTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'import'
              ? t('demoTools.confirmImportText')
              : confirmAction === 'reseed-realistic'
                ? t('demoTools.confirmRealisticText')
                : confirmAction === 'reseed-faker'
                  ? t('demoTools.confirmFakerText')
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
