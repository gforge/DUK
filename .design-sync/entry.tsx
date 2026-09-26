// Design-system entry for claude.ai/design (see .design-sync/NOTES.md).
// Bundled by design-sync into window.DUK: the app's shared components, the
// DukProvider context chain, MUI primitives (themed by DukProvider), and the
// icons the app uses.
import '@/i18n'

import { theme } from '@/theme'

export * from '@mui/material'
export * from './icons'
export { DukProvider } from './setup/DukProvider'

export {
  AutoWarningsBadge,
  CareRoleIcon,
  ConfirmDialog,
  DeadlineLabel,
  LanguageSwitcher,
  RoleIcon,
  RoleSwitcher,
  StatusChip,
  TabPanel,
  TriggerChips,
} from '@/components/common'
export { default as PersonalNumberCopy } from '@/components/common/PersonalNumberCopy'
export { default as AppShell } from '@/components/layout/AppShell'
export { default as GlobalSearch } from '@/components/layout/GlobalSearch'
export { default as SideNav } from '@/components/layout/SideNav'
export { default as TopBar } from '@/components/layout/TopBar'
export { theme }

