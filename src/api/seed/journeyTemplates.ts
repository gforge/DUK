import type { JourneyTemplate } from '../schemas'
import { jtComplex } from './journeyTemplates/jt-complex'
import { jtDistalRadius } from './journeyTemplates/jt-distal-radius'
import { jtHindfootPostop } from './journeyTemplates/jt-hindfoot-postop'
import { jtHindfootReferral } from './journeyTemplates/jt-hindfoot-referral'
import { jtHindfootWaitinglist } from './journeyTemplates/jt-hindfoot-waitinglist'
import { jtKneePostop } from './journeyTemplates/jt-knee-postop'
import { jtKneeReferral } from './journeyTemplates/jt-knee-referral'
import { jtKneeSurgeryQueue } from './journeyTemplates/jt-knee-surgery-queue'
import { jtMonitoring } from './journeyTemplates/jt-monitoring'
import { jtProximalHumerus } from './journeyTemplates/jt-proximal-humerus'
import { jtStandard } from './journeyTemplates/jt-standard'

export const journeyTemplates: JourneyTemplate[] = [
  jtStandard,
  jtComplex,
  jtProximalHumerus,
  jtDistalRadius,
  jtMonitoring,
  jtKneeReferral,
  jtKneeSurgeryQueue,
  jtKneePostop,
  // ── Hindfoot elective surgery pathway (3 phases) ──────────────────────
  jtHindfootReferral,
  jtHindfootWaitinglist,
  jtHindfootPostop,
]
