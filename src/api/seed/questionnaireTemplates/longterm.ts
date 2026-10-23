import type { QuestionnaireTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

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

const EQ5D_QUESTIONS = [
  {
    id: 'q-eq-mob',
    key: 'EQ_MOB',
    type: 'SELECT' as const,
    label: { sv: 'Rörlighet' },
    required: true,
    options: EQ5D_OPTIONS,
  },
  {
    id: 'q-eq-self',
    key: 'EQ_SELF',
    type: 'SELECT' as const,
    label: { sv: 'Egenvård' },
    required: true,
    options: EQ5D_OPTIONS,
  },
  {
    id: 'q-eq-act',
    key: 'EQ_ACT',
    type: 'SELECT' as const,
    label: { sv: 'Vanliga aktiviteter' },
    required: true,
    options: EQ5D_OPTIONS,
  },
  {
    id: 'q-eq-pain',
    key: 'EQ_PAIN',
    type: 'SELECT' as const,
    label: { sv: 'Smärta/obehag' },
    required: true,
    options: EQ5D_OPTIONS,
  },
  {
    id: 'q-eq-anx',
    key: 'EQ_ANX',
    type: 'SELECT' as const,
    label: { sv: 'Oro/nedstämdhet' },
    required: true,
    options: EQ5D_OPTIONS,
  },
  {
    id: 'q-eq-vas',
    key: 'EQ_VAS',
    type: 'SCALE' as const,
    label: { sv: 'Din hälsa idag (0=sämsta, 100=bästa möjliga)' },
    required: true,
    min: 0,
    max: 100,
  },
]

const EQ5D_SCORING = {
  outputKey: 'EQ5D.index',
  formula: 'AVERAGE' as const,
  inputKeys: ['EQ_MOB', 'EQ_SELF', 'EQ_ACT', 'EQ_PAIN', 'EQ_ANX'],
  scale: 1,
}

const FREE_TEXT = {
  id: 'q-free-text-domain',
  key: 'FREE_TEXT',
  type: 'TEXT' as const,
  label: { sv: 'Övriga kommentarer (valfri)' },
  required: false,
}

export const qtEq5dPrweShort: QuestionnaireTemplate = {
  id: 'qt-eq5d-prwe-short',
  name: '6-month / 1-year: EQ-5D & PRWE-short',
  questions: [
    ...EQ5D_QUESTIONS,
    {
      id: 'q-prwe-lt-pain',
      key: 'PRWE_PAIN',
      type: 'SCALE',
      label: { sv: 'Handledssmärta vid belastning (0=ingen, 10=värsta)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-prwe-lt-function',
      key: 'PRWE_FUNCTION',
      type: 'SCALE',
      label: { sv: 'Svårighet att använda handen i vardagen (0=ingen, 10=omöjligt)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-prwe-lt-usual',
      key: 'PRWE_USUAL',
      type: 'SCALE',
      label: { sv: 'Svårighet med vanliga aktiviteter (0=ingen, 10=omöjligt)' },
      required: true,
      min: 0,
      max: 10,
    },
    FREE_TEXT,
  ],
  scoringRules: [
    {
      outputKey: 'PRWE.total',
      formula: 'SUM',
      inputKeys: ['PRWE_PAIN', 'PRWE_FUNCTION', 'PRWE_USUAL'],
      scale: 10,
    },
    EQ5D_SCORING,
  ],
  createdAt: CREATED_AT,
}

export const qtEq5dOksShort: QuestionnaireTemplate = {
  id: 'qt-eq5d-oks-short',
  name: '6-month / 1-year: EQ-5D & OKS-short',
  questions: [
    ...EQ5D_QUESTIONS,
    {
      id: 'q-oks-lt-pain',
      key: 'OKS_PAIN',
      type: 'SCALE',
      label: { sv: 'Knäsmärta vid aktivitet (0=svår, 4=ingen)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-lt-walk',
      key: 'OKS_WALK',
      type: 'SCALE',
      label: { sv: 'Gångförmåga (0=mycket begränsad, 4=obehindrad)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-lt-stairs',
      key: 'OKS_STAIRS',
      type: 'SCALE',
      label: { sv: 'Trappor (0=omöjligt, 4=utan svårighet)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-lt-adl',
      key: 'OKS_ADL',
      type: 'SCALE',
      label: { sv: 'Dagliga aktiviteter (0=svårt, 4=utan svårighet)' },
      required: true,
      min: 0,
      max: 4,
    },
    FREE_TEXT,
  ],
  scoringRules: [
    {
      outputKey: 'OKS.total',
      formula: 'SUM',
      inputKeys: ['OKS_PAIN', 'OKS_WALK', 'OKS_STAIRS', 'OKS_ADL'],
      scale: 12,
    },
    EQ5D_SCORING,
  ],
  createdAt: CREATED_AT,
}

export const qtEq5dMoxfqShort: QuestionnaireTemplate = {
  id: 'qt-eq5d-moxfq-short',
  name: '6-month / 1-year: EQ-5D & MOXFQ-short',
  questions: [
    ...EQ5D_QUESTIONS,
    {
      id: 'q-moxfq-lt-walk',
      key: 'MOXFQ_WALK',
      type: 'SCALE',
      label: { sv: 'Svårighet att gå/stå på grund av fot eller fotled (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-moxfq-lt-pain',
      key: 'MOXFQ_PAIN',
      type: 'SCALE',
      label: { sv: 'Fot-/fotledssmärta (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-moxfq-lt-social',
      key: 'MOXFQ_SOCIAL',
      type: 'SCALE',
      label: { sv: 'Begränsning i vardag/social aktivitet (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    FREE_TEXT,
  ],
  scoringRules: [
    {
      outputKey: 'MOXFQ.total',
      formula: 'SUM',
      inputKeys: ['MOXFQ_WALK', 'MOXFQ_PAIN', 'MOXFQ_SOCIAL'],
      scale: 25,
    },
    EQ5D_SCORING,
  ],
  createdAt: CREATED_AT,
}
