import React from 'react'

interface Props {
  spFontSize: number
  setSpFontSize: (v: number) => void
  lsFontSize: number
  setLsFontSize: (v: number) => void
  tagFontSize: number
  setTagFontSize: (v: number) => void
  styles: Record<string, any>
  sp: Record<string, any>
}

export default function FontSizeSection({
  spFontSize, setSpFontSize, lsFontSize, setLsFontSize, tagFontSize, setTagFontSize,
  styles, sp,
}: Props) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>FONT SIZE</span>
      <div style={{ marginBottom: 10 }}>
        <span style={styles.fieldLabel}>SCRATCHPAD</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {([['S', 13], ['M', 16], ['L', 20]] as const).map(([label, size]) => (
            <button
              key={label}
              style={{
                ...styles.browseBtn,
                ...(spFontSize === size ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
              }}
              onClick={() => setSpFontSize(size)}
            >
              <span style={styles.browseText}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={styles.fieldLabel}>LISTS</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {([['S', 12], ['M', 15], ['L', 19]] as const).map(([label, size]) => (
            <button
              key={label}
              style={{
                ...styles.browseBtn,
                ...(lsFontSize === size ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
              }}
              onClick={() => setLsFontSize(size)}
            >
              <span style={styles.browseText}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={styles.fieldLabel}>TAGS</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {([['S', 9], ['M', 10], ['L', 12]] as const).map(([label, size]) => (
            <button
              key={label}
              style={{
                ...styles.browseBtn,
                ...(tagFontSize === size ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
              }}
              onClick={() => setTagFontSize(size)}
            >
              <span style={styles.browseText}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
