import { iso, daysAgo } from '../shared'
import type { QuestionnaireTemplate } from '../../schemas'

const CREATED_AT = iso(daysAgo(100))

/** Day 1–2 post-op: numbness and infection screening. */
export const qtNumbnessInfection: QuestionnaireTemplate = {
  id: 'qt-numbness-infection',
  name: 'Day 1-2: Numbness & Infection',
  questions: [
    {
      id: 'q-numb-1',
      key: 'NUMB_1',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.numbness_fingers',
      required: true,
    },
    {
      id: 'q-numb-2',
      key: 'NUMB_2',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.numbness_toes',
      required: true,
    },
    {
      id: 'q-inf-1',
      key: 'INF_WOUND',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.infection_wound',
      required: true,
    },
    {
      id: 'q-inf-2',
      key: 'INF_FEVER',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.infection_fever',
      required: true,
    },
    {
      id: 'q-pain-1',
      key: 'PNRS_1',
      type: 'SCALE',
      labelKey: 'questionnaire.pain_now',
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}

/** Day 10–14 post-op: wound healing and pain assessment. */
export const qtWoundPain: QuestionnaireTemplate = {
  id: 'qt-wound-pain',
  name: 'Day 10-14: Wound Status & Pain',
  questions: [
    {
      id: 'q-wound-1',
      key: 'WOUND_HEALED',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.wound_healed',
      required: true,
    },
    {
      id: 'q-wound-2',
      key: 'WOUND_DISCHARGE',
      type: 'BOOLEAN',
      labelKey: 'questionnaire.wound_discharge',
      required: false,
    },
    {
      id: 'q-pain-2',
      key: 'PNRS_2',
      type: 'SCALE',
      labelKey: 'questionnaire.pain_now',
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-pain-night',
      key: 'PNRS_NIGHT',
      type: 'SCALE',
      labelKey: 'questionnaire.pain_night',
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}
