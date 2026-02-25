import { iso, daysAgo } from '../shared'
import type { QuestionnaireTemplate } from '../../schemas'

const CREATED_AT = iso(daysAgo(100))

const EQ5D_OPTIONS = [
  { value: '1', labelKey: 'eq.level_1' },
  { value: '2', labelKey: 'eq.level_2' },
  { value: '3', labelKey: 'eq.level_3' },
]

/** 6-month / 1-year: EQ-5D quality-of-life + Oxford Shoulder Score PROMs. */
export const qtEq5dOss: QuestionnaireTemplate = {
  id: 'qt-eq5d-oss',
  name: '6-month / 1-year: EQ-5D & OSS (PROMs)',
  questions: [
    {
      id: 'q-eq-mob',
      key: 'EQ_MOB',
      type: 'SELECT',
      labelKey: 'questionnaire.eq_mobility',
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-self',
      key: 'EQ_SELF',
      type: 'SELECT',
      labelKey: 'questionnaire.eq_selfcare',
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-act',
      key: 'EQ_ACT',
      type: 'SELECT',
      labelKey: 'questionnaire.eq_usual_activity',
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-pain',
      key: 'EQ_PAIN',
      type: 'SELECT',
      labelKey: 'questionnaire.eq_pain_discomfort',
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-anx',
      key: 'EQ_ANX',
      type: 'SELECT',
      labelKey: 'questionnaire.eq_anxiety',
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-vas',
      key: 'EQ_VAS',
      type: 'SCALE',
      labelKey: 'questionnaire.eq_vas',
      required: true,
      min: 0,
      max: 100,
    },
    {
      id: 'q-oss-6',
      key: 'OSS_1',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_pain',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-7',
      key: 'OSS_2',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_washing',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-8',
      key: 'OSS_3',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_transport',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-9',
      key: 'OSS_4',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_dressing',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-10',
      key: 'OSS_5',
      type: 'SCALE',
      labelKey: 'questionnaire.oss_shopping',
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-free-text',
      key: 'FREE_TEXT',
      type: 'TEXT',
      labelKey: 'questionnaire.free_text',
      required: false,
    },
  ],
  scoringRules: [
    {
      outputKey: 'OSS.total',
      formula: 'SUM',
      inputKeys: ['OSS_1', 'OSS_2', 'OSS_3', 'OSS_4', 'OSS_5'],
      scale: 8,
    },
    {
      outputKey: 'EQ5D.index',
      formula: 'AVERAGE',
      inputKeys: ['EQ_MOB', 'EQ_SELF', 'EQ_ACT', 'EQ_PAIN', 'EQ_ANX'],
      scale: 1,
    },
  ],
  createdAt: CREATED_AT,
}
