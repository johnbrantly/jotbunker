import React from 'react'

const RAINBOW_GRADIENT = Array.from({ length: 13 }, (_, i) => {
  const h = i * 30
  return `hsl(${h}, 80%, 55%) ${((h / 360) * 100).toFixed(1)}%`
}).join(', ')

interface HueSliderProps {
  value: number
  onChange: (hue: number) => void
  styles: {
    sliderWrapper: React.CSSProperties
  }
}

export default function HueSlider({ value, onChange, styles }: HueSliderProps) {
  return (
    <div style={styles.sliderWrapper}>
      <input
        type="range"
        min={0}
        max={360}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hue-slider"
        style={{ width: '100%' }}
      />
    </div>
  )
}
