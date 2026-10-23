import { RoleIcon, Stack, Typography } from 'duk-clinical-triage-demo'

const roles = [
  { role: 'PATIENT' as const, label: 'Patient' },
  { role: 'NURSE' as const, label: 'Sjuksköterska' },
  { role: 'DOCTOR' as const, label: 'Läkare' },
  { role: 'SECRETARY' as const, label: 'Sekreterare' },
]

export const AllRoles = () => (
  <Stack spacing={1}>
    {roles.map((r) => (
      <Stack key={r.role} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <RoleIcon role={r.role} />
        <Typography variant="body2">{r.label}</Typography>
      </Stack>
    ))}
  </Stack>
)

export const InlineSmall = () => (
  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <RoleIcon role="DOCTOR" showTooltip={false} sx={{ fontSize: 16 }} />
    Dr. Sara Lindqvist signerade anteckningen
  </Typography>
)
