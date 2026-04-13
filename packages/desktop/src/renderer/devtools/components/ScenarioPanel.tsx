import React, { useRef } from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'
import { virtualClient } from '../client/VirtualPhoneClient'
import { useVirtualListsStore } from '../stores/virtualListsStore'
import { useVirtualLockedListsStore } from '../stores/virtualLockedListsStore'
import { useVirtualScratchpadStore } from '../stores/virtualScratchpadStore'
import { useVirtualJotsStore } from '../stores/virtualJotsStore'
import { scenarios } from '../scenarios'
import type { ScenarioContext } from '../scenarios'

function buildContext(): ScenarioContext {
  const { addScenarioLog } = useWorkbenchStore.getState()
  return {
    client: virtualClient,
    stores: {
      lists: useVirtualListsStore,
      lockedLists: useVirtualLockedListsStore,
      scratchpad: useVirtualScratchpadStore,
      jots: useVirtualJotsStore,
    },
    log: (message) => addScenarioLog(`[${new Date().toLocaleTimeString('en', { hour12: false })}] ${message}`),
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    waitForSync: () => new Promise((resolve) => setTimeout(resolve, 2000)),
  }
}

export default function ScenarioPanel() {
  const runningScenario = useWorkbenchStore((s) => s.runningScenario)
  const scenarioLog = useWorkbenchStore((s) => s.scenarioLog)
  const clearScenarioLog = useWorkbenchStore((s) => s.clearScenarioLog)
  const logEndRef = useRef<HTMLDivElement>(null)

  const runScenario = async (id: string) => {
    const scenario = scenarios.find((s) => s.id === id)
    if (!scenario || runningScenario) return

    const { setRunningScenario, clearScenarioLog: clear, addScenarioLog } =
      useWorkbenchStore.getState()
    clear()
    setRunningScenario(id)
    addScenarioLog(`=== Running: ${scenario.name} ===`)

    try {
      await scenario.execute(buildContext())
      addScenarioLog(`=== Complete ===`)
    } catch (err) {
      addScenarioLog(`=== ERROR: ${err} ===`)
    } finally {
      setRunningScenario(null)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
        Scenarios
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {scenarios.map((s) => (
          <div
            key={s.id}
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 6,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: '#e0e0e0',
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                marginBottom: 10,
                lineHeight: 1.4,
              }}
            >
              {s.description}
            </div>
            <button
              onClick={() => runScenario(s.id)}
              disabled={!!runningScenario}
              style={{
                padding: '5px 14px',
                background:
                  runningScenario === s.id
                    ? '#eab308'
                    : runningScenario
                      ? '#333'
                      : '#22c55e',
                border: 'none',
                borderRadius: 4,
                color: runningScenario && runningScenario !== s.id ? '#666' : '#000',
                fontSize: 11,
                fontWeight: 700,
                cursor: runningScenario ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {runningScenario === s.id ? 'Running...' : 'Run'}
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>
          Output
        </span>
        <button
          onClick={clearScenarioLog}
          style={{
            padding: '2px 10px',
            background: '#333',
            border: '1px solid #555',
            borderRadius: 4,
            color: '#ccc',
            fontSize: 10,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: 4,
          padding: 8,
          height: 200,
          overflow: 'auto',
          fontFamily: 'DMMono, monospace',
          fontSize: 11,
          color: '#999',
        }}
      >
        {scenarioLog.length === 0 ? (
          <span style={{ color: '#555' }}>Run a scenario to see output...</span>
        ) : (
          scenarioLog.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {line}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
