import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import type { ResearchModule } from '../../../api/schemas'

interface Props {
  readonly module: ResearchModule
  readonly current: number
  readonly total: number
  readonly checked: boolean
  readonly onCheck: (checked: boolean) => void
  readonly onGrant: () => void
  readonly onSkip: () => void
}

export default function ConsentPhase({
  module,
  current,
  total,
  checked,
  onCheck,
  onGrant,
  onSkip,
}: Props) {
  const { t } = useTranslation()

  return (
    <>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <ScienceIcon color="secondary" />
          {t('patients.research.consentStep', { current, total })} — {module.studyName}
        </Stack>
      </DialogTitle>
      <DialogContent>
        {module.studyInfoMarkdown ? (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              borderLeft: 3,
              borderColor: 'primary.light',
              '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
              '& h2': { typography: 'subtitle1', fontWeight: 700 },
              '& h3': { typography: 'subtitle2', fontWeight: 600 },
            }}
          >
            <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>
              {t('journey.research.consent.infoLabel')}
            </Typography>
            <ReactMarkdown>{module.studyInfoMarkdown}</ReactMarkdown>
          </Box>
        ) : null}
        <Divider sx={{ my: 1.5 }} />
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => onCheck(e.target.checked)} />}
          label={<Typography variant="body2">{t('journey.research.consent.checkbox')}</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onSkip}>{t('patients.research.skipConsent')}</Button>
        <Button variant="contained" onClick={onGrant} disabled={!checked} disableElevation>
          {t('journey.research.consent.grant')}
        </Button>
      </DialogActions>
    </>
  )
}
