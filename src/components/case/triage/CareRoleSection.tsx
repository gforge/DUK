import { Box } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CareRole } from '@/api/schemas'
import { CareRoleIcon, OptionButton } from '@/components/common'
import { useCareRoleLabel } from '@/hooks/labels'

import { TriageSection } from './layout'

const CARE_ROLES: Exclude<CareRole, null>[] = ['DOCTOR', 'NURSE', 'PHYSIO']

interface Props {
  readonly value: CareRole
  readonly onChange: (role: Exclude<CareRole, null>) => void
}

/** Step 2: which competence should handle the follow-up. */
export function CareRoleSection({ value, onChange }: Props) {
  const { t } = useTranslation()
  const getLabel = useCareRoleLabel()
  return (
    <TriageSection number={2} title={t('triage.careRole')} required id="triage-care-role">
      <Box
        role="radiogroup"
        aria-labelledby="triage-care-role"
        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
      >
        {CARE_ROLES.map((role) => (
          <OptionButton
            key={role}
            selected={value === role}
            onClick={() => onChange(role)}
            icon={<CareRoleIcon role={role} fontSize="inherit" />}
            label={getLabel(role)}
          />
        ))}
      </Box>
    </TriageSection>
  )
}
