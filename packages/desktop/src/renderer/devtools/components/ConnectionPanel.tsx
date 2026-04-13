import React, { useState } from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'
import { virtualClient } from '../client/VirtualPhoneClient'
import { DEFAULT_SYNC_PORT } from '@jotbunker/shared'

function readDesktopSettings(): { port: number; secret: string } {
  try {
    const raw = localStorage.getItem('jotbunker-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      const state = parsed.state || parsed
      return {
        port: state.syncPort || DEFAULT_SYNC_PORT,
        secret: state.pairingSecret || '',
      }
    }
  } catch {}
  return { port: DEFAULT_SYNC_PORT, secret: '' }
}

export default function ConnectionPanel() {
  const connectionStatus = useWorkbenchStore((s) => s.connectionStatus)
  const defaults = readDesktopSettings()
  const [port, setPort] = useState(String(defaults.port))
  const [secret, setSecret] = useState(defaults.secret)

  const handleConnect = () => {
    const p = parseInt(port, 10)
    if (isNaN(p) || p < 1 || p > 65535) return
    virtualClient.connect(p, secret)
  }

  const handleDisconnect = () => {
    virtualClient.disconnect()
  }

  const statusColor =
    connectionStatus === 'connected'
      ? '#22c55e'
      : connectionStatus === 'connecting'
        ? '#eab308'
        : '#ef4444'

  return (
    <div style={{ maxWidth: 450 }}>
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16 }}>
        Connection
      </h2>

      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: statusColor,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
            {connectionStatus}
          </span>
        </div>

        <div
          style={{
            padding: 8,
            background: '#111',
            borderRadius: 4,
            border: '1px solid #2a2a2a',
            fontSize: 11,
            color: '#888',
            marginBottom: 12,
          }}
        >
          Connecting will replace any real phone connection. The virtual phone
          uses the same WebSocket server as a real device.
        </div>

        <label style={{ display: 'block', fontSize: 12, color: '#999', marginBottom: 4 }}>
          Port
        </label>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          disabled={connectionStatus !== 'disconnected'}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#e0e0e0',
            fontSize: 13,
            fontFamily: 'DMMono, monospace',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', fontSize: 12, color: '#999', marginBottom: 4 }}>
          Pairing Secret (auto-filled from desktop settings)
        </label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          disabled={connectionStatus !== 'disconnected'}
          placeholder="optional"
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#e0e0e0',
            fontSize: 13,
            fontFamily: 'DMMono, monospace',
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        {connectionStatus === 'disconnected' ? (
          <button onClick={handleConnect} style={btnStyle('#22c55e')}>
            Connect
          </button>
        ) : (
          <button onClick={handleDisconnect} style={btnStyle('#ef4444')}>
            Disconnect
          </button>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#666' }}>
        Device ID: <strong style={{ color: '#999' }}>Virtual Phone</strong>
        <br />
        Target: <strong style={{ color: '#999' }}>ws://127.0.0.1:{port}</strong>
      </div>
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '8px 20px',
    background: color,
    border: 'none',
    borderRadius: 4,
    color: '#000',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
