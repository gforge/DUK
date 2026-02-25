import { qtNumbnessInfection, qtWoundPain } from './acute'
import { qtFunctionOss } from './subacute'
import { qtEq5dOss } from './longterm'
import type { QuestionnaireTemplate } from '../../schemas'

export const questionnaireTemplates: QuestionnaireTemplate[] = [
  qtNumbnessInfection,
  qtWoundPain,
  qtFunctionOss,
  qtEq5dOss,
]
