import React from 'react'
import { MAX_CATEGORY_LABEL_LENGTH } from '../../styles/tokens'

interface CategoryEditorProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  styles: {
    section: React.CSSProperties
    sectionLabel: React.CSSProperties
    inputRow: React.CSSProperties
    rowNum: React.CSSProperties
    input: React.CSSProperties
  }
}

export default function CategoryEditor({ label, values, onChange, styles }: CategoryEditorProps) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>{label}</span>
      {values.map((val, i) => (
        <div key={i} style={styles.inputRow}>
          <span style={styles.rowNum}>{i + 1}</span>
          <input
            style={styles.input}
            value={val}
            onChange={(e) => {
              const next = [...values]
              next[i] = e.target.value
              onChange(next)
            }}
            maxLength={MAX_CATEGORY_LABEL_LENGTH}
          />
        </div>
      ))}
    </div>
  )
}
