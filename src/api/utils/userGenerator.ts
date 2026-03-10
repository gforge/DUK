import type { AppState, Role, User } from '../schemas'

/**
 * Swedish first names for nurses (Sjuksköterskor)
 */
const NURSE_FIRST_NAMES = [
  'Anna',
  'Maria',
  'Karin',
  'Eva',
  'Lena',
  'Kristina',
  'Emma',
  'Sofia',
  'Linda',
  'Elisabeth',
  'Annika',
  'Helena',
  'Katarina',
  'Jonas',
  'Erik',
  'Peter',
  'Lars',
  'Mikael',
  'Andreas',
  'Johan',
  'Magnus',
  'David',
  'Daniel',
]

/**
 * Swedish first names for doctors
 */
const DOCTOR_FIRST_NAMES = [
  'Erik',
  'Anders',
  'Lars',
  'Sara',
  'Eva',
  'Anna',
  'Johan',
  'Maria',
  'Karin',
  'Peter',
  'Mikael',
  'Elisabeth',
  'Magnus',
  'Helena',
  'Kristina',
]

/**
 * Common Swedish last names
 */
const LAST_NAMES = [
  'Andersson',
  'Johansson',
  'Karlsson',
  'Nilsson',
  'Eriksson',
  'Larsson',
  'Olsson',
  'Persson',
  'Svensson',
  'Gustafsson',
  'Pettersson',
  'Jonsson',
  'Jansson',
  'Hansson',
  'Bengtsson',
  'Lindqvist',
  'Lindberg',
  'Holmberg',
  'Bergström',
  'Sandberg',
  'Lundberg',
  'Forsberg',
  'Henriksson',
  'Lindström',
  'Berg',
  'Månsson',
  'Wallin',
  'Fransson',
  'Björk',
  'Eklund',
]

/**
 * Extract all userId + role combinations from AppState
 * Scans: cases, reviews, audit events, patients (PAL ownership), form responses, journal drafts, consents
 */
export function extractUserRefs(state: AppState): Map<string, Role> {
  const refs = new Map<string, Role>()

  // Cases: createdByUserId, assignedUserId, triagedByUserId
  for (const c of state.cases) {
    if (c.createdByUserId) {
      const role = inferRoleFromUserId(c.createdByUserId)
      if (role) refs.set(c.createdByUserId, role)
    }
    if (c.assignedUserId && c.assignedRole) {
      refs.set(c.assignedUserId, c.assignedRole)
    }
    if (c.triagedByUserId) {
      const role = inferRoleFromUserId(c.triagedByUserId)
      if (role) refs.set(c.triagedByUserId, role)
    }
  }

  // Reviews: createdByUserId + createdByRole, reviewedByUserId + reviewedByRole
  for (const c of state.cases) {
    for (const r of c.reviews) {
      if (r.createdByUserId && r.createdByRole) {
        refs.set(r.createdByUserId, r.createdByRole)
      }
      if (r.reviewedByUserId && r.reviewedByRole) {
        refs.set(r.reviewedByUserId, r.reviewedByRole)
      }
    }
  }

  // Audit events: userId + userRole
  for (const event of state.auditEvents) {
    if (event.userId && event.userRole) {
      refs.set(event.userId, event.userRole)
    }
  }

  // Patients: palId (doctor role via PAL ownership)
  for (const p of state.patients) {
    if (p.palId) {
      refs.set(p.palId, 'DOCTOR')
    }
  }

  // Form responses: patientId (PATIENT role)
  for (const fr of state.formResponses) {
    if (fr.patientId) {
      refs.set(fr.patientId, 'PATIENT')
    }
  }

  // Journal drafts: createdByUserId (infer from userId)
  for (const j of state.journalDrafts || []) {
    if (j.createdByUserId) {
      const role = inferRoleFromUserId(j.createdByUserId)
      if (role) refs.set(j.createdByUserId, role)
    }
  }

  // Research consents: grantedByUserId, revokedByUserId
  for (const consent of state.researchConsents || []) {
    if (consent.grantedByUserId) {
      const role = inferRoleFromUserId(consent.grantedByUserId)
      if (role) refs.set(consent.grantedByUserId, role)
    }
    if (consent.revokedByUserId) {
      const role = inferRoleFromUserId(consent.revokedByUserId)
      if (role) refs.set(consent.revokedByUserId, role)
    }
  }

  return refs
}

/**
 * Infer role from userId pattern (user-nurse-1, user-doc-2, user-pal-1, etc.)
 */
function inferRoleFromUserId(userId: string): Role | null {
  if (userId.includes('nurse')) return 'NURSE'
  if (userId.includes('doc')) return 'DOCTOR'
  if (userId.includes('pal')) return 'DOCTOR'
  if (userId.includes('sec') || userId.includes('secretary')) return 'SECRETARY'
  if (userId.includes('patient') || userId.startsWith('p-')) return 'PATIENT'
  return null
}

/**
 * Generate a deterministic name for a userId based on hash
 */
export function generateName(userId: string, role: Role): string {
  // Create a simple hash from userId
  const hash = userId.split('').reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0)

  let firstName: string
  let prefix = ''

  switch (role) {
    case 'NURSE':
      firstName = NURSE_FIRST_NAMES[hash % NURSE_FIRST_NAMES.length]
      prefix = 'SSK'
      break
    case 'DOCTOR':
      firstName = DOCTOR_FIRST_NAMES[hash % DOCTOR_FIRST_NAMES.length]
      prefix = 'Dr.'
      break
    case 'PATIENT':
      firstName = NURSE_FIRST_NAMES[hash % NURSE_FIRST_NAMES.length] // Reuse name pool
      break
    case 'SECRETARY':
      firstName = NURSE_FIRST_NAMES[hash % NURSE_FIRST_NAMES.length]
      break
  }

  const lastName = LAST_NAMES[(hash * 7) % LAST_NAMES.length]

  if (prefix) {
    return `${prefix} ${firstName} ${lastName}`
  } else {
    return `${firstName} ${lastName}`
  }
}

/**
 * Generate User[] from all userId references in AppState
 */
export function generateUsersFromState(state: AppState): User[] {
  const refs = extractUserRefs(state)
  const users: User[] = []

  for (const [userId, role] of refs) {
    users.push({
      id: userId,
      name: generateName(userId, role),
      role,
    })
  }

  return users
}

/**
 * Merge generated users with existing users (existing take precedence)
 * This ensures manually created users are preserved
 */
export function ensureAllUsers(state: AppState): User[] {
  const existingIds = new Set(state.users.map((u) => u.id))
  const generated = generateUsersFromState(state)

  // Keep existing users, add only generated users that don't exist
  const newUsers = generated.filter((u) => !existingIds.has(u.id))

  return [...state.users, ...newUsers]
}
