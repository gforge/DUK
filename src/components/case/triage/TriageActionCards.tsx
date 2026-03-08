import type { SvgIconComponent } from '@mui/icons-material'
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PhoneIcon from '@mui/icons-material/Phone'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { ACTION_ORDER, type TriageActionKey } from './actionConfig'

const ACTION_ICONS: Record<TriageActionKey, SvgIconComponent> = {
  DIGITAL_CONTROL: MonitorHeartIcon,
  PHONE_CALL: PhoneIcon,
  NURSE_VISIT: MedicalServicesIcon,
  DOCTOR_VISIT: LocalHospitalIcon,
  PHYSIO_VISIT: AccessibilityNewIcon,
  CLOSE_NOW: CheckCircleOutlineIcon,
}

interface Props {
  onSelect: (action: TriageActionKey) => void
}

export default function TriageActionCards({ onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
        {t('triage.step1Title')}
      </Typography>
      <Grid container spacing={1.5}>
        {ACTION_ORDER.map((key) => {
          const Icon = ACTION_ICONS[key]
          const isClose = key === 'CLOSE_NOW'

          return (
            <Grid key={key} size={{ xs: 12, sm: 6 }}>
              <Tooltip title={t(`triage.actionTooltip.${key}`)} placement="top" arrow>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderColor: isClose ? 'action.disabledBackground' : 'divider',
                    opacity: isClose ? 0.85 : 1,
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: isClose ? 'text.secondary' : 'primary.main',
                    },
                  }}
                >
                  <CardActionArea
                    sx={{ height: '100%', p: 0 }}
                    onClick={() => onSelect(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(key)
                      }
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" gap={1.5} alignItems="flex-start">
                        <Icon
                          sx={{
                            mt: 0.25,
                            fontSize: 28,
                            color: isClose ? 'text.secondary' : 'primary.main',
                          }}
                        />
                        <Box flexGrow={1}>
                          <Typography variant="body1" fontWeight={600}>
                            {t(`triage.actionLabel.${key}`)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.25, lineHeight: 1.4 }}
                          >
                            {t(`triage.actionDesc.${key}`)}
                          </Typography>
                          <Chip
                            label={t(`triage.actionRole.${key}`)}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1, fontSize: 11 }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
