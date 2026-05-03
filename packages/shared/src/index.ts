// Types
export type {
  ListItem,
  Category,
} from './types';

// Constants
export {
  APP_VERSION,
  JOT_COUNT,
  JOTS,
  CATEGORY_COUNT,
  MAX_ITEMS_PER_CATEGORY,
  MAX_CATEGORY_LABEL_LENGTH,
  LOCKED_LISTS_LOCK_OPTIONS,
  DEFAULT_LOCKED_LISTS_LOCK_MS,
  DEFAULT_SYNC_PORT,
  INPUT_MODES,
  DEFAULT_LISTS_CATEGORIES,
  DEFAULT_SCRATCHPAD_CATEGORIES,
  DEFAULT_LOCKED_LISTS_CATEGORIES,
} from './constants';
export type { InputModeId } from './constants';

// Design tokens
export {
  colors,
  fonts,
  fontWeights,
  spacing,
  header,
  jotStrip,
  modeStrip,
  typeArea,
  drawCanvas,
  imageMode,
  audioMode,
  passwordGate,
  listView,
  categoryStrip,
  confirmDialog,
  settingsPanel,
} from './tokens';

// Theme builder
export {
  DEFAULT_HUE,
  DEFAULT_GRAYSCALE,
  buildTheme,
} from './theme';
export type { Theme } from './theme';

// Sync protocol — wire message types
export type {
  SyncMessageType,
  KeyInit,
  Handshake,
  StateSync,
  JotDownloadRequest,
  JotDownloadResponse,
  JotClearRequest,
  JotClearAck,
  JotManifest,
  JotPayload,
  ImagePayload,
  SyncWireMessage,
  KeyExchangeMessage,
  FileRequest,
  FileResponse,
  ImageMeta,
  AudioMeta,
  FileMeta,
  JotMeta,
  AudioPayload,
  FilePayload,
  JotRefreshRequest,
  JotRefreshResponse,
  JotMetaRequest,
  JotMetaResponse,
  DebugLogMessage,
  SyncConfirm,
  SyncConfirmMode,
  SyncCancel,
} from './sync/protocol';

// Sync protocol — functions
export {
  parseMessage,
} from './sync/protocol';

// Sync report
export { computeSyncReport, formatSyncReport } from './sync/syncReport';
export type {
  MergeStores,
  SyncReport,
  SyncSideReport,
  SyncReportCategoryChange,
  SyncReportSlotChanges,
  SyncReportItemAdded,
  SyncReportItemDeleted,
  SyncReportItemModified,
  SyncReportItemChecked,
  SyncReportItemReordered,
  SyncReportScratchpadChange,
} from './sync/syncReport';

// Store slice factories
export { createItemSlice } from './stores/createItemSlice';
export type { StoreItem, ItemSliceState, ItemSliceConfig } from './stores/createItemSlice';

// Sync debug logging
export { syncLog, setSyncLogEnabled, setSyncLogSink } from './sync/syncLog';

// Sync engine
export { SyncEngine } from './sync/SyncEngine';
export type {
  SyncPhase,
  ConnectionStatus as SyncConnectionStatus,
  SyncPlatformCore,
  MobilePlatformHandlers,
  DesktopPlatformHandlers,
  MobileSyncPlatform,
  DesktopSyncPlatform,
  SyncEngineOptions,
} from './sync/SyncEngine';

// Sync transport interface
export type { SyncTransport, DesktopConnectionState } from './sync/SyncTransport';

// Base64 encoding helpers
export {
  uint8ToBase64,
  base64ToUint8,
} from './encoding';
