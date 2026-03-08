import UploadIcon from '@mui/icons-material/Upload'
import { Button, Paper, TextField, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  loading: boolean
  importText: string
  parseError: string
  onImportTextChange: (text: string) => void
  onImportPrepare: () => void
}

export default function ImportPanel({
  loading,
  importText,
  parseError,
  onImportTextChange,
  onImportPrepare,
}: Props) {
  const { t } = useTranslation()

  return (
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
        onChange={(e) => onImportTextChange(e.target.value)}
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
        onClick={onImportPrepare}
        disabled={loading || !importText.trim()}
        sx={{ mt: 1.5 }}
      >
        {t('demoTools.import')}
      </Button>
    </Paper>
  )
}
