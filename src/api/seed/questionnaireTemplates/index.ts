import type { QuestionnaireTemplate } from '../../schemas'
import { qtNumbnessInfection, qtWoundPain } from './acute'
import { qtEq5dMoxfqShort, qtEq5dOksShort, qtEq5dOss, qtEq5dPrweShort } from './longterm'
import { qtHealthDeclaration, qtPreopIntake, qtSurgeryInterest, qtWaitinglistStatus } from './preop'
import { qtFunctionMoxfqShort, qtFunctionOksShort, qtFunctionOss, qtFunctionPrweShort } from './subacute'

export const questionnaireTemplates: QuestionnaireTemplate[] = [
  qtNumbnessInfection,
  qtWoundPain,
  qtFunctionOss,
  qtFunctionPrweShort,
  qtFunctionOksShort,
  qtFunctionMoxfqShort,
  qtEq5dOss,
  qtEq5dPrweShort,
  qtEq5dOksShort,
  qtEq5dMoxfqShort,
  // ── Pre-operative / elective surgery pathway ──────────────────────────
  qtPreopIntake,
  qtHealthDeclaration,
  qtWaitinglistStatus,
  qtSurgeryInterest,
]
