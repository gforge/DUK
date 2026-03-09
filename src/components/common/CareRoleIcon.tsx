import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import React from 'react'

import type { CareRole } from '@/api/schemas'

type CareRoleIconRole = Exclude<CareRole, null> | 'PAL' | null | undefined

interface Props {
  role: CareRoleIconRole
  fontSize?: 'inherit' | 'small' | 'medium' | 'large'
}

/** Shared icon mapping for triage/worklist care roles. */
export default function CareRoleIcon({
  role,
  fontSize = 'small',
}: Props): React.ReactElement | null {
  if (role === 'DOCTOR' || role === 'PAL') return <MedicalServicesIcon fontSize={fontSize} />
  if (role === 'NURSE') return <VaccinesIcon fontSize={fontSize} />
  if (role === 'PHYSIO') return <AccessibilityNewIcon fontSize={fontSize} />
  return null
}
