import type { JourneyTemplate } from '../schemas'
import { jtComplex } from './journeyTemplates/jt-complex'
import { jtDistalRadius } from './journeyTemplates/jt-distal-radius'
import { jtMonitoring } from './journeyTemplates/jt-monitoring'
import { jtProximalHumerus } from './journeyTemplates/jt-proximal-humerus'
import { jtStandard } from './journeyTemplates/jt-standard'

export const journeyTemplates: JourneyTemplate[] = [
  jtStandard,
  jtComplex,
  jtProximalHumerus,
  jtDistalRadius,
  jtMonitoring,
]
