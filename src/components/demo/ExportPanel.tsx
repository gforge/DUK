import React, { useRef } from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTranslation } from 'react-i18next'

interface Props {
  loading: boolean
  exported: string
  onExport: () => void
  onCopy: () => void
  onDownload: () => void
}

export default function ExportPanel({ loading, exported, onExport, onCopy, onDownload }: Props) {
  const { t } = useTranslation()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  return (
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
          onClick={onExport}
          disabled={loading}
        >
          {t('demoTools.export')}
        </Button>
        {exported && (
          <>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopy}>
              {t('demoTools.copyJson')}
            </Button>
            <Button variant="outlined" onClick={onDownload}>
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
  )
}
