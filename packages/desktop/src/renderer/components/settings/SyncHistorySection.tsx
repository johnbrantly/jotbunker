import React from 'react'

interface Props {
  onOpenSyncLog: () => void
  styles: Record<string, any>
}

export default function SyncHistorySection({ onOpenSyncLog, styles }: Props) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>SYNC HISTORY</span>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <button style={styles.browseBtn} onClick={onOpenSyncLog}>
          <span style={styles.browseText}>VIEW SYNC HISTORY</span>
        </button>
      </div>
    </div>
  )
}
