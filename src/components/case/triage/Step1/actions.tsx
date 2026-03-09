import type { SvgIconComponent } from '@mui/icons-material'
import CallIcon from '@mui/icons-material/Call'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'

import type { ContactMode } from '@/api/schemas'

interface ContactModeUIConfig {
  icon: SvgIconComponent
  iconColor: string
  bgColor: string
  borderColor: string
  hoverBorderColor: string
}

export const CONTACT_MODE_UI = {
  DIGITAL: {
    icon: MonitorHeartIcon,
    iconColor: 'primary.main',
    bgColor: 'primary.50',
    borderColor: 'primary.100',
    hoverBorderColor: 'primary.main',
  },
  PHONE: {
    icon: CallIcon,
    iconColor: 'success.main',
    bgColor: 'success.50',
    borderColor: 'success.100',
    hoverBorderColor: 'success.main',
  },
  VISIT: {
    icon: EventIcon,
    iconColor: 'secondary.main',
    bgColor: 'secondary.50',
    borderColor: 'secondary.100',
    hoverBorderColor: 'secondary.main',
  },
  CLOSE: {
    icon: CheckCircleIcon,
    iconColor: 'grey.700',
    bgColor: 'grey.100',
    borderColor: 'grey.300',
    hoverBorderColor: 'grey.500',
  },
} satisfies Record<ContactMode, ContactModeUIConfig>
