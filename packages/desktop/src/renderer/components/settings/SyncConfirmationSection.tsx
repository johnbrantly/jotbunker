import React from 'react'

interface Props {
  syncConfirmationVal: boolean
  setSyncConfirmationVal: (v: boolean) => void
  onOpenSyncLog: () => void
  styles: Record<string, any>
  sp: Record<string, any>
}

export default function SyncConfirmationSection({
  syncConfirmationVal, setSyncConfirmationVal,
  onOpenSyncLog,
  styles, sp,
}: Props) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>SYNC CONFIRMATION</span>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
          <button
            key={label}
            style={{
              ...styles.browseBtn,
              ...(syncConfirmationVal === val ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
            }}
            onClick={() => setSyncConfirmationVal(val)}
          >
            <span style={styles.browseText}>{label}</span>
          </button>
        ))}
        <button
          style={{ ...styles.browseBtn, marginLeft: 8 }}
          onClick={onOpenSyncLog}
        >
          <span style={styles.browseText}>VIEW SYNC HISTORY</span>
        </button>
      </div>
    </div>
  )
}
