import { buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from './theme';

// Default theme — generated from DEFAULT_HUE / DEFAULT_GRAYSCALE.
// Components should use useTheme() instead of importing these directly.
const _default = buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE);

// ─── Colors ───

export const colors = _default.colors;

// ─── Typography ───

export const fonts = {
  sans: 'DMSans',
  mono: 'DMMono',
} as const;

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
  black: '900',
} as const;

// ─── Spacing ───

export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 10,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
  screenPadding: 24,
} as const;

// ─── Notes Header ───

export const header = {
  padding: { top: 10, horizontal: 24 },
  headerLabelSize: 12,
  headerLabelLetterSpacing: 0.14,
  headerNumberSize: 36,
  headerNumberLineHeight: 1.1,
  clearBtnBg: 'rgba(232,64,64,0.08)',
  clearBtnBorder: 'rgba(232,64,64,0.15)',
  clearBtnColor: 'rgba(232,64,64,0.5)',
  clearBtnPaddingV: 6,
  clearBtnPaddingH: 12,
  clearBtnRadius: 6,
  clearBtnFontSize: 10,
  clearBtnLetterSpacing: 0.08,
  clearBtnMarginBottom: 6,
  dividerHeight: 1,
  dividerMarginTop: 10,
} as const;

// ─── Jot Strip ───

export const jotStrip = _default.jotStrip;

// ─── Mode Strip ───

export const modeStrip = _default.modeStrip;

// ─── Type Area ───

export const typeArea = {
  fontSize: 16,
  lineHeight: 1.7,
  paddingV: 20,
  paddingH: 24,
  placeholder: 'tap to jot something down...',
} as const;

// ─── Draw Canvas ───

export const drawCanvas = _default.drawCanvas;

// ─── Image Mode ───

export const imageMode = _default.imageMode;

// ─── Audio Mode ───

export const audioMode = _default.audioMode;

// ─── Password Gate ───

export const passwordGate = _default.passwordGate;

// ─── List View ───

export const listView = _default.listView;

// ─── Category Strip ───

export const categoryStrip = _default.categoryStrip;

// ─── Confirm Dialog ───

export const confirmDialog = _default.confirmDialog;

// ─── Settings Panel ───

export const settingsPanel = _default.settingsPanel;
