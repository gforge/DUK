import type { QuestionnaireTemplate } from '../../schemas'
import { qtNumbnessInfection, qtWoundPain } from './acute'
import { qtEq5dOss } from './longterm'
import {
  qtHealthDeclaration,
  qtPreopIntake,
  qtSurgeryInterest,
  qtWaitinglistStatus,
} from './preop'
import { qtFunctionOss } from './subacute'

export const questionnaireTemplates: QuestionnaireTemplate[] = [
  qtNumbnessInfection,
  qtWoundPain,
  qtFunctionOss,
  qtEq5dOss,
  // ── Pre-operative / elective surgery pathway ──────────────────────────
  qtPreopIntake,
  qtHealthDeclaration,
  qtWaitinglistStatus,
  qtSurgeryInterest,
]
