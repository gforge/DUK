import { iso, daysAgo } from '../shared'
import type { QuestionnaireTemplate } from '../../schemas'

const CREATED_AT = iso(daysAgo(100))

const EQ5D_OPTIONS = [
  { value: '1', label: { sv: 'Inga problem' } },
  { value: '2', label: { sv: 'Vissa problem' } },
  { value: '3', label: { sv: 'Stora problem' } },
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
      label: { sv: 'Rörlighet' },
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-self',
      key: 'EQ_SELF',
      type: 'SELECT',
      label: { sv: 'Egenvård' },
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-act',
      key: 'EQ_ACT',
      type: 'SELECT',
      label: { sv: 'Vanliga aktiviteter' },
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-pain',
      key: 'EQ_PAIN',
      type: 'SELECT',
      label: { sv: 'Smärta/obehag' },
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-anx',
      key: 'EQ_ANX',
      type: 'SELECT',
      label: { sv: 'Oro/nedstämdhet' },
      required: true,
      options: EQ5D_OPTIONS,
    },
    {
      id: 'q-eq-vas',
      key: 'EQ_VAS',
      type: 'SCALE',
      label: { sv: 'Din hälsa idag (0=sämsta, 100=bästa möjliga)' },
      required: true,
      min: 0,
      max: 100,
    },
    {
      id: 'q-oss-6',
      key: 'OSS_1',
      type: 'SCALE',
      label: { sv: 'Smärta vid aktivitet (1=ingen, 5=svår)' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-7',
      key: 'OSS_2',
      type: 'SCALE',
      label: { sv: 'Kan du tvätta dig?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-8',
      key: 'OSS_3',
      type: 'SCALE',
      label: { sv: 'Klara transporter?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-9',
      key: 'OSS_4',
      type: 'SCALE',
      label: { sv: 'Klä på dig?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-10',
      key: 'OSS_5',
      type: 'SCALE',
      label: { sv: 'Handla?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-free-text',
      key: 'FREE_TEXT',
      type: 'TEXT',
      label: { sv: 'Övriga kommentarer (valfri)' },
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
