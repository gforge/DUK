import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import FilterListIcon from '@mui/icons-material/FilterList'
import PersonIcon from '@mui/icons-material/Person'
import { Stack } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { WorkCategory } from '@/api/schemas'
import type { SegmentOption } from '@/components/common'
import { DropdownButton, FilterPill, SegmentedControl } from '@/components/common'
import { useAssignmentModeLabel, useCareRoleLabel } from '@/hooks/labels'
import type { CareRoleFilter, CategoryFilter, RecipientFilter } from '@/hooks/useWorklistQueue'

import { WORK_CATEGORY_ICONS } from './workCategoryIcons'

interface WorklistFiltersProps {
  categoryOrder: WorkCategory[]
  categoryFilter: CategoryFilter
  careRoleFilter: CareRoleFilter
  recipientFilter: RecipientFilter
  assignedToMe: boolean
  myPatientsOnly: boolean
  onCategoryFilterChange: (value: CategoryFilter) => void
  onCareRoleFilterChange: (value: CareRoleFilter) => void
  onRecipientFilterChange: (value: RecipientFilter) => void
  onAssignedToMeToggle: () => void
  onMyPatientsOnlyToggle: () => void
}

export default function WorklistFilters({
  categoryOrder,
  categoryFilter,
  careRoleFilter,
  recipientFilter,
  assignedToMe,
  myPatientsOnly,
  onCategoryFilterChange,
  onCareRoleFilterChange,
  onRecipientFilterChange,
  onAssignedToMeToggle,
  onMyPatientsOnlyToggle,
}: WorklistFiltersProps) {
  const { t } = useTranslation()
  const getCareRoleLabel = useCareRoleLabel()
  const getAssignmentModeLabel = useAssignmentModeLabel()

  const shortLabels: Record<WorkCategory, string> = {
    VISIT: t('worklist.categoryShort.VISIT'),
    PHONE: t('worklist.categoryShort.PHONE'),
    DIGITAL: t('worklist.categoryShort.DIGITAL'),
  }
  const typeOptions: SegmentOption<CategoryFilter>[] = [
    { value: 'ALL', label: t('worklist.filterAll'), icon: <FilterListIcon /> },
    ...categoryOrder.map((category) => {
      const Icon = WORK_CATEGORY_ICONS[category]
      return { value: category, label: shortLabels[category], icon: <Icon /> }
    }),
  ]
  const careRoleOptions: { value: CareRoleFilter; label: string }[] = [
    { value: 'ALL', label: t('worklist.filterAll') },
    ...(['DOCTOR', 'NURSE', 'PHYSIO'] as const).map((role) => ({
      value: role,
      label: getCareRoleLabel(role),
    })),
  ]
  const recipientOptions: { value: RecipientFilter; label: string }[] = [
    { value: 'ALL', label: t('worklist.filterAll') },
    ...(['ANY', 'PAL', 'NAMED', 'TEAM'] as const).map((mode) => ({
      value: mode,
      label: getAssignmentModeLabel(mode),
    })),
  ]

  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      <SegmentedControl
        value={categoryFilter}
        options={typeOptions}
        onChange={onCategoryFilterChange}
        aria-label={t('worklist.typeFilterLabel')}
      />
      <DropdownButton
        label={t('worklist.competenceFilter')}
        value={careRoleFilter}
        options={careRoleOptions}
        onChange={onCareRoleFilterChange}
        aria-label={t('worklist.competenceFilterLabel')}
      />
      <DropdownButton
        label={t('worklist.recipientFilter')}
        value={recipientFilter}
        options={recipientOptions}
        onChange={onRecipientFilterChange}
        aria-label={t('worklist.recipientFilterLabel')}
      />
      <FilterPill
        selected={assignedToMe}
        onClick={onAssignedToMeToggle}
        label={t('worklist.filterClaimedByMe')}
        icon={<AssignmentIndIcon />}
      />
      <FilterPill
        selected={myPatientsOnly}
        onClick={onMyPatientsOnlyToggle}
        label={t('worklist.filterMyPatients')}
        icon={<PersonIcon />}
      />
    </Stack>
  )
}
