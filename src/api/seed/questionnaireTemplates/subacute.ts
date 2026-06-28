import type { QuestionnaireTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

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
      label: { sv: 'Smärta vid aktivitet (1=ingen, 5=svår)' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-2',
      key: 'OSS_2',
      type: 'SCALE',
      label: { sv: 'Kan du tvätta dig?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-3',
      key: 'OSS_3',
      type: 'SCALE',
      label: { sv: 'Klara transporter?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-4',
      key: 'OSS_4',
      type: 'SCALE',
      label: { sv: 'Klä på dig?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-oss-5',
      key: 'OSS_5',
      type: 'SCALE',
      label: { sv: 'Handla?' },
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: 'q-pain-3',
      key: 'PNRS_2',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
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

/** Wrist follow-up: short PRWE-style pain/function screen + pain NRS. */
export const qtFunctionPrweShort: QuestionnaireTemplate = {
  id: 'qt-function-prwe-short',
  name: 'Wrist Function & Pain (PRWE-short)',
  questions: [
    {
      id: 'q-prwe-pain',
      key: 'PRWE_PAIN',
      type: 'SCALE',
      label: { sv: 'Handledssmärta vid belastning (0=ingen, 10=värsta)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-prwe-function',
      key: 'PRWE_FUNCTION',
      type: 'SCALE',
      label: { sv: 'Svårighet att använda handen i vardagen (0=ingen, 10=omöjligt)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-prwe-usual',
      key: 'PRWE_USUAL',
      type: 'SCALE',
      label: { sv: 'Svårighet med vanliga aktiviteter (0=ingen, 10=omöjligt)' },
      required: true,
      min: 0,
      max: 10,
    },
    {
      id: 'q-prwe-pnrs',
      key: 'PNRS_2',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [
    {
      outputKey: 'PRWE.total',
      formula: 'SUM',
      inputKeys: ['PRWE_PAIN', 'PRWE_FUNCTION', 'PRWE_USUAL'],
      scale: 10,
    },
  ],
  createdAt: CREATED_AT,
}

/** Knee follow-up: short OKS-style function screen + pain NRS. */
export const qtFunctionOksShort: QuestionnaireTemplate = {
  id: 'qt-function-oks-short',
  name: 'Knee Function & Pain (OKS-short)',
  questions: [
    {
      id: 'q-oks-pain',
      key: 'OKS_PAIN',
      type: 'SCALE',
      label: { sv: 'Knäsmärta vid aktivitet (0=svår, 4=ingen)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-walk',
      key: 'OKS_WALK',
      type: 'SCALE',
      label: { sv: 'Gångförmåga (0=mycket begränsad, 4=obehindrad)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-stairs',
      key: 'OKS_STAIRS',
      type: 'SCALE',
      label: { sv: 'Trappor (0=omöjligt, 4=utan svårighet)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-adl',
      key: 'OKS_ADL',
      type: 'SCALE',
      label: { sv: 'Dagliga aktiviteter (0=svårt, 4=utan svårighet)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-oks-pnrs',
      key: 'PNRS_2',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [
    {
      outputKey: 'OKS.total',
      formula: 'SUM',
      inputKeys: ['OKS_PAIN', 'OKS_WALK', 'OKS_STAIRS', 'OKS_ADL'],
      scale: 12,
    },
  ],
  createdAt: CREATED_AT,
}

/** Foot/ankle follow-up: compact MOXFQ-style walking/pain/social screen + pain NRS. */
export const qtFunctionMoxfqShort: QuestionnaireTemplate = {
  id: 'qt-function-moxfq-short',
  name: 'Foot/Ankle Function & Pain (MOXFQ-short)',
  questions: [
    {
      id: 'q-moxfq-walk',
      key: 'MOXFQ_WALK',
      type: 'SCALE',
      label: { sv: 'Svårighet att gå/stå på grund av fot eller fotled (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-moxfq-pain',
      key: 'MOXFQ_PAIN',
      type: 'SCALE',
      label: { sv: 'Fot-/fotledssmärta (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-moxfq-social',
      key: 'MOXFQ_SOCIAL',
      type: 'SCALE',
      label: { sv: 'Begränsning i vardag/social aktivitet (0=ingen, 4=svår)' },
      required: true,
      min: 0,
      max: 4,
    },
    {
      id: 'q-moxfq-pnrs',
      key: 'PNRS_2',
      type: 'SCALE',
      label: { sv: 'Smärta just nu (0–10)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [
    {
      outputKey: 'MOXFQ.total',
      formula: 'SUM',
      inputKeys: ['MOXFQ_WALK', 'MOXFQ_PAIN', 'MOXFQ_SOCIAL'],
      scale: 25,
    },
  ],
  createdAt: CREATED_AT,
}
