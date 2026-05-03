import type { ListItem, Category } from '../types';
import { syncLog } from './syncLog';

// ── Notes sync metadata types ──

export interface ImageMeta {
  id: string;
  format: string;
  createdAt: number;
}

export interface AudioMeta {
  id: string;
  duration: number;
  format: string;
  createdAt: number;
}

export interface FileMeta {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface JotMeta {
  id: number;
  text: string;
  drawing: string | null; // JSON string of SVG paths (sent directly, not as file)
  images: ImageMeta[];
  recordings: AudioMeta[];
  files: FileMeta[];
  textUpdatedAt: number;
  drawingUpdatedAt: number;
}

// ── Wire message types (discriminated union) ──

export type SyncMessageType =
  | 'handshake'
  | 'state_sync'
  | 'jot_download_request'
  | 'jot_download_response'
  | 'jot_clear_request'
  | 'jot_clear_ack'
  | 'jot_manifest'
  | 'file_request'
  | 'file_response'
  | 'key_init'
  | 'key_exchange'
  | 'jot_refresh_request'
  | 'jot_refresh_response'
  | 'jot_meta_request'
  | 'jot_meta_response'
  | 'heartbeat'
  | 'debug_log'
  | 'sync_confirm'
  | 'sync_cancel';

export interface KeyInit {
  type: 'key_init';
  publicKey: string; // phone's ephemeral X25519 public key (base64)
}

export interface Handshake {
  type: 'handshake';
  deviceId: string;
  lastSyncTimestamp: number;
  pairingSecret: string;
}

export interface StateSync {
  type: 'state_sync';
  lists: ListItem[][];
  lockedLists: ListItem[][];
  listsCategories: Category[];
  lockedListsCategories: Category[];
  since: number;
  notes?: { jots: JotMeta[] };
  scratchpad?: { content: string; updatedAt: number }[];
  scratchpadCategories?: Category[];
  jotTexts?: Record<number, { text: string; textUpdatedAt: number }>;
}

export interface JotDownloadRequest {
  type: 'jot_download_request';
  jotIds: number[];
}

export interface ImagePayload {
  id: string;
  data: string; // base64
  format: string;
}

export interface AudioPayload {
  id: string;
  data: string; // base64
  format: string;
  duration: number;
}

export interface FilePayload {
  id: string;
  data: string; // base64
  fileName: string;
  mimeType: string;
  size: number;
}

export interface JotPayload {
  id: number;
  text: string;
  drawing: string | null; // base64 PNG
  images: ImagePayload[];
  recordings: AudioPayload[];
  files: FilePayload[];
}

export interface JotDownloadResponse {
  type: 'jot_download_response';
  jots: JotPayload[];
}

export interface JotClearRequest {
  type: 'jot_clear_request';
  jotIds: number[];
}

export interface JotClearAck {
  type: 'jot_clear_ack';
  cleared: number[];
}

export interface JotManifest {
  type: 'jot_manifest';
  jots: {
    id: number;
    hasText: boolean;
    hasDrawing: boolean;
    imageIds: string[];
    audioIds: string[];
    fileIds: string[];
  }[];
}

export interface FileRequest {
  type: 'file_request';
  jotId: number;
  fileId: string;
  fileType: 'image' | 'audio' | 'file';
}

export interface FileResponse {
  type: 'file_response';
  jotId: number;
  fileId: string;
  fileType: 'image' | 'audio' | 'file';
  data: string; // base64
  format: string;
  error?: string;
}

export interface KeyExchangeMessage {
  type: 'key_exchange';
  publicKey: string; // desktop's ephemeral X25519 public key (base64)
}

export interface JotRefreshRequest {
  type: 'jot_refresh_request';
}

export interface JotRefreshResponse {
  type: 'jot_refresh_response';
  jots: JotMeta[];
}

export interface JotMetaRequest {
  type: 'jot_meta_request';
  jotId: number;
}

export interface JotMetaResponse {
  type: 'jot_meta_response';
  jot: JotMeta;
}

export interface Heartbeat {
  type: 'heartbeat';
}

export interface DebugLogMessage {
  type: 'debug_log';
  lines: string[];
}

export type SyncConfirmMode = 'desktop-wins' | 'phone-wins';

export interface SyncConfirm {
  type: 'sync_confirm';
  mode: SyncConfirmMode;
}

export interface SyncCancel {
  type: 'sync_cancel';
}

export type SyncWireMessage =
  | KeyInit
  | Handshake
  | StateSync
  | JotDownloadRequest
  | JotDownloadResponse
  | JotClearRequest
  | JotClearAck
  | JotManifest
  | FileRequest
  | FileResponse
  | KeyExchangeMessage
  | JotRefreshRequest
  | JotRefreshResponse
  | JotMetaRequest
  | JotMetaResponse
  | Heartbeat
  | DebugLogMessage
  | SyncConfirm
  | SyncCancel;

// ── Helpers ──

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number';
const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const MESSAGE_VALIDATORS: Record<SyncMessageType, (m: Record<string, unknown>) => boolean> = {
  key_init:              (m) => isStr(m.publicKey),
  key_exchange:          (m) => isStr(m.publicKey),
  handshake:             (m) => isStr(m.deviceId) && isNum(m.lastSyncTimestamp) && isStr(m.pairingSecret),
  heartbeat:             ()  => true,
  jot_download_request:  (m) => isArr(m.jotIds),
  jot_download_response: (m) => isArr(m.jots),
  jot_clear_request:     (m) => isArr(m.jotIds),
  jot_clear_ack:         (m) => isArr(m.cleared),
  jot_refresh_request:   ()  => true,
  jot_refresh_response:  (m) => isArr(m.jots),
  file_request:          (m) => isNum(m.jotId) && isStr(m.fileId) && isStr(m.fileType),
  file_response:         (m) => isNum(m.jotId) && isStr(m.fileId) && isStr(m.fileType) && isStr(m.data) && isStr(m.format),
  jot_meta_request:      (m) => isNum(m.jotId),
  jot_meta_response:     (m) => isObj(m.jot) && isNum((m.jot as Record<string, unknown>).id),
  jot_manifest:          (m) => isArr(m.jots),
  debug_log:             (m) => isArr(m.lines),
  sync_confirm:          (m) => isStr(m.mode) && ['desktop-wins', 'phone-wins'].includes(m.mode as string),
  sync_cancel:           ()  => true,
  state_sync:            (m) => isArr(m.lists) && isArr(m.lockedLists) && isArr(m.listsCategories) && isArr(m.lockedListsCategories) && isNum(m.since),
};

const VALID_TYPES: Set<string> = new Set<SyncMessageType>([
  'handshake',
  'state_sync',
  'jot_download_request',
  'jot_download_response',
  'jot_clear_request',
  'jot_clear_ack',
  'jot_manifest',
  'file_request',
  'file_response',
  'key_init',
  'key_exchange',
  'jot_refresh_request',
  'jot_refresh_response',
  'jot_meta_request',
  'jot_meta_response',
  'heartbeat',
  'debug_log',
  'sync_confirm',
  'sync_cancel',
]);

export function parseMessage(raw: string): SyncWireMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (!msg || typeof msg.type !== 'string' || !VALID_TYPES.has(msg.type)) {
      return null;
    }
    const validate = MESSAGE_VALIDATORS[msg.type as SyncMessageType];
    if (!validate(msg)) {
      syncLog('PROTO', `field validation failed for "${msg.type}"`, raw.slice(0, 200));
      return null;
    }
    return msg as SyncWireMessage;
  } catch {
    return null;
  }
}

