// ─── Theme Builder ───

export const DEFAULT_HUE = 205;
export const DEFAULT_GRAYSCALE = 75;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function _rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

export function buildTheme(hue: number, grayscale: number = 0) {
  const g = grayscale / 100;
  const [pR, pG, pB] = hslToRgb(hue, 60 * (1 - g), 49 + 26 * g);
  const primaryHex = toHex(pR, pG, pB);
  const textPrimaryHex = toHex(...hslToRgb(hue, 41 * (1 - g), 85));

  const c = {
    background: '#0a0a0a',
    primary: primaryHex,
    textPrimary: textPrimaryHex,
    textSecondary: _rgba(pR, pG, pB, 0.5),
    textDim: _rgba(pR, pG, pB, 0.25),
    textUltraDim: _rgba(pR, pG, pB, 0.18),
    destructive: '#e84040',
    border: _rgba(pR, pG, pB, 0.08),
    borderLight: _rgba(pR, pG, pB, 0.06),
    borderUltraLight: _rgba(pR, pG, pB, 0.04),
    navBg: primaryHex,
    navActiveText: '#0a0a0a',
    navInactiveText: 'rgba(10,10,10,0.35)',
    navGearColor: 'rgba(10,10,10,0.3)',
    dialogBg: '#161614',
    dialogBorder: _rgba(pR, pG, pB, 0.15),
    stripBg: _rgba(pR, pG, pB, 0.03),
    inputRowBg: _rgba(pR, pG, pB, 0.02),
    checkboxBg: _rgba(pR, pG, pB, 0.05),
    checkboxBorder: _rgba(pR, pG, pB, 0.25),
    checkboxCheckedBg: _rgba(pR, pG, pB, 0.2),
    checkboxCheckedBorder: _rgba(pR, pG, pB, 0.5),
    dragHandle: _rgba(pR, pG, pB, 0.15),
    deleteInvisible: 'rgba(232,64,64,0.0)',
    deleteVisible: 'rgba(232,64,64,0.4)',
    deleteHover: 'rgba(232,64,64,0.8)',
    accentFocus: _rgba(pR, pG, pB, 0.4),
    trayBorder: _rgba(pR, pG, pB, 0.22),
    trayBorderBright: _rgba(pR, pG, pB, 0.45),
    trayGradientTop: _rgba(pR, pG, pB, 0.04),
    trayGradientBottom: _rgba(pR, pG, pB, 0.15),
    success: '#4ade80',
    successDark: '#052e16',
    warning: '#facc15',
    info: '#60a5fa',
    iconDefault: '#94a3b8',
  };

  return {
    colors: c,

    jotStrip: {
      paddingVertical: 6, innerPaddingHorizontal: 8, btnGap: 3, btnPadding: 6,
      circleSize: 44, circleBorderWidth: 1.5,
      circleBorderColor: _rgba(pR, pG, pB, 0.15),
      numberFontSize: 14,
      numberInactiveColor: _rgba(pR, pG, pB, 0.35),
      dotSize: 4,
      dotColor: _rgba(pR, pG, pB, 0.4),
      dotMarginTop: 1,
    },

    modeStrip: {
      height: 44, gap: 6, fontSize: 10, letterSpacing: 0.1,
      iconFontSize: 14, indicatorWidth: 20, indicatorHeight: 2,
      dotSize: 4,
      dotColor: _rgba(pR, pG, pB, 0.4),
      dotMarginTop: 1,
    },

    drawCanvas: {
      strokeColor: primaryHex,
      strokeWidth: 2.5, clearBtnTop: 16, clearBtnRight: 16,
      clearBtnBg: _rgba(pR, pG, pB, 0.15),
      clearBtnBorder: _rgba(pR, pG, pB, 0.3),
      clearBtnPaddingV: 6, clearBtnPaddingH: 14, clearBtnRadius: 4,
      clearBtnFontSize: 11, clearBtnLetterSpacing: 0.08,
      hintBottom: 16,
      hintColor: _rgba(pR, pG, pB, 0.25),
      hintFontSize: 12, hintLetterSpacing: 0.1,
    },

    imageMode: {
      padding: 16, emptyGap: 20, addBtnSize: 80, addBtnRadius: 12,
      addBtnBorder: _rgba(pR, pG, pB, 0.3),
      addBtnBg: _rgba(pR, pG, pB, 0.05),
      addBtnIconSize: 32,
      addBtnIconColor: _rgba(pR, pG, pB, 0.4),
      labelFontSize: 11, labelLetterSpacing: 0.12,
      labelColor: _rgba(pR, pG, pB, 0.3),
      gridCols: 3, gridGap: 8, thumbRadius: 8,
      thumbBorder: _rgba(pR, pG, pB, 0.15),
      gridAddBorder: _rgba(pR, pG, pB, 0.2),
      gridAddIconSize: 24,
      gridAddIconColor: _rgba(pR, pG, pB, 0.3),
    },

    audioMode: {
      gap: 32, timerFontSize: 42, timerLetterSpacing: 0.05,
      timerIdleColor: _rgba(pR, pG, pB, 0.3),
      btnSize: 72, btnBorderWidth: 3,
      btnIdleBg: _rgba(pR, pG, pB, 0.08),
      btnRecordingBg: 'rgba(232,64,64,0.15)',
      innerIdleSize: 28, innerRecordingSize: 24, innerRecordingRadius: 4,
      labelFontSize: 11, labelLetterSpacing: 0.12,
      labelColor: _rgba(pR, pG, pB, 0.3),
      waveBarCount: 24, waveBarWidth: 3, waveBarRadius: 2,
      waveBarGap: 3, waveBarHeight: 40, waveBarOpacity: 0.6,
    },

    passwordGate: {
      paddingHorizontal: 40, lockSize: 56,
      lockBg: _rgba(pR, pG, pB, 0.06),
      lockBorder: _rgba(pR, pG, pB, 0.15),
      lockBorderWidth: 1.5, lockIconSize: 22, lockMarginBottom: 20,
      titleFontSize: 13, titleLetterSpacing: 0.14, titleMarginBottom: 8,
      descFontSize: 12,
      descColor: _rgba(pR, pG, pB, 0.25),
      descMarginBottom: 32,
      errorFontSize: 11, errorLetterSpacing: 0.08, errorMarginBottom: 4,
      unlockMarginTop: 24, unlockPaddingV: 10, unlockPaddingH: 40, unlockRadius: 8,
      unlockEnabledBg: _rgba(pR, pG, pB, 0.15),
      unlockEnabledBorder: _rgba(pR, pG, pB, 0.3),
      unlockFontSize: 12, unlockLetterSpacing: 0.1,
    },

    listView: {
      inputPadding: { top: 10, right: 24, bottom: 10, left: 46 },
      inputFontSize: 15, inputPlaceholder: 'add item...',
      rowPadding: { top: 12, right: 24, bottom: 12, left: 16 },
      rowGap: 10, dragHandleFontSize: 14, dragHandleLetterSpacing: -1,
      checkboxSize: 24, checkboxRadius: 4, checkboxBorderWidth: 2,
      checkmarkSize: 11, textFontSize: 15, textLineHeight: 1.4,
      textDoneColor: _rgba(pR, pG, pB, 0.2),
      deleteFontSize: 18, deletePaddingH: 4,
      emptyRowHeight: 49, emptyRowCount: 6,
      encryptedBadgeFontSize: 9, encryptedBadgeLetterSpacing: 0.1,
      encryptedBadgeColor: _rgba(pR, pG, pB, 0.2),
      encryptedBadgeBg: _rgba(pR, pG, pB, 0.05),
      encryptedBadgePaddingV: 3, encryptedBadgePaddingH: 8, encryptedBadgeRadius: 4,
      encryptedBadgeBorder: _rgba(pR, pG, pB, 0.08),
    },

    categoryStrip: {
      paddingVertical: 8, innerPaddingHorizontal: 4,
      btnGap: 3, btnPaddingV: 4, btnPaddingH: 2,
      pillPaddingV: 8, pillPaddingH: 10, pillRadius: 20, pillBorderWidth: 1.5,
      pillBorderColor: _rgba(pR, pG, pB, 0.15),
      labelFontSize: 10, labelLetterSpacing: 0.06,
      labelInactiveColor: _rgba(pR, pG, pB, 0.35),
      countFontSize: 10,
      countColor: _rgba(pR, pG, pB, 0.35),
      countMarginTop: 1,
    },

    confirmDialog: {
      overlayBg: 'rgba(0,0,0,0.7)', blurAmount: 8,
      boxWidth: 280, boxRadius: 16, boxPaddingV: 28, boxPaddingH: 24, boxGap: 20,
      iconSize: 48, iconBg: 'rgba(232,64,64,0.1)', iconBorderWidth: 1.5,
      iconBorderColor: 'rgba(232,64,64,0.25)', iconFontSize: 20,
      titleFontSize: 15, titleLetterSpacing: 0.02,
      msgFontSize: 13,
      msgColor: _rgba(pR, pG, pB, 0.4),
      msgMarginTop: 8, msgLineHeight: 1.5,
      btnGap: 10, btnPaddingV: 12, btnRadius: 8,
      cancelBg: _rgba(pR, pG, pB, 0.08),
      cancelBorder: _rgba(pR, pG, pB, 0.12),
      confirmBg: 'rgba(232,64,64,0.15)',
      confirmBorder: 'rgba(232,64,64,0.3)',
      successIconBg: 'rgba(74,222,128,0.1)',
      successIconBorderColor: 'rgba(74,222,128,0.25)',
      successConfirmBg: 'rgba(74,222,128,0.15)',
      successConfirmBorder: 'rgba(74,222,128,0.3)',
      btnFontSize: 12, btnLetterSpacing: 0.08,
    },

    settingsPanel: {
      boxWidth: 310, maxHeight: 600, titleMarginBottom: 20,
      sectionLabelFontSize: 10, sectionLabelLetterSpacing: 0.12,
      sectionLabelColor: _rgba(pR, pG, pB, 0.4),
      sectionLabelMarginBottom: 10,
      rowGap: 10, rowMarginBottom: 8, rowNumWidth: 16, rowNumFontSize: 11,
      rowNumColor: _rgba(pR, pG, pB, 0.3),
      inputBg: _rgba(pR, pG, pB, 0.05),
      inputBorder: _rgba(pR, pG, pB, 0.12),
      inputRadius: 6, inputPaddingV: 8, inputPaddingH: 10,
      inputFontSize: 13, inputLetterSpacing: 0.06,
      inputFocusBorder: _rgba(pR, pG, pB, 0.3),
      inputFocusBg: _rgba(pR, pG, pB, 0.08),
      saveBg: _rgba(pR, pG, pB, 0.15),
      saveBorder: _rgba(pR, pG, pB, 0.3),
      pillRowGap: 8, pillPaddingV: 8, pillPaddingH: 14, pillRadius: 20,
      pillBg: _rgba(pR, pG, pB, 0.05),
      pillBorder: _rgba(pR, pG, pB, 0.12),
      pillActiveBg: _rgba(pR, pG, pB, 0.15),
      pillActiveBorder: _rgba(pR, pG, pB, 0.4),
      pillFontSize: 10, pillLetterSpacing: 0.08,
    },
  };
}

export type Theme = ReturnType<typeof buildTheme>;
