import { Tooltip, SxProps, Theme } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import BadgeIcon from '@mui/icons-material/Badge'
import { useRoleLabel } from '@/hooks/labels'
import type { Role } from '@/api/schemas'

interface Props {
  readonly role: Role
  readonly showTooltip?: boolean
  readonly sx?: SxProps<Theme>
}

export function RoleIcon({ role, showTooltip = true, sx }: Props) {
  const getRoleLabel = useRoleLabel()

  const getIcon = () => {
    switch (role) {
      case 'PATIENT':
        return <PersonIcon color="action" sx={sx} />
      case 'NURSE':
        return <LocalHospitalIcon color="primary" sx={sx} />
      case 'DOCTOR':
        return <MedicalServicesIcon color="secondary" sx={sx} />
      case 'PAL':
        return <BadgeIcon color="success" sx={sx} />
    }
  }

  const icon = getIcon()

  if (!showTooltip) {
    return icon
  }

  return (
    <Tooltip title={getRoleLabel(role)}>
      <span>{icon}</span>
    </Tooltip>
  )
}
