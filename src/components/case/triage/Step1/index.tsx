import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { ContactMode } from '@/api/schemas'

import { CONTACT_MODE_UI } from './actions'

interface Props {
  selectedMode: ContactMode | null
  onSelect: (mode: ContactMode) => void
}

const CONTACT_MODES: ContactMode[] = ['DIGITAL', 'PHONE', 'VISIT', 'CLOSE']

export function Step1({ selectedMode, onSelect }: Props) {
  const { t } = useTranslation()
  const tr = (key: string) => t(key as never)

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {tr('triage.step1Title')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        {CONTACT_MODES.map((mode) => {
          const ui = CONTACT_MODE_UI[mode]
          const Icon = ui.icon
          const isSelected = selectedMode === mode

          return (
            <Card
              key={mode}
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 3,
                borderColor: isSelected ? ui.hoverBorderColor : 'divider',
                bgcolor: isSelected ? ui.bgColor : 'background.paper',
                transition:
                  'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease',
                '&:hover': {
                  boxShadow: 2,
                  borderColor: ui.hoverBorderColor,
                  bgcolor: ui.bgColor,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => onSelect(mode)}
                sx={{
                  height: '100%',
                  textAlign: 'left',
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    '&:last-child': {
                      pb: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: ui.bgColor,
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 20, color: ui.iconColor }} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ lineHeight: 1.2 }}
                      >
                        {tr(`triage.contactMode.${mode}`)}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, lineHeight: 1.35 }}
                      >
                        {tr(`triage.contactModeHelp.${mode}`)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}
