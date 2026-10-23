# design-sync notes (DUK)

## How this repo is synced
- DUK is an app, not a published library: no dist/, no .d.ts, no Storybook. The bundle is built from
  `.design-sync/entry.tsx` (passed as `--entry`), which re-exports the shared components
  (`src/components/common`, `src/components/layout`), `DukProvider` (`.design-sync/setup/DukProvider.tsx`),
  all of `@mui/material`, the app's icons (`.design-sync/icons.ts`) and `theme` (`src/theme.ts`).
- Scope chosen by the user (2026-09-26): shared components only. Domain folders (case, journey, worklist,
  patients, patientView, dashboard, policy, demo) are not synced yet. `MigrationErrorOverlay` is
  deliberately excluded (full-screen boot error overlay that clears storage).
- Build command (run from the repo root):
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/entry.tsx --out ./ds-bundle`
  Driver: `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/entry.tsx --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`
- Playwright: the cached chromium is build 1243, which is `playwright@1.63.0` - install that version into `.ds-sync/`.

## Gotchas
- Don't set `cfg.tsconfig`: the converter's tsconfig-paths plugin resolves `@/foo` to the *directory*
  `src/foo` (it `existsSync`s the bare stem before trying `/index.ts`), so esbuild fails with "is a directory".
  Without the key, esbuild's own tsconfig lookup resolves `@/*` correctly.
- There are no .d.ts files, so ts-morph extraction yields empty props. **All `<Name>Props` are hand-written in
  `cfg.dtsPropsFor`** - update them whenever a synced component's props change.
- `DukProvider` seeds the fake-auth session (`localStorage['duk.auth.fakeSession']`) before `RoleProvider`
  mounts. Without a session, `useRole()` throws in AppShell/TopBar/SideNav/GlobalSearch/RoleSwitcher.
  It skips its own MemoryRouter when already inside a router (the preview harness wraps every card in
  DukProvider, so nested DukProviders in previews must not create a second router).
- Group comes from the src folder name. That's why DukProvider lives in `.design-sync/setup/` (group `setup`).
  A docsMap `category` stub does NOT override a folder-derived group.
- Previews must import MUI from `duk-clinical-triage-demo` (shimmed to `window.DUK`), not `@mui/material`.
  A second MUI copy wouldn't see the theme.
- Fixed-position layout pieces (TopBar, SideNav) are contained in previews with a `transform: translateZ(0)` box.
  The SideNav card needs a viewport of at least 900px wide (MUI `md`), or the permanent drawer is display:none.
- Regenerate `.design-sync/icons.ts` when the app starts using new icons:
  `grep -rhoE "@mui/icons-material/[A-Za-z0-9]+" src --include=*.tsx --include=*.ts | sed 's#@mui/icons-material/##' | sort -u | while read n; do echo "export { default as ${n}Icon } from '@mui/icons-material/${n}'"; done`
  (keep the 2-line header comment).
- Guidelines: only `docs/user_stories.md` ships (`guidelinesGlob`). `docs/design.md` is architecture and links SVGs.

## Known render warns / static limits
- LanguageSwitcher, RoleSwitcher, GlobalSearch: menus and dialogs open only on click, so the cards show the
  icon buttons inside an AppBar. GlobalSearch's dialog also fetches patients from the in-memory store, which
  the bundle never initialises (the app does that in main.tsx).
- CareRoleIcon `fontSize` maps to CSS keywords (small/medium/large), so the size variants differ only slightly. That's real behaviour.
- DeadlineLabel previews compute dates relative to "now". The capture harness freezes the clock, so its dates look old.

## Re-sync risks
- `cfg.dtsPropsFor` is hand-maintained - it goes stale silently when component props change.
- `.design-sync/icons.ts` is a generated snapshot of the icons the app uses.
- `DukProvider` depends on `fakeAuthProvider`'s session key/shape and on `RoleProvider` reading it at mount.
  Swapping the auth provider (GrandID/SITHS/OIDC) breaks the preview session.
- The Inter font is named in the theme but never shipped by the app or the bundle; designs use the system fallback.
