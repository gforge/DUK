import CallIcon from '@mui/icons-material/Call';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ContactMode } from '@/api/schemas';
import { useContactModeHelpLabel, useContactModeLabel } from '@/hooks/labels';
const CONTACT_MODES: ContactMode[] = ['DIGITAL', 'PHONE', 'VISIT', 'CLOSE'];
const CONTACT_MODE_ICONS: Record<ContactMode, React.ReactNode> = {
    DIGITAL: <MonitorHeartIcon color="action" fontSize="small" />,
    PHONE: <CallIcon color="action" fontSize="small" />,
    VISIT: <EventIcon color="action" fontSize="small" />,
    CLOSE: <CheckCircleIcon color="action" fontSize="small" />,
};
interface Props {
    contactMode: ContactMode | null;
    onSelect: (mode: ContactMode) => void;
}
export default function TriageContactModeStep({ contactMode, onSelect }: Props) {
    const { t } = useTranslation();
    const getContactModeLabel = useContactModeLabel();
    const getContactModeHelpLabel = useContactModeHelpLabel();
    return (<Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
        {t('triage.step1Title')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.25, flexWrap: 'wrap' }}>
        {CONTACT_MODES.map((mode) => (<Card key={mode} variant="outlined" sx={{
                minWidth: 180,
                flex: 1,
                borderColor: contactMode === mode ? 'primary.main' : undefined,
                backgroundColor: contactMode === mode ? 'action.selected' : undefined,
            }}>
            <CardActionArea onClick={() => onSelect(mode)}>
              <CardContent>
                <Stack direction="row" sx={{ mb: 0.25, alignItems: 'center', gap: 0.75 }}>
                  {CONTACT_MODE_ICONS[mode]}
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {getContactModeLabel(mode)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {getContactModeHelpLabel(mode)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>))}
      </Stack>
    </Box>);
}
