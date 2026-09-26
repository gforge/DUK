import { AutoWarningsBadge, Stack, Typography } from 'duk-clinical-triage-demo'

const pain = {
  ruleId: 'r-pain',
  ruleName: 'Hög smärta efter operation',
  severity: 'HIGH' as const,
  triggeredValues: { nrs_pain: 8 },
  expression: 'nrs_pain >= 7',
}
const function_ = {
  ruleId: 'r-oks',
  ruleName: 'Låg funktion (OKS)',
  severity: 'MEDIUM' as const,
  triggeredValues: { oks_total: 18 },
  expression: 'oks_total < 20',
}
const response = {
  ruleId: 'r-late',
  ruleName: 'Sen besvarad enkät',
  severity: 'LOW' as const,
  triggeredValues: { days_late: 4 },
  expression: 'days_late > 3',
}

export const BySeverity = () => (
  <Stack spacing={1.5}>
    {[
      { label: 'Hög', warnings: [pain, function_] },
      { label: 'Medel', warnings: [function_] },
      { label: 'Låg', warnings: [response] },
    ].map((row) => (
      <Stack key={row.label} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ width: 56 }} color="text.secondary">
          {row.label}
        </Typography>
        <AutoWarningsBadge warnings={row.warnings} lastActivityAt="2026-09-24T08:15:00Z" />
      </Stack>
    ))}
  </Stack>
)

export const InWorklistRow = () => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2, maxWidth: 420 }}>
    <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
      Karin Nilsson · Knäprotes vänster
    </Typography>
    <AutoWarningsBadge warnings={[pain, function_, response]} lastActivityAt="2026-09-25T14:02:00Z" />
  </Stack>
)
