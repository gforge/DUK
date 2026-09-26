import { AppShell, Box, DukProvider, Typography } from 'duk-clinical-triage-demo'

function Screen({ userId, title }: { userId: 'user-nurse-1' | 'user-sec-1'; title: string }) {
  return (
    <Box sx={{ position: 'relative', height: 360, transform: 'translateZ(0)', overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <DukProvider userId={userId}>
        <AppShell>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </AppShell>
      </DukProvider>
    </Box>
  )
}

export const NurseSession = () => <Screen userId="user-nurse-1" title="Översikt" />
export const SecretarySession = () => <Screen userId="user-sec-1" title="Åtgärdslista" />
