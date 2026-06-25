import ArticleIcon from '@mui/icons-material/Article'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import HealingIcon from '@mui/icons-material/Healing'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import ScienceIcon from '@mui/icons-material/Science'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import type { SvgIconProps } from '@mui/material'
import type React from 'react'
import { createElement } from 'react'

export interface JourneyIconOption {
  key: string
  label: string
  Icon: React.ComponentType<SvgIconProps>
}

export const JOURNEY_ICON_OPTIONS: JourneyIconOption[] = [
  { key: 'Assignment', label: 'Formulär', Icon: AssignmentIcon },
  { key: 'DirectionsRun', label: 'Träning', Icon: DirectionsRunIcon },
  { key: 'FitnessCenter', label: 'Styrketräning', Icon: FitnessCenterIcon },
  { key: 'Healing', label: 'Läkning', Icon: HealingIcon },
  { key: 'HourglassEmpty', label: 'Väntetid', Icon: HourglassEmptyIcon },
  { key: 'MedicalServices', label: 'Medicinsk info', Icon: MedicalServicesIcon },
  { key: 'MonitorHeart', label: 'Kontroll', Icon: MonitorHeartIcon },
  { key: 'Science', label: 'Forskning', Icon: ScienceIcon },
  { key: 'Article', label: 'Dokument', Icon: ArticleIcon },
  { key: 'Vaccines', label: 'Vaccination', Icon: VaccinesIcon },
]

const ICON_MAP = new Map(JOURNEY_ICON_OPTIONS.map((o) => [o.key, o.Icon]))

/**
 * Returns the MUI icon component for the given key.
 * Falls back to InfoOutlinedIcon when key is absent or unknown.
 */
export function getJourneyIcon(key?: string): React.ComponentType<SvgIconProps> {
  if (!key) return InfoOutlinedIcon
  return ICON_MAP.get(key) ?? InfoOutlinedIcon
}

/**
 * Stable module-level component that renders a journey icon by key.
 * Use this in JSX instead of calling getJourneyIcon() inline during render.
 */
export function JourneyIcon({ icon, ...props }: { icon?: string } & SvgIconProps) {
  return createElement(getJourneyIcon(icon), props)
}
