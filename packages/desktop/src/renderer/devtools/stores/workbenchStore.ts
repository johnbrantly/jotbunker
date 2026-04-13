import { create } from 'zustand'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'
export type ActivePanel = 'connection' | 'stores' | 'comparison' | 'scenarios' | 'wirelog'

export interface WireLogEntry {
  id: number
  timestamp: number
  direction: 'send' | 'recv'
  messageType: string
  summary: string
  raw: unknown
}

interface WorkbenchState {
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void
  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void
  wireLog: WireLogEntry[]
  addWireLogEntry: (entry: Omit<WireLogEntry, 'id'>) => void
  clearWireLog: () => void
  runningScenario: string | null
  setRunningScenario: (id: string | null) => void
  scenarioLog: string[]
  addScenarioLog: (message: string) => void
  clearScenarioLog: () => void
  desktopSnapshot: {
    lists: Record<string, unknown[]>
    lockedLists: Record<string, unknown[]>
    scratchpad: Record<string, { content: string; updatedAt: number }>
  } | null
  setDesktopSnapshot: (snapshot: WorkbenchState['desktopSnapshot']) => void
}

let nextLogId = 1

export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  activePanel: 'connection',
  setActivePanel: (panel) => set({ activePanel: panel }),
  wireLog: [],
  addWireLogEntry: (entry) =>
    set((state) => ({
      wireLog: [{ ...entry, id: nextLogId++ }, ...state.wireLog].slice(0, 500),
    })),
  clearWireLog: () => set({ wireLog: [] }),
  runningScenario: null,
  setRunningScenario: (id) => set({ runningScenario: id }),
  scenarioLog: [],
  addScenarioLog: (message) =>
    set((state) => ({ scenarioLog: [...state.scenarioLog, message] })),
  clearScenarioLog: () => set({ scenarioLog: [] }),
  desktopSnapshot: null,
  setDesktopSnapshot: (snapshot) => set({ desktopSnapshot: snapshot }),
}))
