import { AppShell, Card, CardContent, Grid, StatusChip, Stack, Typography } from 'duk-clinical-triage-demo'

export const Dashboard = () => (
  <AppShell>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
      Översikt
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'Behöver granskning', value: 7, status: 'NEEDS_REVIEW' as const },
        { label: 'Triagerade', value: 23, status: 'TRIAGED' as const },
        { label: 'Uppföljning', value: 41, status: 'FOLLOWING_UP' as const },
      ].map((k) => (
        <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {k.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {k.value}
                </Typography>
                <Stack direction="row"><StatusChip status={k.status} /></Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </AppShell>
)
