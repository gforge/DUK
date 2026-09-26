import type { CareTeam } from '../schemas'

/** Orthopaedic sub-speciality teams. Members are the seeded clinicians. */
export const careTeams: CareTeam[] = [
  {
    id: 'team-trauma',
    name: 'Trauma',
    memberUserIds: ['user-pal-1', 'user-doc-1', 'user-nurse-1', 'user-nurse-2'],
  },
  { id: 'team-shoulder', name: 'Axel & armbåge', memberUserIds: ['user-doc-1', 'user-nurse-1'] },
  { id: 'team-hand', name: 'Hand', memberUserIds: ['user-doc-1', 'user-nurse-2'] },
  { id: 'team-hip', name: 'Höft', memberUserIds: ['user-pal-1', 'user-nurse-1'] },
  { id: 'team-knee', name: 'Knä', memberUserIds: ['user-pal-1', 'user-nurse-2'] },
  { id: 'team-foot', name: 'Fot & fotled', memberUserIds: ['user-doc-1', 'user-nurse-1'] },
  { id: 'team-spine', name: 'Rygg', memberUserIds: ['user-pal-1', 'user-doc-1'] },
]
