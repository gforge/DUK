import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { SegmentOption } from '@/components/common'
import { DropdownButton, SegmentedControl } from '@/components/common'
import { tokens } from '@/theme'

import type { SortMode } from './sortCases'
import { SORT_MODES } from './sortCases'

export type PalFilter = 'all' | 'mine' | 'created_by_me'

interface Props {
  readonly searchRef: React.RefObject<HTMLInputElement | null>
  readonly search: string
  readonly onSearch: (v: string) => void
  readonly palFilter: PalFilter
  readonly onPalFilter: (v: PalFilter) => void
  readonly sortMode: SortMode
  readonly onSortMode: (v: SortMode) => void
  readonly showPalFilter: boolean
  readonly showMineFilter: boolean
  /** True when every queue section is collapsed. */
  readonly allCollapsed: boolean
  readonly onToggleAll: () => void
}

const SORT_LABEL_KEY = {
  time: 'dashboard.sortLongestWait',
  flags: 'dashboard.sortFlags',
  name: 'dashboard.sortName',
} as const satisfies Record<SortMode, string>

/** Search, patient filter and sort picker above the queue sections. */
export default function DashboardToolbar({
  searchRef,
  search,
  onSearch,
  palFilter,
  onPalFilter,
  sortMode,
  onSortMode,
  showPalFilter,
  showMineFilter,
  allCollapsed,
  onToggleAll,
}: Props) {
  const { t } = useTranslation()

  const palOptions: SegmentOption<PalFilter>[] = [
    { value: 'all', label: t('dashboard.filterAll') },
    ...(showMineFilter ? [{ value: 'mine' as const, label: t('dashboard.filterMine') }] : []),
    { value: 'created_by_me', label: t('dashboard.filterCreatedByMe') },
  ]

  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        inputRef={searchRef}
        size="small"
        placeholder={t('dashboard.search')}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: tokens.textMuted }} />
              </InputAdornment>
            ),
          },
          htmlInput: { 'aria-label': t('dashboard.search') },
        }}
        sx={{ minWidth: 240, bgcolor: tokens.paper, '& .MuiOutlinedInput-root': { height: 36 } }}
      />

      {showPalFilter && (
        <Box sx={{ display: 'flex' }}>
          <SegmentedControl
            value={palFilter}
            options={palOptions}
            onChange={onPalFilter}
            aria-label={t('common.patientFilter')}
          />
        </Box>
      )}

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          onClick={onToggleAll}
          startIcon={allCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          sx={{ fontWeight: 500 }}
        >
          {allCollapsed ? t('dashboard.expandAll') : t('dashboard.collapseAll')}
        </Button>
        <DropdownButton
          label={t('dashboard.sortPrefix')}
          value={sortMode}
          options={SORT_MODES.map((m) => ({ value: m, label: t(SORT_LABEL_KEY[m]) }))}
          onChange={onSortMode}
          aria-label={t('dashboard.sortLabel')}
        />
      </Box>
    </Stack>
  )
}
