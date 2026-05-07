import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Device from 'expo-device';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import type {
  StateSync,
  MobileSyncPlatform,
  AncestorSnapshot,
} from '@jotbunker/shared';
import {
  SyncEngine,
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
import { useAncestorStore } from '../stores/ancestorStore';
import {
  buildJotManifest,
  buildJotMetadata,
  buildSingleJotMeta,
  handleDownloadRequest,
  handleClearRequest,
  handleFileRequest,
} from '../hooks/sync/jotHandlers';

const SYNC_TS_KEY = 'jotbunker-last-sync-ts';

/**
 * Phase 3: builds the ancestor snapshot from the current phone store state at
 * the moment of commit. Reads RAW items including tombstones; Phase 5's
 * three-way merge needs to know which items existed at last sync, including
 * those tombstoned at that point.
 */
function buildAncestorSnapshot(): AncestorSnapshot {
  const lists = useListsStore.getState();
  const lockedLists = useLockedListsStore.getState();
  const scratchpad = useScratchpadStore.getState();
  return {
    lists: lists.items,
    lockedLists: lockedLists.items,
    listsCategories: lists.categories,
    lockedListsCategories: lockedLists.categories,
    scratchpad: scratchpad.contents,
    scratchpadCategories: scratchpad.categories,
  };
}

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

      // Phase 5.5: prefer the merged snapshot if the (post-cutover) sender
      // included one. Falls back to the old mode-driven wholesale-replace
      // path for backward compat with pre-cutover senders.
      const mergedSnapshot = (msg as { snapshot?: typeof ss }).snapshot;
      if (mergedSnapshot) {
        useListsStore.setState({
          items: mergedSnapshot.lists,
          categories: mergedSnapshot.listsCategories,
        });
        useLockedListsStore.setState({
          items: mergedSnapshot.lockedLists,
          categories: mergedSnapshot.lockedListsCategories,
        });
        useScratchpadStore.setState({
          contents: mergedSnapshot.scratchpad,
          categories: mergedSnapshot.scratchpadCategories,
        });
        lastSyncTimestamp = Date.now();
        AsyncStorage.setItem(SYNC_TS_KEY, lastSyncTimestamp.toString());
        const ancestorSnap = buildAncestorSnapshot();
        useAncestorStore.getState().commit(ancestorSnap);
        useListsStore.getState().gcTombstonesAgainst(ancestorSnap.lists);
        useLockedListsStore.getState().gcTombstonesAgainst(ancestorSnap.lockedLists);
        return;
      }

      // ── Backward-compat path (pre-cutover sender) ──

      if (msg.mode === 'phone-wins') {
        // Phone keeps its state; nothing to do.
        lastSyncTimestamp = Date.now();
        AsyncStorage.setItem(SYNC_TS_KEY, lastSyncTimestamp.toString());
        // Phase 3: commit ancestor of the (unchanged) post-sync state.
        const snapshot = buildAncestorSnapshot();
        useAncestorStore.getState().commit(snapshot);
        // Phase 5 tombstone GC.
        useListsStore.getState().gcTombstonesAgainst(snapshot.lists);
        useLockedListsStore.getState().gcTombstonesAgainst(snapshot.lockedLists);
        return;
      }

      // desktop-wins: replace phone state entirely with desktop's data.
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
      // Phase 3: commit ancestor of the post-replace state.
      const snapshot = buildAncestorSnapshot();
      useAncestorStore.getState().commit(snapshot);
      // Phase 5 tombstone GC.
      useListsStore.getState().gcTombstonesAgainst(snapshot.lists);
      useLockedListsStore.getState().gcTombstonesAgainst(snapshot.lockedLists);
    },

    buildHandshake(lastSyncTs) {
      return {
        type: 'handshake' as const,
        deviceId,
        lastSyncTimestamp: lastSyncTs,
        pairingSecret: useSettingsStore.getState().syncPairingSecret,
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
            'Please check that JotBunker is running on your computer and that the network is available.',
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

    // Create engine if needed (load lastSyncTimestamp first). User taps the
    // Connect control to dock; we no longer auto-connect on launch.
    if (!engineRef.current) {
      AsyncStorage.getItem(SYNC_TS_KEY).then((rawTs) => {
        if (!transportRef.current) return;
        const initialTs = rawTs ? parseInt(rawTs, 10) : 0;
        const platform = buildMobilePlatform(transportRef.current, initialTs);
        engineRef.current = new SyncEngine(transportRef.current, platform);
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

  // Background/foreground: disconnect on background, release keep-awake.
  // Foreground does NOT auto-reconnect; user taps Connect when ready.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const { dockState } = useSyncStatusStore.getState();
      if (nextState === 'background' || nextState === 'inactive') {
        deactivateKeepAwake('sync').catch(() => {});
        if (dockState === 'docked' || dockState === 'docking') {
          engineRef.current?.disconnect();
          useSyncStatusStore.getState().setDockState('undocked');
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
