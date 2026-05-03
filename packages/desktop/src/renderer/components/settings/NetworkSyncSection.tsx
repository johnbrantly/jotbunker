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
  styles: Record<string, any>
  colors: Record<string, any>
}

export default function NetworkSyncSection({
  selectedIp, setSelectedIp, portVal, setPortVal,
  interfaces, staleIpWarning, setStaleIpWarning, pairingSecret,
  styles, colors,
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
    </div>
  )
}
