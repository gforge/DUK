/**
 * Conservative → operative examples — two distal radius fractures that were
 * first treated in a cast and then operated after the day 7–10 X-ray showed
 * secondary displacement together with high pain:
 *
 *   1. p-27 Astrid Wallin: fracture 24 days ago, X-ray day 8 → surgery 3 days
 *      later (11 days ago). Now post-op day 11 — in the "Dag 10–14" window
 *      of the operative programme (ACUTE column).
 *   2. p-28 Håkan Nordin: fracture 41 days ago, X-ray day 9 → surgery 3 days
 *      later (29 days ago). Now post-op week 4 — "Vecka 4" window of the
 *      operative programme (SUBACUTE column), triaged to digital control.
 *
 * Each episode has two journeys: the conservative journey (COMPLETED, anchored
 * on the injury date) and the operative journey started with
 * `startNextPhase` (ACTIVE, anchored on the surgery date, trigger
 * SURGERY_COMPLETED). All dates are relative to "today" and are re-anchored by
 * buildMinimalSeed.
 */
import type { Case, EpisodeOfCare, FormResponse, Patient, PatientJourney } from '../schemas'
import { daysAgo, daysFromNow, iso, isoDate } from './shared'

const DOC = 'user-doc-1'
const PAL = 'user-pal-1'
const NURSE = 'user-nurse-1'

export const switchedPatients: Patient[] = [
  {
    id: 'p-27',
    displayName: 'Astrid Wallin',
    personalNumber: '196204153388',
    dateOfBirth: '1962-04-15',
    phone: '071-137 23 17',
    palId: DOC,
    lastOpenedAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(24)),
  },
  {
    id: 'p-28',
    displayName: 'Håkan Nordin',
    personalNumber: '195509287799',
    dateOfBirth: '1955-09-28',
    phone: '072-174 36 24',
    palId: PAL,
    lastOpenedAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(41)),
  },
]

export const switchedEpisodes: EpisodeOfCare[] = [
  {
    id: 'ep-27',
    patientId: 'p-27',
    label: 'Distala radiusfraktur vänster — gips → volar platta',
    clinicalArea: 'Hand',
    status: 'OPEN',
    openedAt: iso(daysAgo(24)),
    closedAt: null,
    responsibleUserId: DOC,
    primaryCaseId: 'case-27',
    createdAt: iso(daysAgo(24)),
    updatedAt: iso(daysAgo(0)),
  },
  {
    id: 'ep-28',
    patientId: 'p-28',
    label: 'Distala radiusfraktur höger — gips → volar platta',
    clinicalArea: 'Hand',
    status: 'OPEN',
    openedAt: iso(daysAgo(41)),
    closedAt: null,
    responsibleUserId: PAL,
    primaryCaseId: 'case-28',
    createdAt: iso(daysAgo(41)),
    updatedAt: iso(daysAgo(1)),
  },
]

export const switchedJourneys: PatientJourney[] = [
  // ── Astrid (p-27): conservative, injury 24 days ago → operated 11 days ago ──
  {
    id: 'pj-drc-27a',
    episodeId: 'ep-27',
    patientId: 'p-27',
    journeyTemplateId: 'jt-distal-radius-conservative',
    phaseType: 'FOLLOWUP',
    phaseLabel: 'Gipsbehandling',
    joinedAt: '',
    startDate: isoDate(daysAgo(24)),
    responsiblePhysicianUserId: DOC,
    status: 'COMPLETED',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      type: 'INJURY',
      triggeredAt: iso(daysAgo(24)),
      triggeredByUserId: NURSE,
      note: 'Fall i trappa — sluten distal radiusfraktur vänster, reponerad och gipsad på akuten.',
    },
    createdAt: iso(daysAgo(24)),
    updatedAt: iso(daysAgo(11)),
  },
  {
    id: 'pj-drc-27b',
    episodeId: 'ep-27',
    patientId: 'p-27',
    journeyTemplateId: 'jt-distal-radius',
    phaseType: 'POST_OP',
    phaseLabel: 'Postoperativ uppföljning',
    joinedAt: '',
    startDate: isoDate(daysAgo(11)),
    responsiblePhysicianUserId: DOC,
    status: 'ACTIVE',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      fromJourneyId: 'pj-drc-27a',
      type: 'SURGERY_COMPLETED',
      triggeredAt: iso(daysAgo(11)),
      triggeredByUserId: DOC,
      note: 'Röntgen dag 8 visade sekundär dislokation (dorsal vinkling 25°) och smärta NRS 7 — opererad med volar platta 3 dagar senare. Byter till operativt uppföljningsprogram.',
    },
    createdAt: iso(daysAgo(11)),
    updatedAt: iso(daysAgo(0)),
  },
  // ── Håkan (p-28): conservative, injury 41 days ago → operated 29 days ago ──
  {
    id: 'pj-drc-28a',
    episodeId: 'ep-28',
    patientId: 'p-28',
    journeyTemplateId: 'jt-distal-radius-conservative',
    phaseType: 'FOLLOWUP',
    phaseLabel: 'Gipsbehandling',
    joinedAt: '',
    startDate: isoDate(daysAgo(41)),
    responsiblePhysicianUserId: PAL,
    status: 'COMPLETED',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      type: 'INJURY',
      triggeredAt: iso(daysAgo(41)),
      triggeredByUserId: NURSE,
      note: 'Cykelolycka — distal radiusfraktur höger, reponerad och gipsad.',
    },
    createdAt: iso(daysAgo(41)),
    updatedAt: iso(daysAgo(29)),
  },
  {
    id: 'pj-drc-28b',
    episodeId: 'ep-28',
    patientId: 'p-28',
    journeyTemplateId: 'jt-distal-radius',
    phaseType: 'POST_OP',
    phaseLabel: 'Postoperativ uppföljning',
    joinedAt: '',
    startDate: isoDate(daysAgo(29)),
    responsiblePhysicianUserId: PAL,
    status: 'ACTIVE',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      fromJourneyId: 'pj-drc-28a',
      type: 'SURGERY_COMPLETED',
      triggeredAt: iso(daysAgo(29)),
      triggeredByUserId: PAL,
      note: 'Röntgen dag 9: sekundär dislokation (dorsal vinkling 30°, ulnar varians +4 mm), NRS 7 trots gips — volar platta 3 dagar senare. Byter till operativt uppföljningsprogram.',
    },
    createdAt: iso(daysAgo(29)),
    updatedAt: iso(daysAgo(1)),
  },
]

export const switchedCases: Case[] = [
  {
    // Astrid — post-op day 11 after a failed cast period (ACUTE column)
    id: 'case-27',
    patientId: 'p-27',
    episodeId: 'ep-27',
    category: 'ACUTE',
    status: 'NEEDS_REVIEW',
    triggers: [],
    policyWarnings: [],
    internalNote:
      'Primärt gipsbehandlad distal radiusfraktur vänster. Röntgenkontroll dag 8: dorsal vinkling 25° och smärta NRS 7/10 — opererad med volar platta dag 11 efter skadan. Nu postop dag 11: NRS 3/10, såret torrt utan sekretion. Förväntat förlopp — stygnborttagning planeras.',
    assignedRole: 'NURSE',
    createdByUserId: NURSE,
    scheduledAt: iso(daysAgo(0)),
    lastActivityAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(24)),
    colleagueReviews: [],
    reviews: [
      {
        id: 'rev-p27-xray-d8',
        type: 'XRAY',
        source: 'JOURNEY',
        journeyStepLabel: 'Dag 7–10 – röntgenkontroll (frakturläge)',
        createdAt: iso(daysAgo(16)),
        createdByUserId: NURSE,
        createdByRole: 'NURSE',
        reviewedAt: iso(daysAgo(14)),
        reviewedByUserId: DOC,
        reviewedByRole: 'DOCTOR',
        outcome: 'PROBLEM',
        note: 'Röntgen dag 8: ökad dorsal vinkling (25°) och förkortning jämfört med primärbilder — läget accepteras ej. Beslut om operation med volar platta.',
      },
    ],
  },
  {
    // Håkan — post-op week 4 after a failed cast period (SUBACUTE column), triaged
    id: 'case-28',
    patientId: 'p-28',
    episodeId: 'ep-28',
    category: 'SUBACUTE',
    status: 'TRIAGED',
    triggers: [],
    policyWarnings: [],
    nextStep: 'DIGITAL_CONTROL',
    deadline: iso(daysFromNow(14)),
    internalNote:
      'Primärt gipsbehandlad distal radiusfraktur höger. Röntgen dag 9 visade sekundär dislokation (dorsal vinkling 30°, ulnar varians +4 mm) och NRS 7/10 — volar platta 3 dagar senare. V4 postop: PRWE-short 30/100, NRS 2/10. Gott förlopp — styrketräning enligt program, digital kontroll vecka 6–8.',
    patientMessage:
      'Hej Håkan, dina svar vid 4-veckorskontrollen ser bra ut och handleden läker som förväntat efter operationen. Fortsätt träningsprogrammet. Nästa digitala uppföljning kommer om cirka två veckor.',
    assignedRole: 'NURSE',
    createdByUserId: NURSE,
    triagedByUserId: PAL,
    scheduledAt: iso(daysAgo(1)),
    lastActivityAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(41)),
    colleagueReviews: [],
    reviews: [
      {
        id: 'rev-p28-xray-d9',
        type: 'XRAY',
        source: 'JOURNEY',
        journeyStepLabel: 'Dag 7–10 – röntgenkontroll (frakturläge)',
        createdAt: iso(daysAgo(32)),
        createdByUserId: NURSE,
        createdByRole: 'NURSE',
        reviewedAt: iso(daysAgo(32)),
        reviewedByUserId: PAL,
        reviewedByRole: 'DOCTOR',
        outcome: 'PROBLEM',
        note: 'Röntgen dag 9: sekundär dislokation — dorsal vinkling 30°, ulnar varians +4 mm. Operation med volar platta planeras.',
      },
    ],
  },
]

export const switchedFormResponses: FormResponse[] = [
  // ── Astrid (p-27) — cast period ───────────────────────────────────────
  {
    id: 'fr-p27-cast-d2',
    patientId: 'p-27',
    templateId: 'qt-numbness-infection',
    caseId: 'case-27',
    patientJourneyId: 'pj-drc-27a',
    journeyTemplateEntryId: 'jte-drc-1',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 5 },
    scores: {},
    submittedAt: iso(daysAgo(22)),
  },
  {
    id: 'fr-p27-cast-d8',
    patientId: 'p-27',
    templateId: 'qt-cast-check',
    caseId: 'case-27',
    patientJourneyId: 'pj-drc-27a',
    journeyTemplateEntryId: 'jte-drc-2',
    // Pain increased 5 → 7 in the cast; cast felt tight with more swelling.
    answers: {
      CAST_TIGHT: true,
      CAST_NUMB: false,
      CAST_COLOR: false,
      CAST_SWELLING: true,
      PNRS_2: 7,
      PNRS_NIGHT: 6,
    },
    scores: {},
    submittedAt: iso(daysAgo(16)),
  },
  // ── Astrid (p-27) — post-op ───────────────────────────────────────────
  {
    id: 'fr-p27-po-d1',
    patientId: 'p-27',
    templateId: 'qt-numbness-infection',
    caseId: 'case-27',
    patientJourneyId: 'pj-drc-27b',
    journeyTemplateEntryId: 'jte-dr-1',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 4 },
    scores: {},
    submittedAt: iso(daysAgo(10)),
  },
  {
    id: 'fr-p27-po-d11',
    patientId: 'p-27',
    templateId: 'qt-wound-pain',
    caseId: 'case-27',
    patientJourneyId: 'pj-drc-27b',
    journeyTemplateEntryId: 'jte-dr-2',
    answers: { WOUND_HEALED: false, WOUND_DISCHARGE: false, PNRS_2: 3, PNRS_NIGHT: 2 },
    scores: {},
    submittedAt: iso(daysAgo(0)),
  },
  // ── Håkan (p-28) — cast period ────────────────────────────────────────
  {
    id: 'fr-p28-cast-d2',
    patientId: 'p-28',
    templateId: 'qt-numbness-infection',
    caseId: 'case-28',
    patientJourneyId: 'pj-drc-28a',
    journeyTemplateEntryId: 'jte-drc-1',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 6 },
    scores: {},
    submittedAt: iso(daysAgo(39)),
  },
  {
    id: 'fr-p28-cast-d9',
    patientId: 'p-28',
    templateId: 'qt-cast-check',
    caseId: 'case-28',
    patientJourneyId: 'pj-drc-28a',
    journeyTemplateEntryId: 'jte-drc-2',
    answers: {
      CAST_TIGHT: true,
      CAST_NUMB: true,
      CAST_COLOR: false,
      CAST_SWELLING: true,
      PNRS_2: 7,
      PNRS_NIGHT: 7,
    },
    scores: {},
    submittedAt: iso(daysAgo(32)),
  },
  // ── Håkan (p-28) — post-op ────────────────────────────────────────────
  {
    id: 'fr-p28-po-d1',
    patientId: 'p-28',
    templateId: 'qt-numbness-infection',
    caseId: 'case-28',
    patientJourneyId: 'pj-drc-28b',
    journeyTemplateEntryId: 'jte-dr-1',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 5 },
    scores: {},
    submittedAt: iso(daysAgo(28)),
  },
  {
    id: 'fr-p28-po-d12',
    patientId: 'p-28',
    templateId: 'qt-wound-pain',
    caseId: 'case-28',
    patientJourneyId: 'pj-drc-28b',
    journeyTemplateEntryId: 'jte-dr-2',
    answers: { WOUND_HEALED: true, WOUND_DISCHARGE: false, PNRS_2: 4, PNRS_NIGHT: 3 },
    scores: {},
    submittedAt: iso(daysAgo(17)),
  },
  {
    id: 'fr-p28-po-w4',
    patientId: 'p-28',
    templateId: 'qt-function-prwe-short',
    caseId: 'case-28',
    patientJourneyId: 'pj-drc-28b',
    journeyTemplateEntryId: 'jte-dr-3',
    answers: { PRWE_PAIN: 3, PRWE_FUNCTION: 3, PRWE_USUAL: 3, PNRS_2: 2 },
    scores: { 'PRWE.total': 30 },
    submittedAt: iso(daysAgo(1)),
  },
]
