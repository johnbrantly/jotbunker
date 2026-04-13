import React from 'react'
import { buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from '../../styles/tokens'
import HueSlider from './HueSlider'
import GrayscaleSlider from './GrayscaleSlider'

interface Props {
  hueVal: number
  setHueVal: (v: number) => void
  gsVal: number
  setGsVal: (v: number) => void
  previewColor: string
  styles: Record<string, any>
  sp: Record<string, any>
}

export default function AccentColorSection({
  hueVal, setHueVal, gsVal, setGsVal, previewColor,
  styles, sp,
}: Props) {
  return (
    <div style={styles.section}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: sp.sectionLabelMarginBottom }}>
        <span style={styles.sectionLabel}>ACCENT COLOR</span>
        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: previewColor }} />
      </div>
      <HueSlider value={hueVal} onChange={setHueVal} styles={styles} />
      <div style={{ marginTop: 8 }}>
        <GrayscaleSlider value={gsVal} onChange={setGsVal} accentHue={hueVal} styles={styles} />
      </div>
      <button
        style={{ ...styles.browseBtn, marginTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onClick={() => { setHueVal(DEFAULT_HUE); setGsVal(DEFAULT_GRAYSCALE); }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE).colors.primary }} />
        <span style={styles.browseText}>RESTORE DEFAULT</span>
      </button>
    </div>
  )
}
