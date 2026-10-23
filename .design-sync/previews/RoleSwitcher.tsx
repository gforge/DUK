import { AppBar, RoleSwitcher, Toolbar, Typography } from 'duk-clinical-triage-demo'

export const InTopBar = () => (
  <AppBar position="static" elevation={1} sx={{ width: 360 }}>
    <Toolbar sx={{ minHeight: 56, gap: 1 }}>
      <Typography variant="body2" sx={{ opacity: 0.85, flexGrow: 1 }}>
        SSK Anna Holmberg
      </Typography>
      <RoleSwitcher />
    </Toolbar>
  </AppBar>
)
