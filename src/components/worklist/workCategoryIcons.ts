import EventIcon from '@mui/icons-material/Event'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PhoneIcon from '@mui/icons-material/Phone'
import type React from 'react'

import type { WorkCategory } from '@/api/schemas'

/** Icon per worklist contact type (design: Besök / Telefon / Digital). */
export const WORK_CATEGORY_ICONS: Record<WorkCategory, React.ElementType> = {
  VISIT: EventIcon,
  PHONE: PhoneIcon,
  DIGITAL: MonitorHeartIcon,
}
