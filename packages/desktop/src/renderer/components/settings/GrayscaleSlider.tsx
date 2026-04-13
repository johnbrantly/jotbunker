import React from 'react'
import { buildTheme } from '@jotbunker/shared'

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p2 = 2 * l - q2
  return [
    Math.round(hue2rgb(p2, q2, h + 1/3) * 255),
    Math.round(hue2rgb(p2, q2, h) * 255),
    Math.round(hue2rgb(p2, q2, h - 1/3) * 255),
  ]
}

interface GrayscaleSliderProps {
  value: number
  onChange: (gs: number) => void
  accentHue: number
  styles: {
    sliderWrapper: React.CSSProperties
  }
}

export default function GrayscaleSlider({ value, onChange, accentHue, styles }: GrayscaleSliderProps) {
  const colorLeft = buildTheme(accentHue, 0).colors.primary
  const grayRight = toHex(...hslToRgb(0, 0, 75))
  const gradient = `linear-gradient(to right, ${colorLeft} 0%, ${grayRight} 100%)`

  return (
    <div style={styles.sliderWrapper}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="grayscale-slider"
        style={{ width: '100%', background: gradient }}
      />
    </div>
  )
}
