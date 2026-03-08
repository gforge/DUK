import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PeopleIcon from '@mui/icons-material/People'
import RestoreIcon from '@mui/icons-material/Restore'
import { Button, Divider, Paper, Stack, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

export type ConfirmAction =
  | 'reset'
  | 'reseed-minimal'
  | 'reseed-realistic'
  | 'reseed-faker'
  | 'import'
  | null

interface Props {
  loading: boolean
  onSeedAction: (action: ConfirmAction) => void
}

export default function SeedPanel({ loading, onSeedAction }: Readonly<Props>) {
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('demoTools.resetTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('demoTools.resetDescription')}
      </Typography>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, mb: 0.5 }}>
        {t('demoTools.seedPresetsLabel')}
      </Typography>
      <Stack direction="row" flexWrap="wrap" sx={{ mb: 2, rowGap: 1.5, columnGap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={() => onSeedAction('reseed-minimal')}
          disabled={loading}
          sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'normal', textTransform: 'none' }}
        >
          {t('demoTools.reseedMinimal')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PeopleIcon />}
          onClick={() => onSeedAction('reseed-realistic')}
          disabled={loading}
          sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'normal', textTransform: 'none' }}
        >
          {t('demoTools.reseedRealistic')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => onSeedAction('reseed-faker')}
          disabled={loading}
          sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'normal', textTransform: 'none' }}
        >
          {t('demoTools.reseedFaker')}
        </Button>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {t('demoTools.clearDataLabel')}
      </Typography>
      <Button
        variant="contained"
        color="error"
        onClick={() => onSeedAction('reset')}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {t('demoTools.reset')}
      </Button>
    </Paper>
  )
}
