import BiotechIcon from '@mui/icons-material/Biotech';
import BugReportIcon from '@mui/icons-material/BugReport';
import ImageIcon from '@mui/icons-material/Image';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Stack, Tooltip } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TriggerType } from '@/api/schemas';
import { useTriggerLabel } from '@/hooks/labels';

import Tag from './Tag';
interface TriggerChipsProps {
    readonly triggers: TriggerType[];
    readonly maxVisible?: number;
}
/** clinical = amber signal about the patient's condition, admin = grey process signal. */
type TriggerConfig = {
    icon: React.ReactElement;
    kind: 'clinical' | 'admin';
};
const TRIGGER_CONFIG: Record<TriggerType, TriggerConfig> = {
    HIGH_PAIN: { icon: <LocalFireDepartmentIcon fontSize="inherit" />, kind: 'clinical' },
    LOW_FUNCTION: { icon: <TrendingDownIcon fontSize="inherit" />, kind: 'clinical' },
    LOW_QOL: { icon: <SentimentDissatisfiedIcon fontSize="inherit" />, kind: 'clinical' },
    NOT_OPENED: { icon: <SmartphoneIcon fontSize="inherit" />, kind: 'admin' },
    NO_RESPONSE: { icon: <PhoneMissedIcon fontSize="inherit" />, kind: 'admin' },
    SEEK_CONTACT: { icon: <SupportAgentIcon fontSize="inherit" />, kind: 'admin' },
    INFECTION_SUSPECTED: { icon: <BugReportIcon fontSize="inherit" />, kind: 'clinical' },
    ABNORMAL_ANSWER: { icon: <ReportProblemIcon fontSize="inherit" />, kind: 'clinical' },
    LAB_PENDING: { icon: <BiotechIcon fontSize="inherit" />, kind: 'admin' },
    XRAY_PENDING: { icon: <ImageIcon fontSize="inherit" />, kind: 'admin' },
};
export default function TriggerChips({ triggers, maxVisible = 3 }: TriggerChipsProps) {
    const { t } = useTranslation();
    const getTriggerLabel = useTriggerLabel();
    if (triggers.length === 0)
        return null;
    const visible = triggers.slice(0, maxVisible);
    const overflow = triggers.length - maxVisible;
    return (<Stack sx={{ flexWrap: 'wrap', gap: 0.75 }} direction="row" role="list" aria-label={t('dashboard.triggers')}>
      {visible.map((trigger) => {
            const cfg = TRIGGER_CONFIG[trigger];
            return (<Tooltip key={trigger} title={getTriggerLabel(trigger)} arrow enterDelay={300}>
            <span role="listitem"><Tag icon={cfg.icon} label={getTriggerLabel(trigger)} variant={cfg.kind}/></span>
          </Tooltip>);
        })}
      {overflow > 0 && (<Tooltip title={triggers
                .slice(maxVisible)
                .map((tr) => getTriggerLabel(tr))
                .join(', ')} arrow>
          <span><Tag label={`+${overflow}`} variant="admin"/></span>
        </Tooltip>)}
    </Stack>);
}
