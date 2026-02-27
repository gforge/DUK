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
      label: { sv: 'Domningar i fingrar?' },
      required: true,
    },
    {
      id: 'q-numb-2',
      key: 'NUMB_2',
      type: 'BOOLEAN',
      label: { sv: 'Domningar i tår?' },
      required: true,
    },
    {
      id: 'q-inf-1',
      key: 'INF_WOUND',
      type: 'BOOLEAN',
      label: { sv: 'Tecken på infektion vid såret?' },
      required: true,
    },
    {
      id: 'q-inf-2',
      key: 'INF_FEVER',
      type: 'BOOLEAN',
      label: { sv: 'Feber (>38°)?' },
      required: true,
    },
    {
      id: 'q-pain-1',
      key: 'PNRS_1',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
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
      label: { sv: 'Är såret läkt?' },
      required: true,
    },
    {
      id: 'q-wound-2',
      key: 'WOUND_DISCHARGE',
      type: 'BOOLEAN',
      label: { sv: 'Sekret från såret?' },
      required: false,
    },
    {
      id: 'q-pain-2',
      key: 'PNRS_2',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-pain-night',
      key: 'PNRS_NIGHT',
      type: 'SCALE',
      label: { sv: 'Värsta smärtan natten (0–10)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}
