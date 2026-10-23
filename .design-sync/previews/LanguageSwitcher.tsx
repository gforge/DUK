import { AppBar, LanguageSwitcher, Toolbar, Typography } from 'duk-clinical-triage-demo'

export const InTopBar = () => (
  <AppBar position="static" elevation={1} sx={{ width: 360 }}>
    <Toolbar sx={{ minHeight: 56, gap: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
        DUK
      </Typography>
      <LanguageSwitcher />
    </Toolbar>
  </AppBar>
)
