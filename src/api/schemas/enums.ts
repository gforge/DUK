import { z } from 'zod'

export const RoleSchema = z.enum(['PATIENT', 'NURSE', 'DOCTOR', 'SECRETARY'])
export type Role = z.infer<typeof RoleSchema>

export const ContactModeSchema = z.enum(['DIGITAL', 'PHONE', 'VISIT', 'CLOSE'])
export type ContactMode = z.infer<typeof ContactModeSchema>

export const CareRoleSchema = z.enum(['DOCTOR', 'NURSE', 'PHYSIO']).nullable()
export type CareRole = z.infer<typeof CareRoleSchema>

export const AssignmentModeSchema = z.enum(['ANY', 'PAL', 'NAMED']).nullable()
export type AssignmentMode = z.infer<typeof AssignmentModeSchema>

/**
 * Booking target role for contact routing.
 * PAL here means responsible physician ownership, not a user role.
 */
export const BookingRoleSchema = z.enum(['DOCTOR', 'NURSE', 'PAL'])
export type BookingRole = z.infer<typeof BookingRoleSchema>

export const WorkCategorySchema = z.enum(['VISIT', 'PHONE', 'DIGITAL'])
export type WorkCategory = z.infer<typeof WorkCategorySchema>

export const CaseStatusSchema = z.enum(['NEW', 'NEEDS_REVIEW', 'TRIAGED', 'FOLLOWING_UP', 'CLOSED'])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

export const CaseCategorySchema = z.enum(['ACUTE', 'SUBACUTE', 'CONTROL'])
export type CaseCategory = z.infer<typeof CaseCategorySchema>

export const TriggerTypeSchema = z.enum([
  'NO_RESPONSE',
  'NOT_OPENED',
  'HIGH_PAIN',
  'INFECTION_SUSPECTED',
  'LOW_FUNCTION',
  'LOW_QOL',
  'SEEK_CONTACT',
  'ABNORMAL_ANSWER',
  'LAB_PENDING',
  'XRAY_PENDING',
])
export type TriggerType = z.infer<typeof TriggerTypeSchema>

export const ReviewTypeSchema = z.enum(['LAB', 'XRAY'])
export type ReviewType = z.infer<typeof ReviewTypeSchema>

export const ReviewOutcomeSchema = z.enum(['OK', 'UNCERTAIN', 'PROBLEM'])
export type ReviewOutcome = z.infer<typeof ReviewOutcomeSchema>

export const NextStepSchema = z.enum([
  'DIGITAL_CONTROL',
  'DOCTOR_VISIT',
  'NURSE_VISIT',
  'PHYSIO_VISIT',
  'PHONE_CALL',
  'NO_ACTION',
])
export type NextStep = z.infer<typeof NextStepSchema>

export const JournalDraftStatusSchema = z.enum(['DRAFT', 'APPROVED'])
export type JournalDraftStatus = z.infer<typeof JournalDraftStatusSchema>

export const QuestionTypeSchema = z.enum(['SCALE', 'BOOLEAN', 'TEXT', 'SELECT', 'NUMBER'])
export type QuestionType = z.infer<typeof QuestionTypeSchema>
