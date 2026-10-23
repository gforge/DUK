import { CareRoleIcon, Stack, Typography } from 'duk-clinical-triage-demo'

const roles = [
  { role: 'DOCTOR' as const, label: 'Läkare' },
  { role: 'PAL' as const, label: 'PAL' },
  { role: 'NURSE' as const, label: 'Sjuksköterska' },
  { role: 'PHYSIO' as const, label: 'Fysioterapeut' },
]

export const AllRoles = () => (
  <Stack spacing={1}>
    {roles.map((r) => (
      <Stack key={r.role} direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <CareRoleIcon role={r.role} />
        <Typography variant="body2">{r.label}</Typography>
      </Stack>
    ))}
  </Stack>
)

export const Sizes = () => (
  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'primary.main' }}>
    <CareRoleIcon role="NURSE" fontSize="small" />
    <CareRoleIcon role="NURSE" fontSize="medium" />
    <CareRoleIcon role="NURSE" fontSize="large" />
  </Stack>
)
