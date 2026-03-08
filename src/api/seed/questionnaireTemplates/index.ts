import type { QuestionnaireTemplate } from '../../schemas'
import { qtNumbnessInfection, qtWoundPain } from './acute'
import { qtEq5dOss } from './longterm'
import { qtFunctionOss } from './subacute'

export const questionnaireTemplates: QuestionnaireTemplate[] = [
  qtNumbnessInfection,
  qtWoundPain,
  qtFunctionOss,
  qtEq5dOss,
]
