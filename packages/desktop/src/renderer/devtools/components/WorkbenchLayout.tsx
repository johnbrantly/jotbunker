import React from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'
import type { ActivePanel } from '../stores/workbenchStore'
import ConnectionPanel from './ConnectionPanel'
import StoresPanel from './StoresPanel'
import ComparisonPanel from './ComparisonPanel'
import ScenarioPanel from './ScenarioPanel'
import WireLogPanel from './WireLogPanel'

const PANELS: { id: ActivePanel; label: string }[] = [
  { id: 'connection', label: 'Connect' },
  { id: 'stores', label: 'Stores' },
  { id: 'comparison', label: 'Compare' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'wirelog', label: 'Wire Log' },
]

function PanelContent({ panel }: { panel: ActivePanel }) {
  switch (panel) {
    case 'connection':
      return <ConnectionPanel />
    case 'stores':
      return <StoresPanel />
    case 'comparison':
      return <ComparisonPanel />
    case 'scenarios':
      return <ScenarioPanel />
    case 'wirelog':
      return <WireLogPanel />
  }
}

export default function WorkbenchLayout() {
  const activePanel = useWorkbenchStore((s) => s.activePanel)
  const setActivePanel = useWorkbenchStore((s) => s.setActivePanel)
  const connectionStatus = useWorkbenchStore((s) => s.connectionStatus)

  const statusColor =
    connectionStatus === 'connected'
      ? '#22c55e'
      : connectionStatus === 'connecting'
        ? '#eab308'
        : '#666'

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '6px 12px',
          borderBottom: '1px solid #222',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: statusColor,
            marginRight: 8,
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 13, marginRight: 16 }}>
          Sync Workbench
        </span>
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            style={{
              background:
                activePanel === p.id ? '#333' : 'transparent',
              border: '1px solid',
              borderColor: activePanel === p.id ? '#555' : 'transparent',
              color: activePanel === p.id ? '#fff' : '#999',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <PanelContent panel={activePanel} />
      </div>
    </>
  )
}
