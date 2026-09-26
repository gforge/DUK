import { createTheme } from '@mui/material'

/**
 * Design tokens from the DUK redesign (claude.ai/design: templates/duk-redesign).
 * Prefer these over ad-hoc hex values so screens share one colour semantics:
 * amber = clinical signal, grey = administrative, blue = selection/status, green = done.
 */
export const tokens = {
  bg: '#f7f8fa',
  paper: '#fff',
  border: '#e3e5e8',
  rowDivider: '#eceff1',
  headerBg: '#fafbfc',
  rowHover: '#f5f8ff',
  inputBorder: '#c4c7c5',
  text: '#1f1f1f',
  text2: '#3c4043',
  textSecondary: '#5f6368',
  textMuted: '#80868b',
  greyFill: '#f1f3f4',
  segmentBg: '#eceff1',
  switchOff: '#bdc1c6',
  primary: '#1565c0',
  primaryDark: '#0d47a1',
  selectedBg: '#e8f0fe',
  selectedCardBg: '#f0f5ff',
  danger: '#c62828',
  clinicalBg: '#fff4e5',
  clinicalFg: '#8a4b00',
  warningBg: '#ffe0b2',
  warningFg: '#7a3e00',
  warningPanelBg: '#fffaf2',
  infoBg: '#e3f2fd',
  infoFg: '#0d47a1',
  successBg: '#e8f5e9',
  successFg: '#1b5e20',
  errorBg: '#fdecea',
  errorFg: '#b71c1c',
  categoryAcute: '#d32f2f',
  categorySubacute: '#f9a825',
  categoryControl: '#78909c',
  /** Patient instructions (journey editor): accent border, row background, timeline bar. */
  instructionBorder: '#ce93d8',
  instructionBg: '#fbf7fc',
  instructionBar: '#f3e5f5',
  instructionAccent: '#ab47bc',
  instructionFg: '#6a1b9a',
  /** Answer-window band around a form step on the journey timeline. */
  windowBar: '#bbdefb',
} as const

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDark,
    },
    secondary: {
      main: '#6a1b9a',
    },
    background: {
      default: tokens.bg,
      paper: tokens.paper,
    },
    text: {
      primary: tokens.text,
      secondary: tokens.textSecondary,
    },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: tokens.border },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, minHeight: 44 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: tokens.paper },
        notchedOutline: { borderColor: tokens.inputBorder },
      },
    },
  },
})
