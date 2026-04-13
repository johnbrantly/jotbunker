import { describe, it, expect } from 'vitest'
import { buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from '../src/theme'

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/
const RGBA_PATTERN = /^rgba?\(\d+,\d+,\d+(?:,[\d.]+)?\)$/

function isValidColor(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return HEX_PATTERN.test(value) || RGBA_PATTERN.test(value)
}

describe('buildTheme', () => {
  it('buildTheme(0, 0) produces valid color values for all color keys', () => {
    const theme = buildTheme(0, 0)
    for (const [key, value] of Object.entries(theme.colors)) {
      expect(isValidColor(value), `colors.${key} = "${value}" is not valid hex/rgba`).toBe(true)
    }
  })

  it('buildTheme(360, 100) produces valid colors', () => {
    const theme = buildTheme(360, 100)
    for (const [key, value] of Object.entries(theme.colors)) {
      expect(isValidColor(value), `colors.${key} = "${value}" is not valid hex/rgba`).toBe(true)
    }
  })

  it('buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE) matches snapshot', () => {
    const theme = buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE)
    expect(theme.colors).toMatchSnapshot()
  })

  it('all color strings in the default theme match hex or rgba patterns', () => {
    const theme = buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE)

    // Check all nested objects for color-like string values
    function checkColors(obj: Record<string, unknown>, path: string) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba'))) {
          expect(isValidColor(value), `${path}.${key} = "${value}" is not valid`).toBe(true)
        }
      }
    }

    checkColors(theme.colors, 'colors')
    checkColors(theme.jotStrip as any, 'jotStrip')
    checkColors(theme.drawCanvas as any, 'drawCanvas')
    checkColors(theme.imageMode as any, 'imageMode')
    checkColors(theme.audioMode as any, 'audioMode')
    checkColors(theme.passwordGate as any, 'passwordGate')
    checkColors(theme.listView as any, 'listView')
    checkColors(theme.categoryStrip as any, 'categoryStrip')
    checkColors(theme.confirmDialog as any, 'confirmDialog')
    checkColors(theme.settingsPanel as any, 'settingsPanel')
  })
})
