export const APP_VERSION = '1.0.3';

export const JOT_COUNT = 6;
export const JOTS = [1, 2, 3, 4, 5, 6] as const;

export const CATEGORY_COUNT = 6;
export const MAX_ITEMS_PER_CATEGORY = 100;
export const MAX_CATEGORY_LABEL_LENGTH = 10;
export const LOCKED_LISTS_LOCK_OPTIONS = [
  { label: '30 SEC', ms: 30_000 },
  { label: '1 MIN', ms: 60_000 },
  { label: '5 MIN', ms: 300_000 },
  { label: '10 MIN', ms: 600_000 },
] as const;
export const DEFAULT_LOCKED_LISTS_LOCK_MS = 30_000;
export const DEFAULT_SYNC_PORT = 8080;

export const INPUT_MODES = [
  { id: 'type', label: 'TEXT', icon: '⌨\uFE0E' },
  { id: 'draw', label: 'DRAW', icon: '✎\uFE0E' },
  { id: 'image', label: 'IMAGE', icon: '◻\uFE0E' },
  { id: 'file', label: 'FILE', icon: '📎\uFE0E' },
  { id: 'audio', label: 'AUDIO', icon: '♫\uFE0E' },
] as const;

export type InputModeId = (typeof INPUT_MODES)[number]['id'];

export const DEFAULT_LISTS_CATEGORIES = [
  { label: 'ASAP', section: 'lists' as const, updatedAt: 0 },
  { label: 'TODO', section: 'lists' as const, updatedAt: 0 },
  { label: 'WORK', section: 'lists' as const, updatedAt: 0 },
  { label: 'HOME', section: 'lists' as const, updatedAt: 0 },
  { label: 'SHOP', section: 'lists' as const, updatedAt: 0 },
  { label: 'TEMP', section: 'lists' as const, updatedAt: 0 },
];

export const DEFAULT_SCRATCHPAD_CATEGORIES = [
  { label: 'CLIENT', section: 'scratchpad' as const, updatedAt: 0 },
  { label: 'SCHOOL', section: 'scratchpad' as const, updatedAt: 0 },
  { label: 'CREATE', section: 'scratchpad' as const, updatedAt: 0 },
  { label: 'DREAM', section: 'scratchpad' as const, updatedAt: 0 },
  { label: 'TEMP', section: 'scratchpad' as const, updatedAt: 0 },
  { label: 'CUSTOM', section: 'scratchpad' as const, updatedAt: 0 },
];

export const DEFAULT_LOCKED_LISTS_CATEGORIES = [
  { label: 'NAMES', section: 'lockedLists' as const, updatedAt: 0 },
  { label: 'PLACES', section: 'lockedLists' as const, updatedAt: 0 },
  { label: 'LEGAL', section: 'lockedLists' as const, updatedAt: 0 },
  { label: 'LOGINS', section: 'lockedLists' as const, updatedAt: 0 },
  { label: 'CRATE', section: 'lockedLists' as const, updatedAt: 0 },
  { label: 'CUSTOM', section: 'lockedLists' as const, updatedAt: 0 },
];
