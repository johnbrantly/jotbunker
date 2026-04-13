import React from 'react'

interface Props {
  debugLogVal: boolean
  setDebugLogVal: (v: boolean) => void
  styles: Record<string, any>
  sp: Record<string, any>
}

export default function DebugLoggingSection({
  debugLogVal, setDebugLogVal,
  styles, sp,
}: Props) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>DEBUG LOGGING</span>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
          <button
            key={label}
            style={{
              ...styles.browseBtn,
              ...(debugLogVal === val ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
            }}
            onClick={() => setDebugLogVal(val)}
          >
            <span style={styles.browseText}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
