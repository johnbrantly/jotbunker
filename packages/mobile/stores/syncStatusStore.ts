import { create } from 'zustand';

export type DockState =
  | 'undocked'
  | 'docking'
  | 'docked';

interface SyncStatusState {
  dockState: DockState;
  setDockState: (s: DockState) => void;
  // Actions set by useSyncSetup
  dockFn: (() => void) | null;
  undockFn: (() => void) | null;
  setDockActions: (dock: () => void, undock: () => void) => void;
}

export const useSyncStatusStore = create<SyncStatusState>()((set) => ({
  dockState: 'undocked',
  setDockState: (s) => set({ dockState: s }),
  dockFn: null,
  undockFn: null,
  setDockActions: (dock, undock) => set({ dockFn: dock, undockFn: undock }),
}));
