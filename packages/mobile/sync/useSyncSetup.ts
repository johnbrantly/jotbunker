import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Device from 'expo-device';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import type {
  SyncWireMessage,
  StateSync,
  SyncConfirm,
  MobileSyncPlatform,
} from '@jotbunker/shared';
import {
  SyncEngine,
  mergeStateSync,
  CATEGORY_COUNT,
  setSyncLogEnabled,
  setSyncLogSink,
} from '@jotbunker/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileTransport } from './MobileTransport';
import { useListsStore } from '../stores/listsStore';
import { useLockedListsStore } from '../stores/lockedListsStore';
import { useScratchpadStore } from '../stores/scratchpadStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSyncStatusStore } from '../stores/syncStatusStore';
import { useJotsStore } from '../stores/jotsStore';
import {
  buildJotManifest,
  buildJotMetadata,
  buildSingleJotMeta,
  handleDownloadRequest,
  handleClearRequest,
  handleFileRequest,
} from '../hooks/sync/jotHandlers';

const SYNC_TS_KEY = 'jotbunker-last-sync-ts';

function buildMobilePlatform(
  transport: MobileTransport,
  initialLastSyncTs: number,
): MobileSyncPlatform {
  const deviceId = Device.modelName || 'phone';
  let lastSyncTimestamp = initialLastSyncTs;
  // Saved desktop state_sync — held until sync_confirm arrives
  let pendingDesktopState: StateSync | null = null;
  let keepAwakeTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    deviceId,

    getLastSyncTimestamp() {
      return lastSyncTimestamp;
    },

    async setLastSyncTimestamp(ts: number) {
      lastSyncTimestamp = ts;
      await AsyncStorage.setItem(SYNC_TS_KEY, ts.toString());
    },

    async handleDownloadRequest(msg, send) {
      await handleDownloadRequest(msg, send);
    },

    handleClearRequest(msg, send) {
      handleClearRequest(msg, send);
      send(buildJotManifest());
    },

    async handleFileRequest(msg, send) {
      await handleFileRequest(msg, send);
    },

    handleJotMetaRequest(msg, send) {
      const jot = buildSingleJotMeta(msg.jotId);
      if (jot) {
        send({ type: 'jot_meta_response', jot });
      }
    },

    handleJotRefreshRequest(send) {
      send({ type: 'jot_refresh_response', jots: buildJotMetadata() });
      send(buildJotManifest());
    },

    async handleStateSync(ss, send) {
      // Save desktop's state for later — don't merge yet, wait for sync_confirm
      pendingDesktopState = ss;

      // Send phone's PRE-merge state back to desktop
      const scratchpadState = useScratchpadStore.getState();
      send({
        type: 'state_sync',
        lists: useListsStore.getState().items,
        lockedLists: useLockedListsStore.getState().items,
        listsCategories: useListsStore.getState().categories,
        lockedListsCategories: useLockedListsStore.getState().categories,
        since: lastSyncTimestamp,
        scratchpad: scratchpadState.contents,
        scratchpadCategories: scratchpadState.categories,
      });
    },

    handleSyncCancel() {
      pendingDesktopState = null;
    },

    handleSyncConfirm(msg, send) {
      if (!pendingDesktopState) return;
      const ss = pendingDesktopState;
      pendingDesktopState = null;

      if (msg.mode === 'phone-wins') {
        // Phone keeps its state — nothing to do
        lastSyncTimestamp = Date.now();
        AsyncStorage.setItem(SYNC_TS_KEY, lastSyncTimestamp.toString());
        return;
      }

      if (msg.mode === 'desktop-wins') {
        // Replace phone state entirely with desktop's data
        useListsStore.setState({ items: ss.lists, categories: ss.listsCategories });
        useLockedListsStore.setState({ items: ss.lockedLists, categories: ss.lockedListsCategories });
        if (ss.scratchpad) {
          useScratchpadStore.setState({ contents: ss.scratchpad });
        }
        if (ss.scratchpadCategories) {
          useScratchpadStore.setState({ categories: ss.scratchpadCategories });
        }
        lastSyncTimestamp = Date.now();
        AsyncStorage.setItem(SYNC_TS_KEY, lastSyncTimestamp.toString());
        return;
      }

      // mode === 'merge' — apply desktop's merged result directly (avoids independent re-merge divergence)
      if (msg.mergedState) {
        const ms = msg.mergedState;
        useListsStore.setState({ items: ms.lists, categories: ms.listsCategories });
        useLockedListsStore.setState({ items: ms.lockedLists, categories: ms.lockedListsCategories });
        if (ms.scratchpad) {
          useScratchpadStore.setState({ contents: ms.scratchpad });
        }
        if (ms.scratchpadCategories) {
          useScratchpadStore.setState({ categories: ms.scratchpadCategories });
        }
      } else {
        // Fallback: independent merge
        const merged = mergeStateSync(
          {
            lists: {
              items: useListsStore.getState().items,
              categories: useListsStore.getState().categories,
            },
            lockedLists: {
              items: useLockedListsStore.getState().items,
              categories: useLockedListsStore.getState().categories,
            },
            scratchpad: {
              contents: useScratchpadStore.getState().contents,
              categories: useScratchpadStore.getState().categories,
            },
          },
          ss,
          lastSyncTimestamp,
        );
        useListsStore.setState({ items: merged.lists.items, categories: merged.lists.categories });
        useLockedListsStore.setState({ items: merged.lockedLists.items, categories: merged.lockedLists.categories });
        useScratchpadStore.setState({ contents: merged.scratchpad.contents, categories: merged.scratchpad.categories });
      }

      lastSyncTimestamp = Date.now();
      AsyncStorage.setItem(SYNC_TS_KEY, lastSyncTimestamp.toString());
    },

    buildHandshake(lastSyncTs) {
      return {
        type: 'handshake' as const,
        deviceId,
        lastSyncTimestamp: lastSyncTs,
        pairingSecret: useSettingsStore.getState().syncPairingSecret,
        autoSync: useSettingsStore.getState().autoSyncOnConnect,
      };
    },

    onLive() {
      transport.send(buildJotManifest());
    },

    onConnectionStatusChange(status) {
      const { dockState, setDockState } = useSyncStatusStore.getState();
      if (status === 'connected') {
        setDockState('docked');
        // Keep-awake: activate if enabled
        const settings = useSettingsStore.getState();
        if (settings.keepAwakeEnabled) {
          activateKeepAwakeAsync('sync').catch(() => {});
          if (keepAwakeTimer) clearTimeout(keepAwakeTimer);
          if (!settings.keepAwakeAlways) {
            keepAwakeTimer = setTimeout(() => {
              deactivateKeepAwake('sync').catch(() => {});
              keepAwakeTimer = null;
            }, settings.keepAwakeMinutes * 60_000);
          }
        }
      } else if (status === 'unreachable') {
        pendingDesktopState = null;
        // Keep-awake: deactivate on disconnect
        deactivateKeepAwake('sync').catch(() => {});
        if (keepAwakeTimer) { clearTimeout(keepAwakeTimer); keepAwakeTimer = null; }
        if (dockState === 'docking') {
          Alert.alert(
            'Could Not Connect to Computer',
            'Please check that Jotbunker is running on your computer and that the network is available.',
          );
        }
        setDockState('undocked');
      }
    },
  };
}

export function useSyncSetup(): void {
  const syncServerIp = useSettingsStore((s) => s.syncServerIp);
  const syncPort = useSettingsStore((s) => s.syncPort);
  const syncPairingSecret = useSettingsStore((s) => s.syncPairingSecret);
  const debugLog = useSettingsStore((s) => s.debugLog);

  setSyncLogEnabled(debugLog);

  const engineRef = useRef<SyncEngine | null>(null);
  const transportRef = useRef<MobileTransport | null>(null);

  // Debug log sink
  useEffect(() => {
    if (!debugLog) {
      setSyncLogSink(null);
      return;
    }
    const buffer: string[] = [];
    setSyncLogSink((line) => buffer.push(line));
    const timer = setInterval(() => {
      if (buffer.length === 0) return;
      const lines = buffer.splice(0);
      transportRef.current?.send({ type: 'debug_log', lines });
    }, 200);
    return () => {
      setSyncLogSink(null);
      clearInterval(timer);
    };
  }, [debugLog]);

  // Initialize transport and engine
  useEffect(() => {
    if (!syncServerIp || !syncPairingSecret) {
      useSyncStatusStore.getState().setDockState('undocked');
      return;
    }

    // Create or update transport
    if (!transportRef.current) {
      transportRef.current = new MobileTransport(syncServerIp, syncPort, syncPairingSecret);
    } else {
      transportRef.current.updateConfig(syncServerIp, syncPort, syncPairingSecret);
    }

    // Create engine if needed (load lastSyncTimestamp first)
    if (!engineRef.current) {
      AsyncStorage.getItem(SYNC_TS_KEY).then((rawTs) => {
        if (!transportRef.current) return;
        const initialTs = rawTs ? parseInt(rawTs, 10) : 0;
        const platform = buildMobilePlatform(transportRef.current, initialTs);
        engineRef.current = new SyncEngine(transportRef.current, platform);

        // Auto-connect on initial launch (AppState listener only catches foreground resume)
        const settings = useSettingsStore.getState();
        if (settings.autoConnectOnOpen && settings.syncPairingSecret && settings.syncServerIp) {
          useSyncStatusStore.getState().setDockState('docking');
          engineRef.current.connect();
        }
      });
    }

    // Push jot manifest to desktop when jot content changes
    let manifestTimer: ReturnType<typeof setTimeout> | null = null;
    let prevJots = useJotsStore.getState().jots;
    const unsubJots = useJotsStore.subscribe((state) => {
      if (state.jots === prevJots) return;
      prevJots = state.jots;
      if (manifestTimer) clearTimeout(manifestTimer);
      manifestTimer = setTimeout(() => {
        if (engineRef.current?.currentPhase === 'docked' && transportRef.current) {
          transportRef.current.send(buildJotManifest());
        }
      }, 1000);
    });

    return () => {
      if (manifestTimer) clearTimeout(manifestTimer);
      unsubJots();
      engineRef.current?.disconnect();
      useSyncStatusStore.getState().setDockState('undocked');
    };
  }, [syncServerIp, syncPort, syncPairingSecret]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Background/foreground: disconnect on background, auto-connect on foreground if enabled
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const { dockState } = useSyncStatusStore.getState();
      if (nextState === 'background' || nextState === 'inactive') {
        deactivateKeepAwake('sync').catch(() => {});
        if (dockState === 'docked' || dockState === 'docking') {
          engineRef.current?.disconnect();
          useSyncStatusStore.getState().setDockState('undocked');
        }
      } else if (nextState === 'active') {
        const settings = useSettingsStore.getState();
        if (settings.autoConnectOnOpen && settings.syncPairingSecret && settings.syncServerIp && dockState === 'undocked') {
          useSyncStatusStore.getState().setDockState('docking');
          engineRef.current?.connect();
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Register dock/undock actions in store so TopChrome can call them
  useEffect(() => {
    const dock = () => {
      const { dockState } = useSyncStatusStore.getState();
      if (dockState !== 'undocked') return;
      useSyncStatusStore.getState().setDockState('docking');
      engineRef.current?.connect();
    };

    const undock = () => {
      engineRef.current?.disconnect();
      useSyncStatusStore.getState().setDockState('undocked');
    };

    useSyncStatusStore.getState().setDockActions(dock, undock);
    return () => {
      useSyncStatusStore.getState().setDockActions(null as any, null as any);
    };
  }, []);
}
