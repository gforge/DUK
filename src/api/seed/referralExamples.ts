/**
 * Referral phase examples — three patients at successive stages after an
 * incoming referral:
 *
 *   1. p-24 Hip OA:  referral registered, diagnosis not yet set (awaits uthopp
 *                    from TakeCare), no journey assigned, nothing sent.
 *   2. p-25 Knee OA: referral registered, journey assigned (forms sent 4 days
 *                    ago, not yet answered), PAL visit booked.
 *   3. p-26 Hip OA:  referral registered, forms answered, PAL visit booked.
 *
 * All dates are relative to "today" and are re-anchored by buildMinimalSeed.
 */
import type { Case, EpisodeOfCare, FormResponse, Patient, PatientJourney } from '../schemas'
import { daysAgo, daysFromNow, iso, isoDate } from './shared'

const REGISTERED_BY = 'user-sec-1'

/** Visit time on a given day, e.g. 09:30 local time. */
function at(date: Date, hours: number, minutes = 0): string {
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return iso(d)
}

export const referralPatients: Patient[] = [
  {
    id: 'p-24',
    displayName: 'Barbro Ahlström',
    personalNumber: '195808123344',
    dateOfBirth: '1958-08-12',
    palId: 'user-doc-1',
    createdAt: iso(daysAgo(0)),
  },
  {
    id: 'p-25',
    displayName: 'Rolf Nyberg',
    personalNumber: '195110275566',
    dateOfBirth: '1951-10-27',
    palId: 'user-pal-1',
    createdAt: iso(daysAgo(4)),
  },
  {
    id: 'p-26',
    displayName: 'Siv Holmgren',
    personalNumber: '194903067788',
    dateOfBirth: '1949-03-06',
    palId: 'user-pal-1',
    lastOpenedAt: iso(daysAgo(9)),
    createdAt: iso(daysAgo(12)),
  },
]

export const referralEpisodes: EpisodeOfCare[] = [
  {
    id: 'ep-ref-1',
    patientId: 'p-24',
    label: 'Remiss — höftsmärta vänster',
    clinicalArea: 'Höft',
    status: 'OPEN',
    openedAt: iso(daysAgo(0)),
    closedAt: null,
    responsibleUserId: 'user-doc-1',
    primaryCaseId: 'case-ref-1',
    referral: {
      receivedAt: iso(daysAgo(0)),
      referrer: 'Vårdcentral Täby Centrum',
      reason:
        'Tilltagande smärta vänster höft sedan 1 år, nattvärk. Röntgen visar kraftig ledspaltsminskning. Önskar bedömning för ev. protes.',
      diagnoses: [],
    },
    createdAt: iso(daysAgo(0)),
    updatedAt: iso(daysAgo(0)),
  },
  {
    id: 'ep-ref-2',
    patientId: 'p-25',
    label: 'Remiss — knäartros höger',
    clinicalArea: 'Knä',
    status: 'OPEN',
    openedAt: iso(daysAgo(4)),
    closedAt: null,
    responsibleUserId: 'user-pal-1',
    primaryCaseId: 'case-ref-2',
    referral: {
      receivedAt: iso(daysAgo(5)),
      referrer: 'Vårdcentral Danderyd',
      reason:
        'Knäartros höger, genomgått artrosskola och fysioterapi utan tillräcklig effekt. Gångsträcka < 500 m.',
      diagnoses: [{ code: 'M17.1', text: 'Primär gonartros, ensidig' }],
      diagnosisSource: 'UTHOPP',
    },
    createdAt: iso(daysAgo(4)),
    updatedAt: iso(daysAgo(4)),
  },
  {
    id: 'ep-ref-3',
    patientId: 'p-26',
    label: 'Remiss — höftartros höger',
    clinicalArea: 'Höft',
    status: 'OPEN',
    openedAt: iso(daysAgo(12)),
    closedAt: null,
    responsibleUserId: 'user-pal-1',
    primaryCaseId: 'case-ref-3',
    referral: {
      receivedAt: iso(daysAgo(13)),
      referrer: 'Capio Vårdcentral Vallentuna',
      reason:
        'Höftartros höger, uttalad rörelseinskränkning och vilovärk. Paracetamol och NSAID ger otillräcklig effekt.',
      diagnoses: [{ code: 'M16.1', text: 'Primär koxartros, ensidig' }],
      diagnosisSource: 'UTHOPP',
    },
    createdAt: iso(daysAgo(12)),
    updatedAt: iso(daysAgo(9)),
  },
]

export const referralJourneys: PatientJourney[] = [
  {
    id: 'pj-ref-2',
    episodeId: 'ep-ref-2',
    patientId: 'p-25',
    journeyTemplateId: 'jt-knee-referral',
    phaseType: 'REFERRAL',
    phaseLabel: 'Remissfas',
    joinedAt: '',
    startDate: isoDate(daysAgo(4)),
    responsiblePhysicianUserId: 'user-pal-1',
    status: 'ACTIVE',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      type: 'REFERRAL_RECEIVED',
      triggeredAt: iso(daysAgo(4)),
      triggeredByUserId: REGISTERED_BY,
    },
    createdAt: iso(daysAgo(4)),
    updatedAt: iso(daysAgo(4)),
  },
  {
    id: 'pj-ref-3',
    episodeId: 'ep-ref-3',
    patientId: 'p-26',
    journeyTemplateId: 'jt-hip-referral',
    phaseType: 'REFERRAL',
    phaseLabel: 'Remissfas',
    joinedAt: '',
    startDate: isoDate(daysAgo(12)),
    responsiblePhysicianUserId: 'user-pal-1',
    status: 'ACTIVE',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      type: 'REFERRAL_RECEIVED',
      triggeredAt: iso(daysAgo(12)),
      triggeredByUserId: REGISTERED_BY,
    },
    createdAt: iso(daysAgo(12)),
    updatedAt: iso(daysAgo(9)),
  },
]

const palVisitDecision = (dueAt: string) => ({
  contactMode: 'VISIT' as const,
  careRole: 'DOCTOR' as const,
  assignmentMode: 'PAL' as const,
  assignedUserId: null,
  dueAt,
  note: 'Nybesök hos PAL. Formulären ska vara besvarade före besöket.',
})

export const referralCases: Case[] = [
  {
    // 1. Referral registered today — awaits diagnosis (uthopp) and journey assignment
    id: 'case-ref-1',
    patientId: 'p-24',
    episodeId: 'ep-ref-1',
    category: 'SUBACUTE',
    status: 'NEW',
    triggers: [],
    policyWarnings: [],
    internalNote:
      'Ny remiss registrerad. Diagnos anges via uthopp från TakeCare, därefter tilldelas vårdförlopp (Höftartros — Remissfas) så att formulären skickas.',
    createdByUserId: REGISTERED_BY,
    scheduledAt: iso(daysAgo(0)),
    lastActivityAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(0)),
    colleagueReviews: [],
    reviews: [],
  },
  {
    // 2. Forms sent 4 days ago (not answered yet), PAL visit booked
    id: 'case-ref-2',
    patientId: 'p-25',
    episodeId: 'ep-ref-2',
    category: 'CONTROL',
    status: 'TRIAGED',
    triggers: [],
    policyWarnings: [],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: palVisitDecision(at(daysFromNow(18), 9, 30)),
    deadline: at(daysFromNow(18), 9, 30),
    internalNote: 'Remiss bedömd: nybesök PAL. Basformulär och OKS skickade, ej besvarade ännu.',
    assignedRole: 'DOCTOR',
    createdByUserId: REGISTERED_BY,
    triagedByUserId: 'user-pal-1',
    bookings: [
      {
        id: 'bk-ref-2',
        type: 'Nybesök ortoped',
        role: 'PAL',
        scheduledAt: at(daysFromNow(18), 9, 30),
        status: 'SCHEDULED',
        note: 'Bokad på PAL-mottagning inom 3 veckor från remiss.',
        createdByUserId: REGISTERED_BY,
        createdAt: iso(daysAgo(4)),
      },
    ],
    scheduledAt: iso(daysAgo(4)),
    lastActivityAt: iso(daysAgo(4)),
    createdAt: iso(daysAgo(4)),
    colleagueReviews: [],
    reviews: [],
  },
  {
    // 3. Forms answered, PAL visit booked
    id: 'case-ref-3',
    patientId: 'p-26',
    episodeId: 'ep-ref-3',
    category: 'CONTROL',
    status: 'TRIAGED',
    triggers: ['HIGH_PAIN', 'LOW_FUNCTION'],
    policyWarnings: [],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: palVisitDecision(at(daysFromNow(6), 13, 0)),
    deadline: at(daysFromNow(6), 13, 0),
    internalNote:
      'Formulär besvarade: OHS 15/48, NRS 7. Bor ensam med trappor, använder käpp/kryckor. Waran — observera inför ev. operation.',
    assignedRole: 'DOCTOR',
    createdByUserId: REGISTERED_BY,
    triagedByUserId: 'user-pal-1',
    bookings: [
      {
        id: 'bk-ref-3',
        type: 'Nybesök ortoped',
        role: 'PAL',
        scheduledAt: at(daysFromNow(6), 13, 0),
        status: 'SCHEDULED',
        createdByUserId: REGISTERED_BY,
        createdAt: iso(daysAgo(11)),
      },
    ],
    scheduledAt: iso(daysAgo(12)),
    lastActivityAt: iso(daysAgo(9)),
    createdAt: iso(daysAgo(12)),
    colleagueReviews: [],
    reviews: [],
  },
]

export const referralFormResponses: FormResponse[] = [
  {
    id: 'fr-ref-3-base',
    patientId: 'p-26',
    templateId: 'qt-preop-intake',
    caseId: 'case-ref-3',
    patientJourneyId: 'pj-ref-3',
    journeyTemplateEntryId: 'jte-hip-ref-1',
    answers: {
      HEIGHT: 160,
      WEIGHT: 68,
      PREV_SURGERY: true,
      PREV_SURGERY_DETAILS: 'Gallstensoperation 2004, grå starr vänster öga 2019',
      WALKING_AID: 'CRUTCHES',
      HOME_CARE: false,
      LIVES_ALONE: true,
      STAIRS_AT_HOME: true,
      MEDICATIONS:
        'Waran enligt ordination (förmaksflimmer), Metoprolol 50 mg x1, Paracetamol 1 g x3',
      ALLERGIES: 'Plåster (hudreaktion)',
      SMOKING: 'QUIT_OVER_6M',
      PNRS_1: 7,
    },
    scores: {},
    submittedAt: iso(daysAgo(9)),
  },
  {
    id: 'fr-ref-3-ohs',
    patientId: 'p-26',
    templateId: 'qt-function-ohs-short',
    caseId: 'case-ref-3',
    patientJourneyId: 'pj-ref-3',
    journeyTemplateEntryId: 'jte-hip-ref-2',
    answers: { OHS_PAIN: 1, OHS_WALK: 1, OHS_SOCKS: 2, OHS_NIGHT: 1, PNRS_2: 7 },
    scores: { 'OHS.total': 15 },
    submittedAt: iso(daysAgo(9)),
  },
]
