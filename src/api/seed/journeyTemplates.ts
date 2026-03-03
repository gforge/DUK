import { jtStandard } from './journeyTemplates/jt-standard'
import { jtComplex } from './journeyTemplates/jt-complex'
import { jtProximalHumerus } from './journeyTemplates/jt-proximal-humerus'
import { jtDistalRadius } from './journeyTemplates/jt-distal-radius'
import { jtMonitoring } from './journeyTemplates/jt-monitoring'
import type { JourneyTemplate } from '../schemas'

export const journeyTemplates: JourneyTemplate[] = [
  jtStandard,
  jtComplex,
  jtProximalHumerus,
  jtDistalRadius,
  jtMonitoring,
]
