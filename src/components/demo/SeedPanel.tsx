import React from 'react'
import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import RestoreIcon from '@mui/icons-material/Restore'
import PeopleIcon from '@mui/icons-material/People'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
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

export default function SeedPanel({ loading, onSeedAction }: Props) {
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
      <Typography sx={{ fontWeight: 600 }} variant="subtitle1" gutterBottom>
        {t('demoTools.resetTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('demoTools.resetDescription')}
      </Typography>

      <Typography
        sx={{ display: 'block', mt: 2, mb: 0.5 }}
        variant="caption"
        color="text.secondary"
      >
        {t('demoTools.seedPresetsLabel')}
      </Typography>
      <Stack sx={{ flexWrap: 'wrap', mb: 2 }} direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={() => onSeedAction('reseed-minimal')}
          disabled={loading}
        >
          {t('demoTools.reseedMinimal')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PeopleIcon />}
          onClick={() => onSeedAction('reseed-realistic')}
          disabled={loading}
        >
          {t('demoTools.reseedRealistic')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => onSeedAction('reseed-faker')}
          disabled={loading}
        >
          {t('demoTools.reseedFaker')}
        </Button>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Typography sx={{ display: 'block', mb: 0.5 }} variant="caption" color="text.secondary">
        {t('demoTools.clearDataLabel')}
      </Typography>
      <Button
        variant="contained"
        color="error"
        onClick={() => onSeedAction('reset')}
        disabled={loading}
      >
        {t('demoTools.reset')}
      </Button>
    </Paper>
  )
}
