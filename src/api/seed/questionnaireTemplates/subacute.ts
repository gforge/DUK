import { iso, daysAgo } from '../shared'
import type { QuestionnaireTemplate } from '../../schemas'

const CREATED_AT = iso(daysAgo(100))

/** Week 4–8: Oxford Shoulder Score + pain (subacute phase). */
export const qtFunctionOss: QuestionnaireTemplate = {
  id: 'qt-function-oss',
  name: 'Function & Pain (OSS)',
  questions: [
    {
      id: 'q-oss-1',
      key: 'OSS_1',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_pain',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-2',
      key: 'OSS_2',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_washing',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-3',
      key: 'OSS_3',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_transport',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-4',
      key: 'OSS_4',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_dressing',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-5',
      key: 'OSS_5',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_shopping',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-pain-3',
      key: 'PNRS_2',
      type: 'SCALE',
      labelKey: 'questionnaire.pain_now',
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [
    {
      outputKey: 'OSS.total',
      formula: 'SUM',
      inputKeys: ['OSS_1', 'OSS_2', 'OSS_3', 'OSS_4', 'OSS_5'],
      scale: 8,
    },
  ],
  createdAt: CREATED_AT,
}
