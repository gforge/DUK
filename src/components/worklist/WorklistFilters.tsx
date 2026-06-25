import { Chip, Stack } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CareRole, WorkCategory } from '@/api/schemas'
import { CareRoleIcon } from '@/components/common'
import { useAssignmentModeLabel, useCareRoleLabel, useWorkCategoryLabel } from '@/hooks/labels'

interface WorklistFiltersProps {
  categoryOrder: WorkCategory[]
  categoryFilter: 'ALL' | WorkCategory
  careRoleFilter: 'ALL' | Exclude<CareRole, null>
  palOnly: boolean
  claimedByMe: boolean
  myPatientsOnly: boolean
  onCategoryFilterChange: (value: 'ALL' | WorkCategory) => void
  onCareRoleFilterChange: (value: 'ALL' | Exclude<CareRole, null>) => void
  onPalOnlyToggle: () => void
  onClaimedByMeToggle: () => void
  onMyPatientsOnlyToggle: () => void
}

export default function WorklistFilters({
  categoryOrder,
  categoryFilter,
  careRoleFilter,
  palOnly,
  claimedByMe,
  myPatientsOnly,
  onCategoryFilterChange,
  onCareRoleFilterChange,
  onPalOnlyToggle,
  onClaimedByMeToggle,
  onMyPatientsOnlyToggle,
}: WorklistFiltersProps) {
  const { t } = useTranslation()
  const getWorkCategoryLabel = useWorkCategoryLabel()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssignmentModeLabel = useAssignmentModeLabel()

  return (
    <>
      <Stack direction="row" gap={0.75} mb={1} flexWrap="wrap">
        <Chip
          label={t('worklist.filterAll')}
          variant={categoryFilter === 'ALL' ? 'filled' : 'outlined'}
          color={categoryFilter === 'ALL' ? 'primary' : 'default'}
          onClick={() => onCategoryFilterChange('ALL')}
        />
        {categoryOrder.map((category) => (
          <Chip
            key={category}
            label={getWorkCategoryLabel(category)}
            variant={categoryFilter === category ? 'filled' : 'outlined'}
            color={categoryFilter === category ? 'primary' : 'default'}
            onClick={() => onCategoryFilterChange(category)}
          />
        ))}
      </Stack>

      <Stack direction="row" gap={0.75} mb={2} flexWrap="wrap">
        {(['DOCTOR', 'NURSE', 'PHYSIO'] as const).map((role) => (
          <Chip
            key={role}
            icon={<CareRoleIcon role={role} />}
            label={getCareRoleLabel(role)}
            variant={careRoleFilter === role ? 'filled' : 'outlined'}
            onClick={() => onCareRoleFilterChange(careRoleFilter === role ? 'ALL' : role)}
            sx={{
              pl: 0.5,
              '& .MuiChip-icon': {
                ml: 0.75,
                mr: 0.5,
              },
            }}
          />
        ))}
        <Chip
          label={getAssignmentModeLabel('PAL')}
          variant={palOnly ? 'filled' : 'outlined'}
          onClick={onPalOnlyToggle}
        />
        <Chip
          label={t('worklist.filterClaimedByMe')}
          variant={claimedByMe ? 'filled' : 'outlined'}
          onClick={onClaimedByMeToggle}
        />
        <Chip
          label={t('worklist.filterMyPatients')}
          variant={myPatientsOnly ? 'filled' : 'outlined'}
          onClick={onMyPatientsOnlyToggle}
        />
      </Stack>
    </>
  )
}
