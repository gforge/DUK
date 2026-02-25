import React from 'react'
import {
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha'
import { useTranslation } from 'react-i18next'
import type { SortMode } from './sortCases'

type PalFilter = 'all' | 'mine' | 'created_by_me'

interface Props {
  searchRef: React.RefObject<HTMLInputElement | null>
  search: string
  onSearch: (v: string) => void
  palFilter: PalFilter
  onPalFilter: (v: PalFilter) => void
  sortMode: SortMode
  onSortMode: (v: SortMode) => void
  showWaiting: boolean
  onToggleWaiting: () => void
  waitingCount: number
  showPalFilter: boolean
  showMineFilter: boolean
}

export default function DashboardToolbar({
  searchRef,
  search,
  onSearch,
  palFilter,
  onPalFilter,
  sortMode,
  onSortMode,
  showWaiting,
  onToggleWaiting,
  waitingCount,
  showPalFilter,
  showMineFilter,
}: Props) {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" flexWrap="wrap">
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
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 240 }}
          aria-label={t('dashboard.search')}
        />

        {showPalFilter && (
          <ToggleButtonGroup
            value={palFilter}
            exclusive
            onChange={(_, v) => v && onPalFilter(v)}
            size="small"
            aria-label="patient filter"
          >
            <ToggleButton value="all" aria-label={t('dashboard.filterAll')}>
              {t('dashboard.filterAll')}
            </ToggleButton>
            {showMineFilter && (
              <ToggleButton value="mine" aria-label={t('dashboard.filterMine')}>
                {t('dashboard.filterMine')}
              </ToggleButton>
            )}
            <ToggleButton value="created_by_me" aria-label={t('dashboard.filterCreatedByMe')}>
              {t('dashboard.filterCreatedByMe')}
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        <ToggleButtonGroup
          value={sortMode}
          exclusive
          onChange={(_, v) => v && onSortMode(v as SortMode)}
          size="small"
          aria-label={t('dashboard.sortLabel')}
        >
          <Tooltip title={t('dashboard.sortTime')} arrow>
            <ToggleButton value="time" aria-label={t('dashboard.sortTime')}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              {t('dashboard.sortTime')}
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('dashboard.sortFlags')} arrow>
            <ToggleButton value="flags" aria-label={t('dashboard.sortFlags')}>
              <PriorityHighIcon fontSize="small" sx={{ mr: 0.5 }} />
              {t('dashboard.sortFlags')}
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('dashboard.sortName')} arrow>
            <ToggleButton value="name" aria-label={t('dashboard.sortName')}>
              <SortByAlphaIcon fontSize="small" sx={{ mr: 0.5 }} />
              {t('dashboard.sortName')}
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        {waitingCount > 0 && (
          <Chip
            icon={<HourglassEmptyIcon fontSize="small" />}
            label={t('dashboard.waiting', { count: waitingCount })}
            variant={showWaiting ? 'filled' : 'outlined'}
            color={showWaiting ? 'warning' : 'default'}
            onClick={onToggleWaiting}
            clickable
            size="small"
          />
        )}
      </Stack>
    </Box>
  )
}
