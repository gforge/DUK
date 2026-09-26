import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import { Box, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { AssignmentMode, CareRole, CareTeam, ContactMode, User } from '@/api/schemas'
import { CareRoleIcon, OptionButton, SegmentedControl } from '@/components/common'
import { useAssignmentModeLabel, useWhoLabel } from '@/hooks/labels'
import { tokens } from '@/theme'

import { TriageSection } from './layout'
import { eligibleUsersFor } from './useTriageDirectory'

type SpecificTab = 'NAMED' | 'TEAM'

interface Props {
  readonly contactMode: ContactMode | null
  readonly careRole: CareRole
  readonly assignmentMode: AssignmentMode
  readonly assignedUserIds: readonly string[]
  readonly assignedTeamIds: readonly string[]
  readonly users: readonly User[]
  readonly teams: readonly CareTeam[]
  readonly onModeChange: (mode: Exclude<AssignmentMode, null>) => void
  readonly onUsersChange: (ids: string[]) => void
  readonly onTeamsChange: (ids: string[]) => void
  readonly personError?: boolean
  readonly teamError?: boolean
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

/** Step 3: VSH / PAL / a specific person or group. */
export function AssigneeSection({
  contactMode,
  careRole,
  assignmentMode,
  assignedUserIds,
  assignedTeamIds,
  users,
  teams,
  onModeChange,
  onUsersChange,
  onTeamsChange,
  personError,
  teamError,
}: Props) {
  const { t } = useTranslation()
  const getWhoLabel = useWhoLabel()
  const getModeLabel = useAssignmentModeLabel()
  const [query, setQuery] = React.useState('')

  const specific = assignmentMode === 'NAMED' || assignmentMode === 'TEAM'
  const palDisabled = careRole !== 'DOCTOR'
  const eligible = React.useMemo(() => eligibleUsersFor(users, careRole), [users, careRole])
  const q = query.trim().toLowerCase()
  const visibleUsers = q ? eligible.filter((u) => u.name.toLowerCase().includes(q)) : eligible

  return (
    <TriageSection number={3} title={getWhoLabel(contactMode)} required id="triage-assignee">
      <Box
        role="radiogroup"
        aria-labelledby="triage-assignee"
        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
      >
        <Tooltip title={t('triage.assignmentModeHelp.ANY')}>
          <span>
            <OptionButton
              selected={assignmentMode === 'ANY'}
              onClick={() => onModeChange('ANY')}
              icon={<LocalHospitalIcon />}
              label={getModeLabel('ANY')}
            />
          </span>
        </Tooltip>
        <Tooltip
          title={palDisabled ? t('triage.palRequiresDoctor') : t('triage.assignmentModeHelp.PAL')}
        >
          <span>
            <OptionButton
              selected={assignmentMode === 'PAL'}
              onClick={() => onModeChange('PAL')}
              icon={<MedicalServicesIcon />}
              label={getModeLabel('PAL')}
              disabled={palDisabled}
            />
          </span>
        </Tooltip>
        <OptionButton
          selected={specific}
          onClick={() => {
            if (!specific) onModeChange('NAMED')
          }}
          icon={<PeopleIcon />}
          label={t('triage.specificOption')}
        />
      </Box>

      {specific && (
        <Stack
          sx={{
            border: `1px solid ${tokens.border}`,
            bgcolor: tokens.headerBg,
            borderRadius: '10px',
            p: 1.75,
            gap: 1.5,
          }}
        >
          <SegmentedControl<SpecificTab>
            aria-label={t('triage.specificOption')}
            value={assignmentMode as SpecificTab}
            onChange={onModeChange}
            options={[
              { value: 'NAMED', label: t('triage.specificPerson'), icon: <PersonIcon /> },
              { value: 'TEAM', label: t('triage.specificGroup'), icon: <PeopleIcon /> },
            ]}
          />

          {assignmentMode === 'NAMED' ? (
            <>
              <TextField
                size="small"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('triage.searchPerson')}
                aria-label={t('triage.searchPerson')}
                sx={{ bgcolor: tokens.paper, maxWidth: 420 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Typography
                sx={{ fontSize: 12, color: personError ? tokens.danger : tokens.textSecondary }}
              >
                {eligible.length === 0 ? t('triage.noNamedUsers') : t('triage.pickPersonsHint')}
              </Typography>
              {visibleUsers.length > 0 && (
                <Box
                  role="group"
                  aria-label={t('triage.pickPersonsHint')}
                  sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                >
                  {visibleUsers.map((u) => (
                    <OptionButton
                      key={u.id}
                      variant="chip"
                      role="checkbox"
                      selected={assignedUserIds.includes(u.id)}
                      onClick={() => onUsersChange(toggle(assignedUserIds, u.id))}
                      icon={
                        <CareRoleIcon
                          role={u.role === 'DOCTOR' || u.role === 'NURSE' ? u.role : null}
                          fontSize="inherit"
                        />
                      }
                      label={u.name}
                    />
                  ))}
                </Box>
              )}
            </>
          ) : (
            <>
              <Typography
                sx={{ fontSize: 12, color: teamError ? tokens.danger : tokens.textSecondary }}
              >
                {t('triage.assignmentModeHelp.TEAM')}
              </Typography>
              <Box
                role="group"
                aria-label={t('triage.specificGroup')}
                sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
              >
                {teams.map((team) => (
                  <OptionButton
                    key={team.id}
                    variant="chip"
                    role="checkbox"
                    selected={assignedTeamIds.includes(team.id)}
                    onClick={() => onTeamsChange(toggle(assignedTeamIds, team.id))}
                    label={team.name}
                    sub={t('triage.teamMembers', { count: team.memberUserIds.length })}
                  />
                ))}
              </Box>
            </>
          )}
        </Stack>
      )}
    </TriageSection>
  )
}
