import type { AppState } from './schemas'

const now = new Date()
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000)

export const SEED_STATE: AppState = {
  // ─── Users (fake auth) ─────────────────────────────────────────────────────
  users: [
    { id: 'user-pal-1', name: 'Dr. Sara Lindqvist (PAL)', role: 'PAL' },
    { id: 'user-doc-1', name: 'Dr. Erik Bergström', role: 'DOCTOR' },
    { id: 'user-nurse-1', name: 'SSK Anna Holmberg', role: 'NURSE' },
    { id: 'user-nurse-2', name: 'SSK Jonas Ekström', role: 'NURSE' },
    { id: 'user-patient-1', name: 'Anders Andersson', role: 'PATIENT' },
  ],

  // ─── Patients ──────────────────────────────────────────────────────────────
  patients: [
    {
      id: 'p-1',
      displayName: 'Anders Andersson',
      personalNumber: '194501010001',
      dateOfBirth: '1945-01-01',
      palId: 'user-pal-1',
      lastOpenedAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(14)),
    },
    {
      id: 'p-2',
      displayName: 'Elin Elinsson',
      personalNumber: '196503152222',
      dateOfBirth: '1965-03-15',
      palId: 'user-pal-1',
      lastOpenedAt: iso(daysAgo(10)),
      createdAt: iso(daysAgo(10)),
    },
    {
      id: 'p-3',
      displayName: 'Karl Karlsson',
      personalNumber: '197807204444',
      dateOfBirth: '1978-07-20',
      palId: 'user-doc-1',
      lastOpenedAt: iso(daysAgo(2)),
      createdAt: iso(daysAgo(7)),
    },
    {
      id: 'p-4',
      displayName: 'Peter Petersson',
      personalNumber: '195512125555',
      dateOfBirth: '1955-12-12',
      palId: 'user-pal-1',
      // no lastOpenedAt → "not opened"
      createdAt: iso(daysAgo(5)),
    },
    {
      id: 'p-5',
      displayName: 'Torkel Torkelson',
      personalNumber: '198804086666',
      dateOfBirth: '1988-04-08',
      palId: 'user-doc-1',
      lastOpenedAt: iso(daysAgo(3)),
      createdAt: iso(daysAgo(60)),
    },
    {
      id: 'p-6',
      displayName: 'Maria Magnusson',
      personalNumber: '197202177777',
      dateOfBirth: '1972-02-17',
      palId: 'user-pal-1',
      lastOpenedAt: iso(daysAgo(30)),
      createdAt: iso(daysAgo(90)),
    },
    {
      id: 'p-7',
      displayName: 'Sven Svensson',
      personalNumber: '196609099999',
      dateOfBirth: '1966-09-09',
      palId: 'user-doc-1',
      // no lastOpenedAt
      createdAt: iso(daysAgo(3)),
    },
    {
      id: 'p-8',
      displayName: 'Britta Bryngelsson',
      personalNumber: '195003038888',
      dateOfBirth: '1950-03-03',
      palId: 'user-pal-1',
      lastOpenedAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(20)),
    },
    {
      id: 'p-9',
      displayName: 'Gunnar Gustafsson',
      personalNumber: '197511151111',
      dateOfBirth: '1975-11-15',
      palId: 'user-doc-1',
      lastOpenedAt: iso(daysAgo(4)),
      createdAt: iso(daysAgo(40)),
    },
    {
      id: 'p-10',
      displayName: 'Lena Lindberg',
      personalNumber: '198001013333',
      dateOfBirth: '1980-01-01',
      palId: 'user-pal-1',
      lastOpenedAt: iso(daysAgo(6)),
      createdAt: iso(daysAgo(100)),
    },
  ],

  // ─── Cases ─────────────────────────────────────────────────────────────────
  cases: [
    // ── ACUTE (0–2 weeks) ────────────────────────────────────────────────────
    {
      id: 'case-1',
      patientId: 'p-1',
      category: 'ACUTE',
      status: 'NEEDS_REVIEW',
      triggers: ['HIGH_PAIN', 'INFECTION_SUSPECTED'],
      policyWarnings: [
        {
          ruleId: 'rule-1',
          ruleName: 'Pain not decreasing',
          severity: 'HIGH',
          triggeredValues: { PNRS_1: 8, PNRS_2: 8 },
          expression: 'PNRS_1 - PNRS_2 <= 0',
        },
      ],
      assignedRole: 'DOCTOR',
      assignedUserId: 'user-doc-1',
      createdByUserId: 'user-nurse-1',
      scheduledAt: iso(daysAgo(2)),
      lastActivityAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(2)),
      formSeriesId: 'fs-1',
    },
    {
      id: 'case-2',
      patientId: 'p-2',
      category: 'ACUTE',
      status: 'NEEDS_REVIEW',
      triggers: ['HIGH_PAIN', 'ABNORMAL_ANSWER'],
      policyWarnings: [
        {
          ruleId: 'rule-1',
          ruleName: 'Pain not decreasing',
          severity: 'HIGH',
          triggeredValues: { PNRS_1: 7, PNRS_2: 8 },
          expression: 'PNRS_1 - PNRS_2 <= 0',
        },
        {
          ruleId: 'rule-3',
          ruleName: 'Low QoL',
          severity: 'MEDIUM',
          triggeredValues: { 'EQ5D.index': 0.4 },
          expression: 'EQ5D.index < 0.5',
        },
      ],
      assignedRole: 'NURSE',
      createdByUserId: 'user-pal-1',
      scheduledAt: iso(daysAgo(3)),
      lastActivityAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(3)),
      formSeriesId: 'fs-1',
    },
    {
      id: 'case-7',
      patientId: 'p-7',
      category: 'ACUTE',
      status: 'NEW',
      triggers: ['NOT_OPENED'],
      policyWarnings: [],
      createdByUserId: 'user-nurse-1',
      scheduledAt: iso(daysAgo(1)),
      lastActivityAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(1)),
      formSeriesId: 'fs-1',
    },

    // ── SUBACUTE (3–8 weeks) ─────────────────────────────────────────────────
    {
      id: 'case-3',
      patientId: 'p-3',
      category: 'SUBACUTE',
      status: 'TRIAGED',
      triggers: [],
      policyWarnings: [],
      assignedRole: 'NURSE',
      nextStep: 'DIGITAL_CONTROL',
      deadline: iso(daysFromNow(7)),
      createdByUserId: 'user-pal-1',
      triagedByUserId: 'user-pal-1',
      scheduledAt: iso(daysAgo(21)),
      lastActivityAt: iso(daysAgo(2)),
      createdAt: iso(daysAgo(21)),
      formSeriesId: 'fs-2',
    },
    {
      id: 'case-4',
      patientId: 'p-4',
      category: 'SUBACUTE',
      status: 'NEEDS_REVIEW',
      triggers: ['NOT_OPENED', 'SEEK_CONTACT'],
      policyWarnings: [],
      createdByUserId: 'user-nurse-2',
      scheduledAt: iso(daysAgo(25)),
      lastActivityAt: iso(daysAgo(5)),
      createdAt: iso(daysAgo(25)),
      formSeriesId: 'fs-2',
    },
    {
      id: 'case-8',
      patientId: 'p-8',
      category: 'SUBACUTE',
      status: 'FOLLOWING_UP',
      triggers: ['HIGH_PAIN'],
      policyWarnings: [
        {
          ruleId: 'rule-2',
          ruleName: 'Low function',
          severity: 'MEDIUM',
          triggeredValues: { 'OSS.total': 22 },
          expression: 'OSS.total < 30',
        },
      ],
      nextStep: 'NURSE_VISIT',
      deadline: iso(daysFromNow(3)),
      internalNote: 'Patient reported persistent swelling. Scheduled nurse visit.',
      assignedRole: 'NURSE',
      assignedUserId: 'user-nurse-1',
      createdByUserId: 'user-pal-1',
      triagedByUserId: 'user-pal-1',
      scheduledAt: iso(daysAgo(18)),
      lastActivityAt: iso(daysAgo(1)),
      createdAt: iso(daysAgo(18)),
      formSeriesId: 'fs-2',
    },

    // ── CONTROL (9+ weeks) ───────────────────────────────────────────────────
    {
      id: 'case-5',
      patientId: 'p-5',
      category: 'CONTROL',
      status: 'NEEDS_REVIEW',
      triggers: ['LOW_FUNCTION', 'LOW_QOL'],
      policyWarnings: [
        {
          ruleId: 'rule-2',
          ruleName: 'Low function',
          severity: 'MEDIUM',
          triggeredValues: { 'OSS.total': 25 },
          expression: 'OSS.total < 30',
        },
        {
          ruleId: 'rule-3',
          ruleName: 'Low QoL',
          severity: 'MEDIUM',
          triggeredValues: { 'EQ5D.index': 0.45 },
          expression: 'EQ5D.index < 0.5',
        },
      ],
      createdByUserId: 'user-doc-1',
      scheduledAt: iso(daysAgo(63)),
      lastActivityAt: iso(daysAgo(3)),
      createdAt: iso(daysAgo(63)),
      formSeriesId: 'fs-3',
    },
    {
      id: 'case-6',
      patientId: 'p-6',
      category: 'CONTROL',
      status: 'CLOSED',
      triggers: [],
      policyWarnings: [],
      nextStep: 'DIGITAL_CONTROL',
      deadline: iso(daysFromNow(90)),
      assignedRole: 'NURSE',
      createdByUserId: 'user-pal-1',
      triagedByUserId: 'user-pal-1',
      internalNote: 'All good at 6-month mark. Next check in 3 months.',
      scheduledAt: iso(daysAgo(90)),
      lastActivityAt: iso(daysAgo(7)),
      createdAt: iso(daysAgo(90)),
      formSeriesId: 'fs-3',
    },
    {
      id: 'case-9',
      patientId: 'p-9',
      category: 'CONTROL',
      status: 'NEEDS_REVIEW',
      triggers: ['NO_RESPONSE'],
      policyWarnings: [],
      createdByUserId: 'user-doc-1',
      scheduledAt: iso(daysAgo(70)),
      lastActivityAt: iso(daysAgo(5)),
      createdAt: iso(daysAgo(70)),
      formSeriesId: 'fs-3',
    },
    {
      id: 'case-10',
      patientId: 'p-10',
      category: 'CONTROL',
      status: 'TRIAGED',
      triggers: [],
      policyWarnings: [],
      nextStep: 'PHYSIO_VISIT',
      deadline: iso(daysFromNow(14)),
      assignedRole: 'NURSE',
      createdByUserId: 'user-pal-1',
      triagedByUserId: 'user-pal-1',
      scheduledAt: iso(daysAgo(100)),
      lastActivityAt: iso(daysAgo(2)),
      createdAt: iso(daysAgo(100)),
      formSeriesId: 'fs-3',
    },
  ],

  // ─── Questionnaire Templates ────────────────────────────────────────────────
  questionnaireTemplates: [
    // Day 1-2: Numbness + Infection
    {
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
      createdAt: iso(daysAgo(100)),
    },
    // Day 10-14: Wound status + Pain
    {
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
      createdAt: iso(daysAgo(100)),
    },
    // Week 4 & 6-8: Function (OSS) + Pain
    {
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
          scale: 8, // 5 items × max 5 × 8/5 → normalized to 40-point scale
        },
      ],
      createdAt: iso(daysAgo(100)),
    },
    // 6 month & 1 year: EQ-5D + OSS + PROMs
    {
      id: 'qt-eq5d-oss',
      name: '6-month / 1-year: EQ-5D & OSS (PROMs)',
      questions: [
        {
          id: 'q-eq-mob',
          key: 'EQ_MOB',
          type: 'SELECT',
          labelKey: 'questionnaire.eq_mobility',
          required: true,
          options: [
            { value: '1', labelKey: 'eq.level_1' },
            { value: '2', labelKey: 'eq.level_2' },
            { value: '3', labelKey: 'eq.level_3' },
          ],
        },
        {
          id: 'q-eq-self',
          key: 'EQ_SELF',
          type: 'SELECT',
          labelKey: 'questionnaire.eq_selfcare',
          required: true,
          options: [
            { value: '1', labelKey: 'eq.level_1' },
            { value: '2', labelKey: 'eq.level_2' },
            { value: '3', labelKey: 'eq.level_3' },
          ],
        },
        {
          id: 'q-eq-act',
          key: 'EQ_ACT',
          type: 'SELECT',
          labelKey: 'questionnaire.eq_usual_activity',
          required: true,
          options: [
            { value: '1', labelKey: 'eq.level_1' },
            { value: '2', labelKey: 'eq.level_2' },
            { value: '3', labelKey: 'eq.level_3' },
          ],
        },
        {
          id: 'q-eq-pain',
          key: 'EQ_PAIN',
          type: 'SELECT',
          labelKey: 'questionnaire.eq_pain_discomfort',
          required: true,
          options: [
            { value: '1', labelKey: 'eq.level_1' },
            { value: '2', labelKey: 'eq.level_2' },
            { value: '3', labelKey: 'eq.level_3' },
          ],
        },
        {
          id: 'q-eq-anx',
          key: 'EQ_ANX',
          type: 'SELECT',
          labelKey: 'questionnaire.eq_anxiety',
          required: true,
          options: [
            { value: '1', labelKey: 'eq.level_1' },
            { value: '2', labelKey: 'eq.level_2' },
            { value: '3', labelKey: 'eq.level_3' },
          ],
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
      createdAt: iso(daysAgo(100)),
    },
  ],

  // ─── Form Series ────────────────────────────────────────────────────────────
  formSeries: [
    {
      id: 'fs-1',
      name: 'Acute follow-up series (0-2 weeks)',
      entries: [
        { templateId: 'qt-numbness-infection', offsetDays: 1, order: 1 },
        { templateId: 'qt-wound-pain', offsetDays: 10, order: 2 },
      ],
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'fs-2',
      name: 'Subacute follow-up series (3-8 weeks)',
      entries: [
        { templateId: 'qt-wound-pain', offsetDays: 10, order: 1 },
        { templateId: 'qt-function-oss', offsetDays: 28, order: 2 },
        { templateId: 'qt-function-oss', offsetDays: 49, order: 3 },
      ],
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'fs-3',
      name: 'Long-term PROMs series (6m / 1yr)',
      entries: [
        { templateId: 'qt-function-oss', offsetDays: 42, order: 1 },
        { templateId: 'qt-eq5d-oss', offsetDays: 180, order: 2 },
        { templateId: 'qt-eq5d-oss', offsetDays: 365, order: 3 },
      ],
      createdAt: iso(daysAgo(100)),
    },
  ],

  // ─── Form Responses (prefilled for demo) ────────────────────────────────────
  formResponses: [
    // Anders Andersson – case-1 – acute, high pain both readings
    {
      id: 'fr-1',
      patientId: 'p-1',
      templateId: 'qt-numbness-infection',
      caseId: 'case-1',
      answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: true, INF_FEVER: true, PNRS_1: 8 },
      scores: {},
      submittedAt: iso(daysAgo(13)),
    },
    {
      id: 'fr-2',
      patientId: 'p-1',
      templateId: 'qt-wound-pain',
      caseId: 'case-1',
      answers: {
        WOUND_HEALED: false,
        WOUND_DISCHARGE: true,
        PNRS_2: 8,
        PNRS_NIGHT: 7,
      },
      scores: {},
      submittedAt: iso(daysAgo(4)),
    },
    // Elin Elinsson – case-2 – pain increasing + low QoL
    {
      id: 'fr-3',
      patientId: 'p-2',
      templateId: 'qt-numbness-infection',
      caseId: 'case-2',
      answers: { NUMB_1: false, NUMB_2: false, INF_WOUND: false, INF_FEVER: false, PNRS_1: 7 },
      scores: {},
      submittedAt: iso(daysAgo(9)),
    },
    {
      id: 'fr-4',
      patientId: 'p-2',
      templateId: 'qt-wound-pain',
      caseId: 'case-2',
      answers: {
        WOUND_HEALED: true,
        WOUND_DISCHARGE: false,
        PNRS_2: 8,
        PNRS_NIGHT: 6,
      },
      scores: {},
      submittedAt: iso(daysAgo(2)),
    },
    // Karl Karlsson – case-3 – subacute, good progress
    {
      id: 'fr-5',
      patientId: 'p-3',
      templateId: 'qt-function-oss',
      caseId: 'case-3',
      answers: {
        OSS_1: 4,
        OSS_2: 3,
        OSS_3: 4,
        OSS_4: 4,
        OSS_5: 3,
        PNRS_2: 3,
      },
      scores: { 'OSS.total': 36 },
      submittedAt: iso(daysAgo(2)),
    },
    // Britta – case-8 – subacute following up, low function
    {
      id: 'fr-8',
      patientId: 'p-8',
      templateId: 'qt-function-oss',
      caseId: 'case-8',
      answers: {
        OSS_1: 2,
        OSS_2: 2,
        OSS_3: 3,
        OSS_4: 2,
        OSS_5: 2,
        PNRS_2: 6,
      },
      scores: { 'OSS.total': 22 },
      submittedAt: iso(daysAgo(4)),
    },
    // Torkel – case-5 – control, low function + low QoL
    {
      id: 'fr-5b',
      patientId: 'p-5',
      templateId: 'qt-eq5d-oss',
      caseId: 'case-5',
      answers: {
        EQ_MOB: '2',
        EQ_SELF: '1',
        EQ_ACT: '2',
        EQ_PAIN: '3',
        EQ_ANX: '2',
        EQ_VAS: 45,
        OSS_1: 2,
        OSS_2: 3,
        OSS_3: 2,
        OSS_4: 2,
        OSS_5: 3,
        FREE_TEXT: 'Jag har fortfarande ont men det är bättre än förut. Svårt att sova.',
      },
      scores: { 'OSS.total': 25, 'EQ5D.index': 0.45 },
      submittedAt: iso(daysAgo(3)),
    },
    // Maria – case-6 – closed, good result
    {
      id: 'fr-6',
      patientId: 'p-6',
      templateId: 'qt-eq5d-oss',
      caseId: 'case-6',
      answers: {
        EQ_MOB: '1',
        EQ_SELF: '1',
        EQ_ACT: '1',
        EQ_PAIN: '1',
        EQ_ANX: '1',
        EQ_VAS: 85,
        OSS_1: 4,
        OSS_2: 4,
        OSS_3: 5,
        OSS_4: 4,
        OSS_5: 4,
        FREE_TEXT: 'Mår mycket bra. Är nöjd med behandlingen.',
      },
      scores: { 'OSS.total': 38, 'EQ5D.index': 0.9 },
      submittedAt: iso(daysAgo(7)),
    },
    // Lena – case-10 – control, triaged to physio
    {
      id: 'fr-10',
      patientId: 'p-10',
      templateId: 'qt-eq5d-oss',
      caseId: 'case-10',
      answers: {
        EQ_MOB: '2',
        EQ_SELF: '1',
        EQ_ACT: '2',
        EQ_PAIN: '2',
        EQ_ANX: '1',
        EQ_VAS: 65,
        OSS_1: 3,
        OSS_2: 3,
        OSS_3: 4,
        OSS_4: 3,
        OSS_5: 3,
        FREE_TEXT: 'Lite stel i axeln på morgnarna men förbättras under dagen.',
      },
      scores: { 'OSS.total': 32, 'EQ5D.index': 0.72 },
      submittedAt: iso(daysAgo(2)),
    },
  ],

  // ─── Audit Events ───────────────────────────────────────────────────────────
  auditEvents: [
    {
      id: 'ae-1',
      caseId: 'case-1',
      userId: 'user-nurse-1',
      userRole: 'NURSE',
      action: 'CASE_CREATED',
      timestamp: iso(daysAgo(14)),
    },
    {
      id: 'ae-2',
      caseId: 'case-1',
      userId: 'user-nurse-1',
      userRole: 'NURSE',
      action: 'STATUS_CHANGED',
      details: { from: 'NEW', to: 'NEEDS_REVIEW' },
      timestamp: iso(daysAgo(2)),
    },
    {
      id: 'ae-3',
      caseId: 'case-3',
      userId: 'user-pal-1',
      userRole: 'PAL',
      action: 'TRIAGED',
      details: { nextStep: 'DIGITAL_CONTROL', deadline: iso(daysFromNow(7)) },
      timestamp: iso(daysAgo(2)),
    },
    {
      id: 'ae-4',
      caseId: 'case-6',
      userId: 'user-pal-1',
      userRole: 'PAL',
      action: 'CASE_CLOSED',
      details: { reason: 'Normal course at 6-month mark' },
      timestamp: iso(daysAgo(7)),
    },
    {
      id: 'ae-5',
      caseId: 'case-8',
      userId: 'user-pal-1',
      userRole: 'PAL',
      action: 'STATUS_CHANGED',
      details: { from: 'TRIAGED', to: 'FOLLOWING_UP' },
      timestamp: iso(daysAgo(3)),
    },
  ],

  // ─── Journal Drafts ─────────────────────────────────────────────────────────
  journalDrafts: [
    {
      id: 'jd-1',
      caseId: 'case-1',
      templateId: 'jt-standard',
      content:
        'Patient Anders Andersson, 1945-01-01. Acute follow-up at day 10-14.\n\nPain score: 8/10 (unchanged from day 1-2). Wound has not healed; discharge noted. Signs of infection suspected.\n\nPolicy warnings: Pain not decreasing (PNRS_1 8 → PNRS_2 8).\n\nRecommendation: Refer to doctor for assessment. Consider antibiotic therapy.',
      status: 'DRAFT',
      createdByUserId: 'user-nurse-1',
      createdAt: iso(daysAgo(1)),
      updatedAt: iso(daysAgo(1)),
    },
  ],

  // ─── Journal Templates ──────────────────────────────────────────────────────
  journalTemplates: [
    {
      id: 'jt-standard',
      name: 'Standard follow-up note',
      body: `Patient {{patient.displayName}}, {{patient.dateOfBirth}}.
Category: {{case.category}}. Status: {{case.status}}.

{{#if triggers.HIGH_PAIN}}
⚠️ High pain reported. Pain score: {{scores.PNRS_2}}/10.
{{/if}}
{{#if triggers.INFECTION_SUSPECTED}}
⚠️ Infection suspected. Please review wound status.
{{/if}}
{{#if triggers.NO_RESPONSE}}
ℹ️ Patient has not submitted the requested form.
{{/if}}
{{#if triggers.NOT_OPENED}}
ℹ️ Patient has not opened the app.
{{/if}}

OSS total: {{scores.OSS.total}} / 40
EQ-5D index: {{scores.EQ5D.index}}

Policy warnings: {{policyWarnings.list}}

Triage decision: {{triage.nextStep}}
Next appointment: {{triage.deadline}}

Internal note: {{triage.internalNote}}`,
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'jt-closure',
      name: 'Case closure note',
      body: `Patient {{patient.displayName}}, {{patient.dateOfBirth}}.

This follow-up episode ({{case.category}}) is now closed.

Final OSS: {{scores.OSS.total}} / 40
Final EQ-5D: {{scores.EQ5D.index}}

Outcome: {{triage.nextStep}}
Clinician note: {{triage.internalNote}}`,
      createdAt: iso(daysAgo(100)),
    },
  ],

  // ─── Policy Rules ───────────────────────────────────────────────────────────
  policyRules: [
    {
      id: 'rule-1',
      name: 'Pain not decreasing',
      expression: 'PNRS_1 - PNRS_2 <= 0',
      severity: 'HIGH',
      enabled: true,
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'rule-2',
      name: 'Low function (OSS)',
      expression: 'OSS.total < 30',
      severity: 'MEDIUM',
      enabled: true,
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'rule-3',
      name: 'Low QoL (EQ-5D)',
      expression: 'EQ5D.index < 0.5',
      severity: 'MEDIUM',
      enabled: true,
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'rule-4',
      name: 'High pain (VAS)',
      expression: 'PNRS_2 >= 7',
      severity: 'HIGH',
      enabled: true,
      createdAt: iso(daysAgo(100)),
    },
    {
      id: 'rule-5',
      name: 'Low EQ VAS',
      expression: 'EQ_VAS < 50',
      severity: 'LOW',
      enabled: false,
      createdAt: iso(daysAgo(100)),
    },
  ],
}
