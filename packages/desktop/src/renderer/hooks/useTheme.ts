import { useMemo } from 'react'
import { buildTheme } from '@jotbunker/shared'
import { useSettingsStore } from '../stores/settingsStore'

export function useTheme() {
  const accentHue = useSettingsStore((s) => s.accentHue)
  const accentGrayscale = useSettingsStore((s) => s.accentGrayscale)
  return useMemo(() => {
    const theme = buildTheme(accentHue, accentGrayscale)
    return {
      ...theme,
      categoryStrip: {
        ...theme.categoryStrip,
        paddingVertical: 2,
        btnPaddingV: 0,
      },
    }
  }, [accentHue, accentGrayscale])
}
