import React from 'react'
import { cssFont } from '../../styles/tokens'
import { DEFAULT_SYNC_PORT } from '@jotbunker/shared'
import QrPairingCode from './QrPairingCode'

interface Props {
  selectedIp: string
  setSelectedIp: (v: string) => void
  portVal: number
  setPortVal: (v: number) => void
  interfaces: { name: string; address: string }[]
  staleIpWarning: string
  setStaleIpWarning: (v: string) => void
  pairingSecret: string
  autoSyncEnabled?: boolean
  setAutoSyncEnabled?: (v: boolean) => void
  autoSyncDelaySec?: number
  setAutoSyncDelaySec?: (n: number) => void
  hideAutoSync?: boolean
  styles: Record<string, any>
  colors: Record<string, any>
  sp?: Record<string, any>
}

export default function NetworkSyncSection({
  selectedIp, setSelectedIp, portVal, setPortVal,
  interfaces, staleIpWarning, setStaleIpWarning, pairingSecret,
  autoSyncEnabled, setAutoSyncEnabled, autoSyncDelaySec, setAutoSyncDelaySec,
  hideAutoSync,
  styles, colors, sp,
}: Props) {
  return (
    <div style={styles.section}>
      <span style={styles.sectionLabel}>NETWORK SYNC</span>
      {staleIpWarning && (
        <span style={{ ...cssFont('DMSans-Bold'), fontSize: 10, color: '#f5a623', display: 'block', marginBottom: 8 }}>
          {staleIpWarning}
        </span>
      )}
      {interfaces.length > 0 && (
        <>
          <span style={styles.fieldLabel}>ADAPTER PHONE CONNECTS THROUGH</span>
          <div style={styles.inputRow}>
            <select
              style={{ ...styles.input, colorScheme: 'dark', fontSize: 13, padding: '8px 10px' }}
              value={selectedIp}
              onChange={(e) => {
                setSelectedIp(e.target.value)
                setStaleIpWarning('')
              }}
            >
              {!selectedIp && <option value="">— select adapter —</option>}
              {interfaces.map((iface) => (
                <option
                  key={iface.address}
                  value={iface.address}
                  style={{ backgroundColor: colors.dialogBg, color: colors.textPrimary, fontSize: 13 }}
                >
                  {iface.name} — {iface.address}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <span style={styles.fieldLabel}>PORT THIS COMPUTER LISTENS ON</span>
      <div style={styles.inputRow}>
        <input
          type="number"
          style={styles.input}
          value={portVal}
          onChange={(e) => setPortVal(Number(e.target.value) || DEFAULT_SYNC_PORT)}
          placeholder={String(DEFAULT_SYNC_PORT)}
          min={1}
          max={65535}
        />
      </div>
      {selectedIp && (
        <QrPairingCode
          ip={selectedIp}
          port={portVal || DEFAULT_SYNC_PORT}
          secret={pairingSecret}
          colors={colors}
        />
      )}
      {!hideAutoSync && sp && setAutoSyncEnabled && (
        <>
          <div style={styles.divider} />
          <span style={styles.sectionLabel}>AUTO SYNC</span>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: autoSyncEnabled ? 8 : 0 }}>
            {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
              <button
                key={label}
                style={{
                  ...styles.browseBtn,
                  ...(autoSyncEnabled === val ? { backgroundColor: sp.pillActiveBg, borderColor: sp.pillActiveBorder } : {}),
                }}
                onClick={() => setAutoSyncEnabled(val)}
              >
                <span style={styles.browseText}>{label}</span>
              </button>
            ))}
          </div>
          {autoSyncEnabled && setAutoSyncDelaySec && (
            <>
              <span style={styles.fieldLabel}>SYNC DELAY (SECONDS AFTER LAST EDIT)</span>
              <div style={styles.inputRow}>
                <input
                  type="number"
                  style={styles.input}
                  value={autoSyncDelaySec}
                  onChange={(e) => setAutoSyncDelaySec(Math.max(5, Number(e.target.value) || 30))}
                  min={5}
                  max={300}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
