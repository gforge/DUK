# DUK conventions (read first)

DUK is a Swedish clinical-triage app built on **MUI (Material UI) + a DUK theme**. `window.DUK` exposes the DUK components, **all of `@mui/material`** (Box, Stack, Grid, Card, Typography, Button, Chip, Dialog, Tabs, AppBar, TextField, Alert, …), the app's icons as `<Name>Icon` (e.g. `WarningAmberIcon`, `SearchIcon`, `PersonIcon`, `AddIcon`, `EventIcon`, `PhoneIcon`), and the `theme` object.

## Setup: always wrap in DukProvider

```jsx
const { DukProvider, AppShell, Typography } = window.DUK;
<DukProvider>                 {/* lang="sv" | "en", userId="user-nurse-1" … */}
  <AppShell>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>Översikt</Typography>
  </AppShell>
</DukProvider>
```

DukProvider = ThemeProvider(DUK theme) + CssBaseline + i18n + MemoryRouter + a signed-in demo session + snackbar context. Without it MUI falls back to the default theme, and `AppShell`, `TopBar`, `SideNav`, `GlobalSearch`, `RoleSwitcher` throw (they read the current user and the router).
- `userId` drives role-gated UI: `user-nurse-1` (nurse, default; sees dashboard + search), `user-pal-1` / `user-doc-1` (doctor), `user-sec-1` (secretary: worklist/patients only), `user-patient-1` (patient).
- `initialPath` (e.g. `/worklist`) picks the active SideNav item. Nav paths: `/dashboard`, `/worklist`, `/policy`, `/patients`, `/journeys`, `/demo-tools`, `/patient`.
- Use one DukProvider per screen and don't nest it inside another router (it reuses that router and ignores `initialPath`).
- Import MUI pieces **from `window.DUK`**, never a separate MUI copy — a second copy won't see the DUK theme.

## Styling idiom: MUI theme + `sx`, no CSS classes

There are no utility classes and no CSS custom properties. Style with MUI props and the `sx` prop, using theme tokens:
- Palette: `primary.main` (#1565c0 blue), `secondary.main` (#6a1b9a purple), `error.main`, `warning.main` / `warning.dark`, `info.main`, `success.main`, `text.primary`, `text.secondary`, `text.disabled`, `divider`, `background.paper`, `action.hover`.
- Spacing: numbers are 8px units (`p: 2` = 16px, `gap: 1`). Radius: `shape.borderRadius` is 8 (`borderRadius: 2` = 16px).
- Type: `Typography` variants `h4`–`h6`, `subtitle2`, `body1`, `body2`, `caption`; headings usually get `fontWeight: 700`. Font stack is Inter → system sans.
- Defaults: Buttons have no elevation; Cards use `elevation={0}`, so pair them with `variant="outlined"` or `border: 1, borderColor: 'divider'`.
- Status colours: use `StatusChip` (case status), `TriggerChips` (triage triggers), `AutoWarningsBadge` (policy warnings) and `DeadlineLabel` (due dates) rather than hand-made chips. They carry the app's colour semantics and Swedish labels.

## Domain vocabulary

UI copy is **Swedish** by default (Översikt, Åtgärdslista, Patienter, Triagerade, Avbryt). Roles: PAL = patient-responsible physician; SSK = nurse. Personal numbers are Swedish personnummer (`19540312-8821`) — render them with `PersonalNumberCopy`. Enum values: case status `NEW | NEEDS_REVIEW | TRIAGED | FOLLOWING_UP | CLOSED`; roles `PATIENT | NURSE | DOCTOR | SECRETARY`.

## Where the truth lives

- `components/<group>/<Name>/<Name>.d.ts` — exact props, including enum unions; `<Name>.prompt.md` — verified example compositions.
- `guidelines/docs/user_stories.md` — who does what in the product (PAL dashboard, nurse triage, secretary worklist).

## Example screen body

```jsx
const { Card, CardContent, Grid, Stack, Typography, StatusChip } = window.DUK;
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 4 }}>
    <Card variant="outlined"><CardContent>
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">Behöver granskning</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>7</Typography>
        <Stack direction="row"><StatusChip status="NEEDS_REVIEW" /></Stack>
      </Stack>
    </CardContent></Card>
  </Grid>
</Grid>
```
