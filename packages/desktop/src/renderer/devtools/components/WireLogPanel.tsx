import React, { useState } from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'

export default function WireLogPanel() {
  const wireLog = useWorkbenchStore((s) => s.wireLog)
  const clearWireLog = useWorkbenchStore((s) => s.clearWireLog)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 16, margin: 0 }}>Wire Log</h2>
        <button
          onClick={clearWireLog}
          style={{
            padding: '4px 12px',
            background: '#333',
            border: '1px solid #555',
            borderRadius: 4,
            color: '#ccc',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Clear
        </button>
      </div>

      {wireLog.length === 0 ? (
        <div style={{ color: '#666', fontSize: 13 }}>
          No messages yet. Connect to start capturing.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {wireLog.map((entry) => (
            <div key={entry.id}>
              <div
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  background: expandedId === entry.id ? '#1a1a1a' : 'transparent',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'DMMono, monospace',
                }}
              >
                <span style={{ color: '#666', width: 70, flexShrink: 0 }}>
                  {new Date(entry.timestamp).toLocaleTimeString('en', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span
                  style={{
                    color: entry.direction === 'send' ? '#60a5fa' : '#34d399',
                    width: 16,
                    flexShrink: 0,
                    textAlign: 'center',
                  }}
                >
                  {entry.direction === 'send' ? '\u2192' : '\u2190'}
                </span>
                <span
                  style={{
                    color: '#e0e0e0',
                    fontWeight: 600,
                    width: 140,
                    flexShrink: 0,
                  }}
                >
                  {entry.messageType}
                </span>
                <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.summary}
                </span>
              </div>
              {expandedId === entry.id && (
                <pre
                  style={{
                    margin: '2px 0 6px 0',
                    padding: 8,
                    background: '#111',
                    border: '1px solid #222',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#999',
                    overflow: 'auto',
                    maxHeight: 300,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {JSON.stringify(entry.raw, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
