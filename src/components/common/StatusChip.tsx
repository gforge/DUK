import type { ChipProps } from '@mui/material';
import React from 'react';

import type { CaseStatus } from '@/api/schemas';
import { useStatusLabel } from '@/hooks/labels';
import { useOptionalRole } from '@/store/roleContext';

import type { TagVariant } from './Tag';
import Tag from './Tag';
const STATUS_VARIANT: Record<CaseStatus, TagVariant> = {
    NEW: 'admin',
    NEEDS_REVIEW: 'info',
    TRIAGED: 'success',
    FOLLOWING_UP: 'selected',
    CLOSED: 'muted',
};
interface StatusChipProps {
    status: CaseStatus;
    /** Kept for API compatibility; the pill has a single size. */
    size?: ChipProps['size'];
}
export default function StatusChip({ status }: StatusChipProps) {
    const getStatusLabel = useStatusLabel();
    // role context may not exist in isolated tests
    let isPatientView = false;
    const roleCtx = useOptionalRole();
    if (roleCtx && roleCtx.currentUser.role === 'PATIENT') {
        isPatientView = true;
    }
    const label = getStatusLabel(status, isPatientView);
    return (<Tag shape="pill" variant={STATUS_VARIANT[status]} label={status === 'TRIAGED' ? `✓ ${label}` : label} aria-label={label}/>);
}
