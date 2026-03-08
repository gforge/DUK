import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PolicyHelpDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('policy.syntaxTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('policy.syntaxDescription')}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack gap={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('policy.syntaxExamplesTitle')}
            </Typography>
            <Stack gap={0.75}>
              {(['syntaxExample1', 'syntaxExample2', 'syntaxExample3'] as const).map((key) => {
                const full = t(`policy.${key}`)
                const [code, ...rest] = full.split('—')
                return (
                  <Stack key={key} direction="row" gap={1} alignItems="baseline" flexWrap="wrap">
                    <Box
                      component="code"
                      sx={{
                        bgcolor: 'action.hover',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {code.trim()}
                    </Box>
                    {rest.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {rest.join('—').trim()}
                      </Typography>
                    )}
                  </Stack>
                )
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('policy.syntaxCombineTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('policy.operators')}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
