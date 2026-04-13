import React from 'react'

interface SyncStatusSectionProps {
  connected: boolean
  phoneDeviceId: string | null
  downloadStatus: string | null
  binarySyncStatus: string | null
  styles: {
    header: React.CSSProperties
    statusRow: React.CSSProperties
    statusDot: React.CSSProperties
    statusText: React.CSSProperties
    infoRow: React.CSSProperties
    infoLabel: React.CSSProperties
    infoValue: React.CSSProperties
    downloadStatus: React.CSSProperties
  }
  colors: { destructive: string }
}

export default function SyncStatusSection({
  connected,
  phoneDeviceId,
  downloadStatus,
  binarySyncStatus,
  styles,
  colors,
}: SyncStatusSectionProps) {
  return (
    <>
      <span style={styles.header}>SYNC</span>

      <div style={styles.statusRow}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: connected ? '#22c55e' : colors.destructive,
            opacity: connected ? 1 : 0.5,
          }}
        />
        <span style={styles.statusText}>
          {connected ? 'CONNECTED' : 'NOT CONNECTED'}
        </span>
      </div>

      {connected && phoneDeviceId && (
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>PHONE</span>
          <span style={styles.infoValue}>{phoneDeviceId}</span>
        </div>
      )}

      {downloadStatus && (
        <span style={styles.downloadStatus}>{downloadStatus}</span>
      )}
      {binarySyncStatus && (
        <span style={styles.downloadStatus}>{binarySyncStatus}</span>
      )}
    </>
  )
}
