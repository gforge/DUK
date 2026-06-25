/**
 * Pre-operative questionnaire templates for the hindfoot elective surgery pathway.
 *
 * Key design note — pre-population between forms:
 *   The following keys are intentionally SHARED between qt-preop-intake and
 *   qt-health-declaration so the app can pre-fill the health declaration from
 *   the earlier intake response when both keys match:
 *
 *     HEIGHT, WEIGHT, PREV_SURGERY, MEDICATIONS, ALLERGIES, SMOKING
 *
 *   This is a planned feature; the seed already uses identical keys to make
 *   the mapping explicit and testable.
 */

import type { QuestionnaireTemplate } from '../../schemas'
import { daysAgo, iso } from '../shared'

const CREATED_AT = iso(daysAgo(60))

const WALKING_AID_OPTIONS = [
  { value: 'NONE', label: { sv: 'Nej, inga hjälpmedel' } },
  { value: 'CRUTCHES', label: { sv: 'Kryckor' } },
  { value: 'WALKER', label: { sv: 'Rollator' } },
  { value: 'WHEELCHAIR', label: { sv: 'Rullstol' } },
]

const SMOKING_OPTIONS = [
  { value: 'NEVER', label: { sv: 'Aldrig rökt' } },
  { value: 'QUIT_OVER_6M', label: { sv: 'Slutat röka för mer än 6 månader sedan' } },
  { value: 'QUIT_UNDER_6M', label: { sv: 'Slutat röka för mindre än 6 månader sedan' } },
  { value: 'CURRENT', label: { sv: 'Ja, jag röker' } },
]

const ALCOHOL_OPTIONS = [
  { value: 'NONE', label: { sv: 'Ingen alkohol alls eller mindre än ett glas per vecka' } },
  { value: 'LOW', label: { sv: '1–4 glas per vecka' } },
  { value: 'MEDIUM', label: { sv: '5–9 glas per vecka' } },
  { value: 'HIGH', label: { sv: '10 glas eller mer per vecka' } },
]

/**
 * Pre-referral intake — filled by the patient before the first orthopaedic visit.
 * Collects lifestyle, social situation, medications, and allergies.
 * Fields marked ★ overlap with qt-health-declaration and can be pre-filled.
 */
export const qtPreopIntake: QuestionnaireTemplate = {
  id: 'qt-preop-intake',
  name: 'Patientenkät inför besök',
  questions: [
    // ── Physical baseline ──────────────────────────────────────────────────
    {
      id: 'q-pi-height',
      key: 'HEIGHT', // ★ shared with qt-health-declaration
      type: 'SCALE',
      label: { sv: 'Hur lång är du? (cm)' },
      required: true,
      min: 100,
      max: 220,
    },
    {
      id: 'q-pi-weight',
      key: 'WEIGHT', // ★ shared with qt-health-declaration
      type: 'SCALE',
      label: { sv: 'Hur mycket väger du? (kg)' },
      required: true,
      min: 30,
      max: 250,
    },
    // ── Previous surgery ───────────────────────────────────────────────────
    {
      id: 'q-pi-prev-surgery',
      key: 'PREV_SURGERY', // ★ shared with qt-health-declaration
      type: 'BOOLEAN',
      label: { sv: 'Har du blivit opererad tidigare?' },
      required: true,
    },
    {
      id: 'q-pi-prev-surgery-details',
      key: 'PREV_SURGERY_DETAILS',
      type: 'TEXT',
      label: { sv: 'Om ja — för vad och när?' },
      required: false,
    },
    // ── Social situation ───────────────────────────────────────────────────
    {
      id: 'q-pi-walking-aid',
      key: 'WALKING_AID',
      type: 'SELECT',
      label: { sv: 'Använder du gånghjälpmedel?' },
      required: true,
      options: WALKING_AID_OPTIONS,
    },
    {
      id: 'q-pi-home-care',
      key: 'HOME_CARE',
      type: 'BOOLEAN',
      label: { sv: 'Har du hemtjänst?' },
      required: true,
    },
    {
      id: 'q-pi-lives-alone',
      key: 'LIVES_ALONE',
      type: 'BOOLEAN',
      label: { sv: 'Bor du ensam?' },
      required: true,
    },
    {
      id: 'q-pi-stairs',
      key: 'STAIRS_AT_HOME',
      type: 'BOOLEAN',
      label: { sv: 'Har du trappor i ditt hem?' },
      required: true,
    },
    // ── Medications & allergies ────────────────────────────────────────────
    {
      id: 'q-pi-medications',
      key: 'MEDICATIONS', // ★ shared with qt-health-declaration
      type: 'TEXT',
      label: { sv: 'Vilka läkemedel tar du regelbundet? (namn, styrka, dos)' },
      required: false,
    },
    {
      id: 'q-pi-allergies',
      key: 'ALLERGIES', // ★ shared with qt-health-declaration
      type: 'TEXT',
      label: { sv: 'Har du kända allergier eller överkänslighet? (t.ex. mot läkemedel, latex)' },
      required: false,
    },
    // ── Lifestyle ──────────────────────────────────────────────────────────
    {
      id: 'q-pi-smoking',
      key: 'SMOKING', // ★ shared with qt-health-declaration
      type: 'SELECT',
      label: { sv: 'Röker du?' },
      required: true,
      options: SMOKING_OPTIONS,
    },
    // ── Pain baseline ──────────────────────────────────────────────────────
    {
      id: 'q-pi-pain',
      key: 'PNRS_1',
      type: 'SCALE',
      label: { sv: 'Hur ont har du just nu? (0 = ingen smärta, 10 = värsta tänkbara)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}

/**
 * Pre-anaesthesia health declaration — filled ~4 months into the waiting list,
 * before a surgery date is confirmed.
 *
 * Fields that are intentionally identical to qt-preop-intake (★) will be
 * pre-populated by the application once that feature is implemented.
 *
 * Modelled on the Region Skåne "Hälsodeklaration inför sövning och operation"
 * (slim version suitable for digital completion).
 */
export const qtHealthDeclaration: QuestionnaireTemplate = {
  id: 'qt-health-declaration',
  name: 'Hälsodeklaration inför anestesi',
  questions: [
    // ── Physical data (★ pre-fillable from qt-preop-intake) ────────────────
    {
      id: 'q-hd-height',
      key: 'HEIGHT', // ★ pre-fillable
      type: 'SCALE',
      label: { sv: 'Hur lång är du? (cm)' },
      required: true,
      min: 100,
      max: 220,
    },
    {
      id: 'q-hd-weight',
      key: 'WEIGHT', // ★ pre-fillable
      type: 'SCALE',
      label: { sv: 'Hur mycket väger du? (kg)' },
      required: true,
      min: 30,
      max: 250,
    },
    {
      id: 'q-hd-prev-surgery',
      key: 'PREV_SURGERY', // ★ pre-fillable
      type: 'BOOLEAN',
      label: { sv: 'Har du blivit opererad tidigare?' },
      required: true,
    },
    // ── Hereditary conditions ──────────────────────────────────────────────
    {
      id: 'q-hd-hereditary',
      key: 'HEREDITARY',
      type: 'BOOLEAN',
      label: {
        sv: 'Finns det ärftlig sjukdom i din släkt? (t.ex. porfyri, ärftlig muskelsjukdom, malign hypertermi)',
      },
      required: true,
    },
    // ── Medical history ────────────────────────────────────────────────────
    {
      id: 'q-hd-heart',
      key: 'HAS_HEART_DISEASE',
      type: 'BOOLEAN',
      label: { sv: 'Hjärtsjukdom?' },
      required: true,
    },
    {
      id: 'q-hd-hypertension',
      key: 'HAS_HYPERTENSION',
      type: 'BOOLEAN',
      label: { sv: 'Högt blodtryck eller blodtrycksbehandling?' },
      required: true,
    },
    {
      id: 'q-hd-anticoag',
      key: 'HAS_ANTICOAG',
      type: 'BOOLEAN',
      label: { sv: 'Blodpropp som krävt blodförtunnande behandling?' },
      required: true,
    },
    {
      id: 'q-hd-stroke',
      key: 'HAS_STROKE',
      type: 'BOOLEAN',
      label: { sv: 'Stroke (hjärnblödning eller infarkt) eller TIA?' },
      required: true,
    },
    {
      id: 'q-hd-diabetes',
      key: 'HAS_DIABETES',
      type: 'BOOLEAN',
      label: { sv: 'Diabetes?' },
      required: true,
    },
    {
      id: 'q-hd-lung',
      key: 'HAS_LUNG_DISEASE',
      type: 'BOOLEAN',
      label: { sv: 'Lungsjukdom?' },
      required: true,
    },
    {
      id: 'q-hd-kidney',
      key: 'HAS_KIDNEY_DISEASE',
      type: 'BOOLEAN',
      label: { sv: 'Njursjukdom?' },
      required: true,
    },
    // ── Infection risk ─────────────────────────────────────────────────────
    {
      id: 'q-hd-abroad',
      key: 'CARE_ABROAD',
      type: 'BOOLEAN',
      label: { sv: 'Har du sökt vård utanför Norden under de senaste sex månaderna?' },
      required: true,
    },
    {
      id: 'q-hd-mrsa',
      key: 'MRSA',
      type: 'BOOLEAN',
      label: {
        sv: 'Bär du eller någon närstående på multiresistenta bakterier? (MRSA, ESBL, VRE)',
      },
      required: true,
    },
    // ── Medications & allergies (★ pre-fillable from qt-preop-intake) ──────
    {
      id: 'q-hd-medications',
      key: 'MEDICATIONS', // ★ pre-fillable
      type: 'TEXT',
      label: {
        sv: 'Använder du läkemedel regelbundet? (inkl. naturläkemedel och receptfria medel — namn, styrka, dos)',
      },
      required: false,
    },
    {
      id: 'q-hd-allergies',
      key: 'ALLERGIES', // ★ pre-fillable
      type: 'TEXT',
      label: { sv: 'Är du allergisk mot något läkemedel eller har du annan allergi?' },
      required: false,
    },
    // ── Lifestyle (★ pre-fillable from qt-preop-intake) ───────────────────
    {
      id: 'q-hd-smoking',
      key: 'SMOKING', // ★ pre-fillable
      type: 'SELECT',
      label: { sv: 'Röker du?' },
      required: true,
      options: SMOKING_OPTIONS,
    },
    {
      id: 'q-hd-alcohol',
      key: 'ALCOHOL',
      type: 'SELECT',
      label: { sv: 'Hur många glas alkohol dricker du en vanlig vecka?' },
      required: true,
      options: ALCOHOL_OPTIONS,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}

/**
 * 2-month waiting-list status check.
 * Has anything changed since you were placed on the waiting list?
 */
export const qtWaitinglistStatus: QuestionnaireTemplate = {
  id: 'qt-waitinglist-status',
  name: 'Statusuppdatering — väntelista',
  questions: [
    {
      id: 'q-wl-new-disease',
      key: 'WL_NEW_DISEASE',
      type: 'BOOLEAN',
      label: { sv: 'Har du fått en ny sjukdom eller diagnos sedan du sattes upp på väntelistan?' },
      required: true,
    },
    {
      id: 'q-wl-new-medication',
      key: 'WL_NEW_MEDICATION',
      type: 'BOOLEAN',
      label: { sv: 'Har du fått ny medicinering sedan du sattes upp på väntelistan?' },
      required: true,
    },
    {
      id: 'q-wl-hospitalized',
      key: 'WL_HOSPITALIZED',
      type: 'BOOLEAN',
      label: { sv: 'Har du lagts in på sjukhus sedan du sattes upp på väntelistan?' },
      required: true,
    },
    {
      id: 'q-wl-comments',
      key: 'WL_COMMENTS',
      type: 'TEXT',
      label: {
        sv: 'Har du några övriga förändringar eller kommentarer att lämna till vårdteamet?',
      },
      required: false,
    },
    {
      id: 'q-wl-pain',
      key: 'PNRS_1',
      type: 'SCALE',
      label: { sv: 'Hur ont har du just nu? (0 = ingen smärta, 10 = värsta tänkbara)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}

/**
 * 3-month surgery interest check.
 * Confirms the patient still wants to proceed, with an apology for the wait.
 */
export const qtSurgeryInterest: QuestionnaireTemplate = {
  id: 'qt-surgery-interest',
  name: 'Operationsintresse — bekräftelse',
  questions: [
    {
      id: 'q-si-interested',
      key: 'STILL_INTERESTED',
      type: 'BOOLEAN',
      label: {
        sv: 'Vi beklagar att vi ännu inte kunnat erbjuda dig en operationstid. Önskar du fortfarande genomgå operation?',
      },
      required: true,
    },
    {
      id: 'q-si-concerns',
      key: 'CONCERNS',
      type: 'TEXT',
      label: { sv: 'Har du frågor eller funderingar inför operationen?' },
      required: false,
    },
    {
      id: 'q-si-pain',
      key: 'PNRS_1',
      type: 'SCALE',
      label: { sv: 'Hur ont har du just nu? (0 = ingen smärta, 10 = värsta tänkbara)' },
      required: true,
      min: 0,
      max: 10,
    },
  ],
  scoringRules: [],
  createdAt: CREATED_AT,
}
