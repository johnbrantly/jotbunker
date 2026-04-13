import type { CSSProperties } from 'react'

// Re-export everything from shared for convenience
export {
  colors,
  header,
  jotStrip,
  modeStrip,
  typeArea,
  drawCanvas,
  imageMode,
  audioMode,
  listView,
  categoryStrip,
  confirmDialog,
  settingsPanel,
  DEFAULT_HUE,
  DEFAULT_GRAYSCALE,
  buildTheme,
} from '@jotbunker/shared'
export type { Theme } from '@jotbunker/shared'

export {
  JOTS,
  JOT_COUNT,
  INPUT_MODES,
  MAX_CATEGORY_LABEL_LENGTH,
  MAX_ITEMS_PER_CATEGORY,
  DEFAULT_LISTS_CATEGORIES,
  DEFAULT_LOCKED_LISTS_CATEGORIES,
} from '@jotbunker/shared'

/**
 * Maps React Native font family names (e.g. 'DMSans-Bold')
 * to CSS fontFamily + fontWeight properties.
 */
const fontMap: Record<string, Pick<CSSProperties, 'fontFamily' | 'fontWeight'>> = {
  'DMSans-Light': { fontFamily: 'DMSans', fontWeight: 300 },
  'DMSans-Regular': { fontFamily: 'DMSans', fontWeight: 400 },
  'DMSans-Medium': { fontFamily: 'DMSans', fontWeight: 500 },
  'DMSans-Bold': { fontFamily: 'DMSans', fontWeight: 700 },
  'DMSans-Black': { fontFamily: 'DMSans', fontWeight: 900 },
  'DMMono-Light': { fontFamily: 'DMMono', fontWeight: 300 },
  'DMMono-Regular': { fontFamily: 'DMMono', fontWeight: 400 },
  'DMMono-Medium': { fontFamily: 'DMMono', fontWeight: 500 },
  'DMMono-Bold': { fontFamily: 'DMMono', fontWeight: 700 },
}

export function cssFont(rnFontFamily: string): Pick<CSSProperties, 'fontFamily' | 'fontWeight'> {
  return fontMap[rnFontFamily] ?? { fontFamily: 'DMSans', fontWeight: 400 }
}
