/**
 * Pathway demo patients (p-33 … p-41).
 *
 * IDs start after the referral and conservative→operative examples (p-24 … p-28, case-27, case-28).
 *
 * Each patient exercises a triage/booking pathway that the original seed does
 * not cover, so every branch is visible on the dashboard, worklist and
 * completed history right after a reseed:
 *
 * | Patient | Case    | Status       | Pathway                                        |
 * | ------- | ------- | ------------ | ---------------------------------------------- |
 * | p-33    | case-35 | TRIAGED      | Visit · doctor · any    · radiograph first     |
 * | p-34    | case-36 | TRIAGED      | Visit · doctor · PAL    · radiograph first     |
 * | p-35    | case-37 | FOLLOWING_UP | Visit · nurse  · named  · booked (monitoring)  |
 * | p-36    | case-38 | TRIAGED      | Phone · nurse  · any    · overdue              |
 * | p-37    | case-39 | FOLLOWING_UP | Phone · doctor · PAL    · booked call          |
 * | p-38    | case-40 | CLOSED       | Radiograph (Danderyd) + visit booked           |
 * | p-39    | case-41 | CLOSED       | Radiograph elsewhere (Norrtälje) + visit booked|
 * | p-40    | case-42 | CLOSED       | Closed directly at triage                      |
 * | p-41    | case-43 | NEEDS_REVIEW | Suspected infection, uncertain lab             |
 */
import type {
  AuditEvent,
  Case,
  EpisodeOfCare,
  FormResponse,
  Patient,
  PatientJourney,
} from '../schemas'
import { daysAgo, daysFromNow, iso, isoDate } from './shared'

/** Timestamp `days` from today (negative = past) at a clinic-hour time of day. */
function at(days: number, hours: number, minutes = 0): string {
  const d = days >= 0 ? daysFromNow(days) : daysAgo(-days)
  d.setHours(hours, minutes, 0, 0)
  return iso(d)
}

const SECRETARY_ID = 'user-sec-1'

type Booking = NonNullable<Case['bookings']>[number]

function booking(b: Partial<Booking> & Pick<Booking, 'id' | 'type' | 'scheduledAt'>): Booking {
  return {
    status: 'SCHEDULED',
    completedAt: null,
    completedByUserId: null,
    followUpDate: null,
    completionComment: null,
    createdByUserId: SECRETARY_ID,
    createdAt: b.scheduledAt,
    ...b,
  }
}

// ── Patients ────────────────────────────────────────────────────────────────

export const pathwayPatients: Patient[] = [
  {
    id: 'p-33',
    displayName: 'Sofia Nyström',
    personalNumber: '197605142384',
    dateOfBirth: '1976-05-14',
    palId: 'user-doc-1',
    lastOpenedAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(28)),
  },
  {
    id: 'p-34',
    displayName: 'Bengt Åkesson',
    personalNumber: '194811023319',
    dateOfBirth: '1948-11-02',
    palId: 'user-pal-1',
    lastOpenedAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(12)),
  },
  {
    id: 'p-35',
    displayName: 'Fatima Haddad',
    personalNumber: '198507304426',
    dateOfBirth: '1985-07-30',
    palId: 'user-pal-1',
    lastOpenedAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(11)),
  },
  {
    id: 'p-36',
    displayName: 'Mikael Öberg',
    personalNumber: '196901195537',
    dateOfBirth: '1969-01-19',
    palId: 'user-doc-1',
    lastOpenedAt: iso(daysAgo(3)),
    createdAt: iso(daysAgo(30)),
  },
  {
    id: 'p-37',
    displayName: 'Anneli Forsberg',
    personalNumber: '195809086648',
    dateOfBirth: '1958-09-08',
    palId: 'user-doc-1',
    lastOpenedAt: iso(daysAgo(2)),
    createdAt: iso(daysAgo(50)),
  },
  {
    id: 'p-38',
    displayName: 'Ulla Sjöberg',
    personalNumber: '195003217760',
    dateOfBirth: '1950-03-21',
    palId: 'user-pal-1',
    lastOpenedAt: iso(daysAgo(2)),
    createdAt: iso(daysAgo(45)),
  },
  {
    id: 'p-39',
    displayName: 'Kjell Lundgren',
    personalNumber: '195312128871',
    dateOfBirth: '1953-12-12',
    palId: 'user-doc-1',
    lastOpenedAt: iso(daysAgo(3)),
    createdAt: iso(daysAgo(180)),
  },
  {
    id: 'p-40',
    displayName: 'Ingela Wikström',
    personalNumber: '196406029982',
    dateOfBirth: '1964-06-02',
    palId: 'user-pal-1',
    lastOpenedAt: iso(daysAgo(5)),
    createdAt: iso(daysAgo(182)),
  },
  {
    id: 'p-41',
    displayName: 'Nils Hedlund',
    personalNumber: '197210041095',
    dateOfBirth: '1972-10-04',
    palId: 'user-doc-1',
    lastOpenedAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(4)),
  },
]

// ── Episodes + journeys ─────────────────────────────────────────────────────

interface EpisodeSpec {
  patientId: string
  caseId: string
  suffix: string
  label: string
  clinicalArea: string
  journeyTemplateId: string
  startDaysAgo: number
  responsibleUserId: string
  closed?: boolean
}

const episodeSpecs: EpisodeSpec[] = [
  {
    patientId: 'p-33',
    caseId: 'case-35',
    suffix: '33',
    label: 'Distal radiusfraktur vänster — gipsbehandlad',
    clinicalArea: 'Hand',
    journeyTemplateId: 'jt-distal-radius',
    startDaysAgo: 28,
    responsibleUserId: 'user-doc-1',
  },
  {
    patientId: 'p-34',
    caseId: 'case-36',
    suffix: '34',
    label: 'Proximal humerusfraktur höger — icke-operativ',
    clinicalArea: 'Skuldra',
    journeyTemplateId: 'jt-proximal-humerus',
    startDaysAgo: 12,
    responsibleUserId: 'user-pal-1',
  },
  {
    patientId: 'p-35',
    caseId: 'case-37',
    suffix: '35',
    label: 'Bimalleolär fotledsfraktur höger — opererad',
    clinicalArea: 'Fot & Fotled',
    journeyTemplateId: 'jt-standard',
    startDaysAgo: 11,
    responsibleUserId: 'user-pal-1',
  },
  {
    patientId: 'p-36',
    caseId: 'case-38',
    suffix: '36',
    label: 'Tibiaplatåfraktur vänster — opererad',
    clinicalArea: 'Knä',
    journeyTemplateId: 'jt-complex',
    startDaysAgo: 30,
    responsibleUserId: 'user-doc-1',
  },
  {
    patientId: 'p-37',
    caseId: 'case-39',
    suffix: '37',
    label: 'Lateral malleolfraktur vänster — opererad',
    clinicalArea: 'Fot & Fotled',
    journeyTemplateId: 'jt-standard',
    startDaysAgo: 50,
    responsibleUserId: 'user-doc-1',
  },
  {
    patientId: 'p-38',
    caseId: 'case-40',
    suffix: '38',
    label: 'Distal radiusfraktur höger — opererad (volar platta)',
    clinicalArea: 'Hand',
    journeyTemplateId: 'jt-distal-radius',
    startDaysAgo: 45,
    responsibleUserId: 'user-pal-1',
  },
  {
    patientId: 'p-39',
    caseId: 'case-41',
    suffix: '39',
    label: 'Proximal humerusfraktur vänster — opererad (platta)',
    clinicalArea: 'Skuldra',
    journeyTemplateId: 'jt-proximal-humerus',
    startDaysAgo: 180,
    responsibleUserId: 'user-doc-1',
  },
  {
    patientId: 'p-40',
    caseId: 'case-42',
    suffix: '40',
    label: 'Weber B fotledsfraktur höger — opererad',
    clinicalArea: 'Fot & Fotled',
    journeyTemplateId: 'jt-standard',
    startDaysAgo: 182,
    responsibleUserId: 'user-pal-1',
  },
  {
    patientId: 'p-41',
    caseId: 'case-43',
    suffix: '41',
    label: 'Pilonfraktur höger — opererad',
    clinicalArea: 'Fot & Fotled',
    journeyTemplateId: 'jt-complex',
    startDaysAgo: 4,
    responsibleUserId: 'user-doc-1',
  },
]

export const pathwayEpisodes: EpisodeOfCare[] = episodeSpecs.map((s) => ({
  id: `ep-${s.suffix}`,
  patientId: s.patientId,
  label: s.label,
  clinicalArea: s.clinicalArea,
  status: 'OPEN',
  openedAt: iso(daysAgo(s.startDaysAgo)),
  closedAt: null,
  responsibleUserId: s.responsibleUserId,
  primaryCaseId: s.caseId,
  createdAt: iso(daysAgo(s.startDaysAgo)),
  updatedAt: iso(daysAgo(1)),
}))

export const pathwayJourneys: PatientJourney[] = episodeSpecs.map((s) => ({
  id: `pj-${s.suffix}`,
  episodeId: `ep-${s.suffix}`,
  patientId: s.patientId,
  journeyTemplateId: s.journeyTemplateId,
  phaseType: 'FOLLOWUP',
  joinedAt: '',
  startDate: isoDate(daysAgo(s.startDaysAgo)),
  status: 'ACTIVE',
  researchModuleIds: [],
  modifications: [],
  recurringCompletions: [],
  pausedAt: null,
  totalPausedDays: 0,
  createdAt: iso(daysAgo(s.startDaysAgo)),
  updatedAt: iso(daysAgo(1)),
}))

// ── Cases ───────────────────────────────────────────────────────────────────

export const pathwayCases: Case[] = [
  {
    // Radiograph in cast before the doctor decides on cast removal.
    id: 'case-35',
    patientId: 'p-33',
    episodeId: 'ep-33',
    category: 'SUBACUTE',
    status: 'TRIAGED',
    triggers: ['ABNORMAL_ANSWER'],
    policyWarnings: [],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: {
      contactMode: 'VISIT',
      careRole: 'DOCTOR',
      assignmentMode: 'ANY',
      assignedUserId: null,
      dueAt: iso(daysFromNow(5)),
      note: 'Röntgen i gips före besök — bedöm sekundär dislokation innan gipset tas av.',
      xrayBeforeVisit: true,
    },
    assignedRole: 'DOCTOR',
    deadline: iso(daysFromNow(5)),
    internalNote:
      'V4: NRS 4/10 men patienten beskriver en ny "knöl" dorsalt över handleden och att gipset känns löst. Risk för sekundär dislokation. Röntgen i gips följt av läkarbesök inför gipsavtagning.',
    patientMessage:
      'Hej Sofia, vi vill röntga handleden innan gipset tas av. Du blir kallad till röntgen och sedan till läkarbesök samma dag.',
    createdByUserId: 'user-nurse-1',
    triagedByUserId: 'user-doc-1',
    scheduledAt: iso(daysAgo(6)),
    lastActivityAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(28)),
    colleagueReviews: [],
    reviews: [
      {
        id: 'rev-p33-xray',
        type: 'XRAY',
        source: 'JOURNEY',
        journeyStepLabel: 'Dag 10–14 – stygnborttagning',
        createdAt: iso(daysAgo(17)),
        createdByUserId: 'user-nurse-1',
        createdByRole: 'NURSE',
        reviewedAt: iso(daysAgo(16)),
        reviewedByUserId: 'user-doc-1',
        reviewedByRole: 'DOCTOR',
        outcome: 'OK',
        note: 'Röntgen dag 14 i gips: acceptabelt läge, dorsal vinkling 5°.',
      },
    ],
  },
  {
    // PAL wants to see the patient personally with fresh radiographs.
    id: 'case-36',
    patientId: 'p-34',
    episodeId: 'ep-34',
    category: 'ACUTE',
    status: 'TRIAGED',
    triggers: ['HIGH_PAIN'],
    policyWarnings: [
      {
        ruleId: 'rule-1',
        ruleName: 'Smärta minskar inte',
        severity: 'HIGH',
        triggeredValues: { PNRS_1: 6, PNRS_2: 7 },
        expression: 'PNRS_1 - PNRS_2 <= 0',
      },
    ],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: {
      contactMode: 'VISIT',
      careRole: 'DOCTOR',
      assignmentMode: 'PAL',
      assignedUserId: null,
      dueAt: iso(daysFromNow(2)),
      note: 'Ny röntgen axel (frontal + Y-projektion) före PAL-besök.',
      xrayBeforeVisit: true,
    },
    assignedRole: 'DOCTOR',
    deadline: iso(daysFromNow(2)),
    internalNote:
      'Dag 12: smärtan ökar (NRS 6→7/10) och patienten känner "knäppningar" i axeln. Misstänkt sekundär dislokation av tuberculum majus. PAL vill själv bedöma med färska bilder.',
    patientMessage:
      'Hej Bengt, vi vill ta en ny röntgenbild av axeln och att du träffar din läkare inom två dagar. Mottagningen ringer dig med tider.',
    createdByUserId: 'user-nurse-2',
    triagedByUserId: 'user-pal-1',
    scheduledAt: iso(daysAgo(5)),
    lastActivityAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(12)),
    colleagueReviews: [],
    reviews: [],
  },
  {
    // Named nurse already has a booked slot → shows under "monitoring" for others.
    id: 'case-37',
    patientId: 'p-35',
    episodeId: 'ep-35',
    category: 'ACUTE',
    status: 'FOLLOWING_UP',
    triggers: ['ABNORMAL_ANSWER'],
    policyWarnings: [],
    nextStep: 'NURSE_VISIT',
    triageDecision: {
      contactMode: 'VISIT',
      careRole: 'NURSE',
      assignmentMode: 'NAMED',
      assignedUserId: 'user-nurse-2',
      dueAt: iso(daysFromNow(2)),
      note: 'Stygntagning och sårkontroll — Jonas har sett såret tidigare.',
    },
    assignedRole: 'NURSE',
    assignedUserId: 'user-nurse-2',
    deadline: iso(daysFromNow(2)),
    internalNote:
      'Dag 11: lätt rodnad kring distala delen av laterala snittet, ingen feber, ingen sekretion. Stygntagning och sårkontroll hos samma sjuksköterska som vid dag 3.',
    patientMessage:
      'Hej Fatima, du har en tid för stygntagning och sårkontroll. Kontakta oss direkt om rodnaden sprider sig eller om du får feber.',
    createdByUserId: 'user-nurse-1',
    triagedByUserId: 'user-pal-1',
    scheduledAt: iso(daysAgo(4)),
    lastActivityAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(11)),
    bookings: [
      booking({
        id: 'bk-p35-nurse',
        type: 'NURSE_VISIT',
        role: 'NURSE',
        scheduledAt: at(2, 10, 15),
        note: 'Stygntagning + sårkontroll, 30 min',
        createdAt: at(-1, 14, 5),
      }),
    ],
    colleagueReviews: [],
    reviews: [],
  },
  {
    // Overdue phone call — deadline passed yesterday.
    id: 'case-38',
    patientId: 'p-36',
    episodeId: 'ep-36',
    category: 'SUBACUTE',
    status: 'TRIAGED',
    triggers: ['SEEK_CONTACT'],
    policyWarnings: [],
    nextStep: 'PHONE_CALL',
    triageDecision: {
      contactMode: 'PHONE',
      careRole: 'NURSE',
      assignmentMode: 'ANY',
      assignedUserId: null,
      dueAt: iso(daysAgo(1)),
      note: 'Frågor om belastning och avslutad trombosprofylax.',
    },
    assignedRole: 'NURSE',
    deadline: iso(daysAgo(1)),
    internalNote:
      'Patienten har skickat meddelande: osäker på om han får börja belasta, och Fragmin-sprutorna tog slut i förrgår. Enligt op-anteckning avlastning 6 veckor. Ring och förtydliga.',
    patientMessage:
      'Hej Mikael, en sjuksköterska ringer dig för att gå igenom belastning och trombosprofylax.',
    createdByUserId: 'user-nurse-1',
    triagedByUserId: 'user-doc-1',
    scheduledAt: iso(daysAgo(6)),
    lastActivityAt: iso(daysAgo(3)),
    createdAt: iso(daysAgo(30)),
    colleagueReviews: [],
    reviews: [],
  },
  {
    // PAL phone call booked to discuss CT findings.
    id: 'case-39',
    patientId: 'p-37',
    episodeId: 'ep-37',
    category: 'SUBACUTE',
    status: 'FOLLOWING_UP',
    triggers: ['HIGH_PAIN'],
    policyWarnings: [],
    nextStep: 'PHONE_CALL',
    triageDecision: {
      contactMode: 'PHONE',
      careRole: 'DOCTOR',
      assignmentMode: 'PAL',
      assignedUserId: null,
      dueAt: iso(daysFromNow(1)),
      note: 'PAL ringer om DT-svar och eventuell plattextraktion.',
    },
    assignedRole: 'DOCTOR',
    deadline: iso(daysFromNow(1)),
    internalNote:
      'V7 efter op: kvarstående smärta över laterala malleolen vid gång. DT visar pågående läkning men oklar konsolidering av fibula. PAL ringer för att diskutera fynd och fortsatt plan.',
    createdByUserId: 'user-nurse-2',
    triagedByUserId: 'user-doc-1',
    scheduledAt: iso(daysAgo(3)),
    lastActivityAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(50)),
    bookings: [
      booking({
        id: 'bk-p37-phone',
        type: 'PHONE_CALL',
        role: 'PAL',
        scheduledAt: at(1, 13, 30),
        note: 'Telefontid PAL — DT-svar',
        createdAt: at(-1, 9, 40),
      }),
    ],
    colleagueReviews: [],
    reviews: [
      {
        id: 'rev-p37-ct',
        type: 'XRAY',
        source: 'MANUAL',
        createdAt: iso(daysAgo(6)),
        createdByUserId: 'user-doc-1',
        createdByRole: 'DOCTOR',
        reviewedAt: iso(daysAgo(2)),
        reviewedByUserId: 'user-doc-1',
        reviewedByRole: 'DOCTOR',
        outcome: 'UNCERTAIN',
        note: 'DT fotled: läkning pågår, frakturspalt fibula delvis synlig. Implantat i gott läge.',
      },
    ],
  },
  {
    // Completed booking: radiograph at Danderyd (default) + doctor visit.
    id: 'case-40',
    patientId: 'p-38',
    episodeId: 'ep-38',
    category: 'SUBACUTE',
    status: 'CLOSED',
    triggers: [],
    policyWarnings: [],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: {
      contactMode: 'VISIT',
      careRole: 'DOCTOR',
      assignmentMode: 'ANY',
      assignedUserId: null,
      dueAt: iso(daysFromNow(7)),
      note: 'Röntgenkontroll v7 före läkarbesök — ställningstagande till full belastning.',
      xrayBeforeVisit: true,
    },
    assignedRole: 'DOCTOR',
    deadline: iso(daysFromNow(7)),
    internalNote:
      'V6: OSS 30/48, NRS 3/10. Förväntat förlopp. Röntgen för att bekräfta läkning innan full belastning och start av styrketräning.',
    patientMessage:
      'Hej Ulla, du får en tid för röntgen och direkt efteråt ett läkarbesök. Kallelse kommer per post.',
    createdByUserId: 'user-nurse-1',
    triagedByUserId: 'user-pal-1',
    scheduledAt: iso(daysAgo(45)),
    lastActivityAt: at(-1, 10, 20),
    closedAt: at(-1, 10, 20),
    createdAt: iso(daysAgo(45)),
    bookings: [
      booking({
        id: 'bk-p38-visit',
        type: 'DOCTOR_VISIT',
        role: 'DOCTOR',
        scheduledAt: at(6, 9, 30),
        status: 'COMPLETED',
        completedAt: at(-1, 10, 20),
        completedByUserId: SECRETARY_ID,
        followUpDate: at(6, 9, 30),
        completionComment: 'Röntgen bokad i RIS 08:45, patienten informerad per telefon.',
        createdAt: at(-3, 15, 10),
      }),
      booking({
        id: 'bk-p38-xray',
        type: 'XRAY',
        scheduledAt: at(6, 8, 45),
        location: 'Danderyd',
        createdAt: at(-1, 10, 20),
      }),
    ],
    colleagueReviews: [],
    reviews: [],
  },
  {
    // Completed booking: radiograph at another hospital (patient lives far away).
    id: 'case-41',
    patientId: 'p-39',
    episodeId: 'ep-39',
    category: 'CONTROL',
    status: 'CLOSED',
    triggers: ['LOW_FUNCTION'],
    policyWarnings: [
      {
        ruleId: 'rule-2',
        ruleName: 'Låg funktion (OSS)',
        severity: 'MEDIUM',
        triggeredValues: { 'OSS.total': 27 },
        expression: 'OSS.total < 30',
      },
    ],
    nextStep: 'DOCTOR_VISIT',
    triageDecision: {
      contactMode: 'VISIT',
      careRole: 'DOCTOR',
      assignmentMode: 'PAL',
      assignedUserId: null,
      dueAt: iso(daysFromNow(14)),
      note: 'Röntgen före PAL-besök — misstänkt skruvgenombrott / avaskulär nekros.',
      xrayBeforeVisit: true,
    },
    assignedRole: 'DOCTOR',
    deadline: iso(daysFromNow(14)),
    internalNote:
      '6-månaders kontroll: OSS 27/48, EQ-5D 0.61. Ny värk i axeln senaste månaden. Behöver röntgen för att utesluta skruvgenombrott eller humerushuvudnekros.',
    patientMessage:
      'Hej Kjell, vi vill röntga axeln och sedan träffa dig på mottagningen. Röntgen kan göras på Norrtälje sjukhus så du slipper resa två gånger.',
    createdByUserId: 'user-doc-1',
    triagedByUserId: 'user-doc-1',
    scheduledAt: iso(daysAgo(180)),
    lastActivityAt: at(-2, 11, 5),
    closedAt: at(-2, 11, 5),
    createdAt: iso(daysAgo(180)),
    bookings: [
      booking({
        id: 'bk-p39-visit',
        type: 'DOCTOR_VISIT',
        role: 'PAL',
        scheduledAt: at(9, 14, 0),
        status: 'COMPLETED',
        completedAt: at(-2, 11, 5),
        completedByUserId: SECRETARY_ID,
        followUpDate: at(9, 14, 0),
        completionComment:
          'Röntgen på Norrtälje sjukhus på förmiddagen, bilder skickas digitalt till oss.',
        createdAt: at(-4, 8, 30),
      }),
      booking({
        id: 'bk-p39-xray',
        type: 'XRAY',
        scheduledAt: at(9, 10, 30),
        location: 'Norrtälje sjukhus',
        createdAt: at(-2, 11, 5),
      }),
    ],
    colleagueReviews: [],
    reviews: [],
  },
  {
    // Closed straight from triage — nothing further needed.
    id: 'case-42',
    patientId: 'p-40',
    episodeId: 'ep-40',
    category: 'CONTROL',
    status: 'CLOSED',
    triggers: [],
    policyWarnings: [],
    nextStep: 'NO_ACTION',
    triageDecision: {
      contactMode: 'CLOSE',
      careRole: null,
      assignmentMode: null,
      assignedUserId: null,
      dueAt: null,
      note: 'Utmärkt resultat — ingen åtgärd.',
    },
    internalNote:
      '6-månaders kontroll: OSS 44/48, EQ-5D 0.94, smärtfri. Tillbaka i arbete och på gym. Avslutas utan åtgärd; 1-årsformulär skickas automatiskt.',
    patientMessage:
      'Hej Ingela, dina svar visar ett mycket bra resultat. Ingen ytterligare kontakt behövs nu — du får ett sista formulär om ett halvår.',
    createdByUserId: 'user-pal-1',
    triagedByUserId: 'user-pal-1',
    scheduledAt: iso(daysAgo(182)),
    lastActivityAt: at(-4, 16, 0),
    closedAt: at(-4, 16, 0),
    createdAt: iso(daysAgo(182)),
    colleagueReviews: [],
    reviews: [],
  },
  {
    // Suspected early wound infection; lab reviewed but inconclusive.
    id: 'case-43',
    patientId: 'p-41',
    episodeId: 'ep-41',
    category: 'ACUTE',
    status: 'NEEDS_REVIEW',
    triggers: ['INFECTION_SUSPECTED', 'HIGH_PAIN'],
    policyWarnings: [],
    internalNote:
      'Dag 4: rodnad och värmeökning kring medialt snitt, temp 38,2 i går kväll. CRP 48, LPK 11,2 — svårvärderat så tidigt postoperativt. Bedöm behov av sårinspektion och odling.',
    assignedRole: 'DOCTOR',
    createdByUserId: 'user-nurse-2',
    scheduledAt: iso(daysAgo(4)),
    lastActivityAt: iso(daysAgo(0)),
    createdAt: iso(daysAgo(4)),
    colleagueReviews: [],
    reviews: [
      {
        id: 'rev-p41-lab',
        type: 'LAB',
        source: 'MANUAL',
        createdAt: iso(daysAgo(1)),
        createdByUserId: 'user-nurse-2',
        createdByRole: 'NURSE',
        reviewedAt: iso(daysAgo(0)),
        reviewedByUserId: 'user-doc-1',
        reviewedByRole: 'DOCTOR',
        outcome: 'UNCERTAIN',
        note: 'CRP 48, LPK 11,2. Kan vara postoperativt men följ upp klinisk bild.',
      },
    ],
  },
]

// ── Form responses ──────────────────────────────────────────────────────────

export const pathwayFormResponses: FormResponse[] = [
  {
    id: 'fr-p33-w4',
    patientId: 'p-33',
    templateId: 'qt-function-oss',
    caseId: 'case-35',
    patientJourneyId: 'pj-33',
    answers: { OSS_1: 3, OSS_2: 3, OSS_3: 4, OSS_4: 3, OSS_5: 3, PNRS_2: 4 },
    scores: { 'OSS.total': 32 },
    submittedAt: iso(daysAgo(2)),
  },
  {
    id: 'fr-p34-d1',
    patientId: 'p-34',
    templateId: 'qt-numbness-infection',
    caseId: 'case-36',
    patientJourneyId: 'pj-34',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 6 },
    scores: {},
    submittedAt: iso(daysAgo(11)),
  },
  {
    id: 'fr-p34-d10',
    patientId: 'p-34',
    templateId: 'qt-wound-pain',
    caseId: 'case-36',
    patientJourneyId: 'pj-34',
    answers: { WOUND_HEALED: true, WOUND_DISCHARGE: false, PNRS_2: 7, PNRS_NIGHT: 7 },
    scores: {},
    submittedAt: iso(daysAgo(1)),
  },
  {
    id: 'fr-p35-d10',
    patientId: 'p-35',
    templateId: 'qt-wound-pain',
    caseId: 'case-37',
    patientJourneyId: 'pj-35',
    answers: { WOUND_HEALED: false, WOUND_DISCHARGE: false, PNRS_2: 4, PNRS_NIGHT: 3 },
    scores: {},
    submittedAt: iso(daysAgo(1)),
  },
  {
    id: 'fr-p37-w6',
    patientId: 'p-37',
    templateId: 'qt-function-oss',
    caseId: 'case-39',
    patientJourneyId: 'pj-37',
    answers: { OSS_1: 2, OSS_2: 3, OSS_3: 3, OSS_4: 2, OSS_5: 3, PNRS_2: 6 },
    scores: { 'OSS.total': 26 },
    submittedAt: iso(daysAgo(8)),
  },
  {
    id: 'fr-p38-w6',
    patientId: 'p-38',
    templateId: 'qt-function-oss',
    caseId: 'case-40',
    patientJourneyId: 'pj-38',
    answers: { OSS_1: 3, OSS_2: 4, OSS_3: 3, OSS_4: 3, OSS_5: 3, PNRS_2: 3 },
    scores: { 'OSS.total': 30 },
    submittedAt: iso(daysAgo(4)),
  },
  {
    id: 'fr-p39-6m',
    patientId: 'p-39',
    templateId: 'qt-eq5d-oss',
    caseId: 'case-41',
    patientJourneyId: 'pj-39',
    answers: {
      EQ_MOB: '1',
      EQ_SELF: '2',
      EQ_ACT: '2',
      EQ_PAIN: '2',
      EQ_ANX: '1',
      EQ_VAS: 62,
      OSS_1: 3,
      OSS_2: 2,
      OSS_3: 3,
      OSS_4: 3,
      OSS_5: 3,
      FREE_TEXT: 'Värken i axeln har kommit tillbaka senaste månaden, särskilt på natten.',
    },
    scores: { 'OSS.total': 27, 'EQ5D.index': 0.61, EQ_VAS: 62 },
    submittedAt: iso(daysAgo(5)),
  },
  {
    id: 'fr-p40-6m',
    patientId: 'p-40',
    templateId: 'qt-eq5d-oss',
    caseId: 'case-42',
    patientJourneyId: 'pj-40',
    answers: {
      EQ_MOB: '1',
      EQ_SELF: '1',
      EQ_ACT: '1',
      EQ_PAIN: '1',
      EQ_ANX: '1',
      EQ_VAS: 92,
      OSS_1: 5,
      OSS_2: 5,
      OSS_3: 4,
      OSS_4: 5,
      OSS_5: 5,
      FREE_TEXT: 'Känns som vanligt igen. Tack för bra vård!',
    },
    scores: { 'OSS.total': 44, 'EQ5D.index': 0.94, EQ_VAS: 92 },
    submittedAt: iso(daysAgo(5)),
  },
  {
    id: 'fr-p41-d1',
    patientId: 'p-41',
    templateId: 'qt-numbness-infection',
    caseId: 'case-43',
    patientJourneyId: 'pj-41',
    answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: true, INF_FEVER: true, PNRS_1: 7 },
    scores: {},
    submittedAt: iso(daysAgo(1)),
  },
]

// ── Audit trail ─────────────────────────────────────────────────────────────

export const pathwayAuditEvents: AuditEvent[] = [
  ...pathwayCases.map((c): AuditEvent => ({
    id: `ae-${c.id}-created`,
    caseId: c.id,
    userId: c.createdByUserId,
    userRole: c.createdByUserId.includes('nurse') ? 'NURSE' : 'DOCTOR',
    action: 'CASE_CREATED',
    timestamp: c.createdAt,
  })),
  ...pathwayCases
    .filter((c) => c.triageDecision && c.triagedByUserId)
    .map((c): AuditEvent => ({
      id: `ae-${c.id}-triaged`,
      caseId: c.id,
      userId: c.triagedByUserId!,
      userRole: 'DOCTOR',
      action: 'TRIAGED',
      details: {
        contactMode: c.triageDecision!.contactMode,
        careRole: c.triageDecision!.careRole,
        assignmentMode: c.triageDecision!.assignmentMode,
        xrayBeforeVisit: c.triageDecision!.xrayBeforeVisit,
        nextStep: c.nextStep,
      },
      timestamp: iso(daysAgo(c.status === 'CLOSED' ? 5 : 2)),
    })),
  ...pathwayCases.flatMap((c) =>
    (c.bookings ?? [])
      .filter((b) => b.type !== 'XRAY')
      .map((b): AuditEvent => ({
        id: `ae-${b.id}-created`,
        caseId: c.id,
        userId: b.createdByUserId,
        userRole: 'SECRETARY',
        action: 'BOOKING_CREATED',
        details: { bookingId: b.id, scheduledAt: b.scheduledAt, role: b.role },
        timestamp: b.createdAt,
      })),
  ),
  ...pathwayCases
    .filter((c) => c.status === 'CLOSED' && c.bookings?.length)
    .map((c): AuditEvent => {
      const visit = c.bookings!.find((b) => b.type !== 'XRAY')!
      const xray = c.bookings!.find((b) => b.type === 'XRAY')
      return {
        id: `ae-${c.id}-closed`,
        caseId: c.id,
        userId: SECRETARY_ID,
        userRole: 'SECRETARY',
        action: 'STATUS_CHANGED',
        details: {
          from: 'FOLLOWING_UP',
          to: 'CLOSED',
          closedAt: c.closedAt,
          bookingId: visit.id,
          followUpDate: visit.followUpDate,
          completionComment: visit.completionComment,
          xrayAt: xray?.scheduledAt,
          xrayLocation: xray?.location,
        },
        timestamp: c.closedAt!,
      }
    }),
]
