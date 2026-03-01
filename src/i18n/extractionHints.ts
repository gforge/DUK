/**
 * i18next extraction hints — NOT imported anywhere at runtime.
 * Lists every translation key that is constructed dynamically at runtime
 * (template literals, variables) so the parser can detect them as string literals.
 * Run:  npm run generate:i18n
 */

// This file is intentionally unreachable at runtime.
declare const t: (key: string) => string

// ─── Role ─────────────────────────────────────────────────────────────────────
t('role.PATIENT')
t('role.NURSE')
t('role.DOCTOR')
t('role.PAL')

// ─── Case status ──────────────────────────────────────────────────────────────
t('status.NEW')
t('status.NEEDS_REVIEW')
t('status.TRIAGED')
t('status.FOLLOWING_UP')
t('status.CLOSED')

// ─── Case category ────────────────────────────────────────────────────────────
t('category.ACUTE')
t('category.SUBACUTE')
t('category.CONTROL')
t('category.ACUTE_desc')
t('category.SUBACUTE_desc')
t('category.CONTROL_desc')

// ─── Severity ─────────────────────────────────────────────────────────────────
t('severity.LOW')
t('severity.MEDIUM')
t('severity.HIGH')

// ─── Next step ────────────────────────────────────────────────────────────────
t('nextStep.DIGITAL_CONTROL')
t('nextStep.DOCTOR_VISIT')
t('nextStep.NURSE_VISIT')
t('nextStep.PHYSIO_VISIT')
t('nextStep.PHONE_CALL')
t('nextStep.NO_ACTION')

// ─── Trigger types ────────────────────────────────────────────────────────────
t('trigger.NO_RESPONSE')
t('trigger.NOT_OPENED')
t('trigger.HIGH_PAIN')
t('trigger.INFECTION_SUSPECTED')
t('trigger.LOW_FUNCTION')
t('trigger.LOW_QOL')
t('trigger.SEEK_CONTACT')
t('trigger.ABNORMAL_ANSWER')

// ─── Nurse contact suggestion banners ────────────────────────────────────────
t('nurseContact.suggestion.SEEK_CONTACT')
t('nurseContact.suggestion.NOT_OPENED')

// ─── Audit actions ────────────────────────────────────────────────────────────
t('audit.actions.CASE_CREATED')
t('audit.actions.STATUS_CHANGED')
t('audit.actions.TRIAGED')
t('audit.actions.FORM_SUBMITTED')
t('audit.actions.SEEK_CONTACT')
t('audit.actions.JOURNAL_DRAFT_CREATED')
t('audit.actions.JOURNAL_DRAFT_APPROVED')
t('audit.actions.CASE_CLOSED')
t('audit.actions.CONTACTED')
t('audit.actions.REMINDER_SENT')

// ─── Questionnaire label keys (used via t(question.labelKey)) ─────────────────
t('questionnaire.numbness_fingers')
t('questionnaire.numbness_toes')
t('questionnaire.infection_wound')
t('questionnaire.infection_fever')
t('questionnaire.pain_now')
t('questionnaire.pain_night')
t('questionnaire.wound_healed')
t('questionnaire.wound_discharge')
t('questionnaire.oss_pain')
t('questionnaire.oss_washing')
t('questionnaire.oss_transport')
t('questionnaire.oss_dressing')
t('questionnaire.oss_shopping')
t('questionnaire.eq_mobility')
t('questionnaire.eq_selfcare')
t('questionnaire.eq_usual_activity')
t('questionnaire.eq_pain_discomfort')
t('questionnaire.eq_anxiety')
t('questionnaire.eq_vas')
t('questionnaire.free_text')

// ─── EQ-5D answer levels ──────────────────────────────────────────────────────
t('eq.level_1')
t('eq.level_2')
t('eq.level_3')
