import type { ListItem, Category } from '../types';
import { CATEGORY_COUNT } from '../constants';
import { syncLog } from './syncLog';

// Grace window for clock-skew protection in deletion detection (ms)
// Both devices are on the same LAN with NTP-synced clocks — minimal skew.
const CLOCK_SKEW_GRACE = 500;

function wasDeletedByPeer(peerSince: number | undefined, entityTimestamp: number): boolean {
  return peerSince != null && peerSince > entityTimestamp + CLOCK_SKEW_GRACE;
}

/**
 * Merge items from remote state_sync into local state.
 * Both sides have CATEGORY_COUNT (6) slots. Per-slot LWW merge on items.
 */
export function mergeItems(
  localItems: ListItem[][],
  remoteItems: ListItem[][],
  remoteSince: number,
  localSince?: number,
): ListItem[][] {
  const merged: ListItem[][] = [];

  for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
    const local = localItems[slot] || [];
    const remote = remoteItems[slot] || [];
    syncLog('MERGE', `items[${slot}]: local=${local.length} remote=${remote.length}`);

    const localMap = new Map(local.map((item) => [item.id, item]));
    const remoteMap = new Map(remote.map((item) => [item.id, item]));

    const result: ListItem[] = [];
    const seen = new Set<string>();
    let addedCount = 0;
    let conflictCount = 0;
    let deletedCount = 0;

    // Process all remote items
    for (const remoteItem of remote) {
      seen.add(remoteItem.id);
      const localItem = localMap.get(remoteItem.id);

      if (!localItem) {
        if (wasDeletedByPeer(localSince, remoteItem.createdAt)) {
          syncLog('MERGE', `  local-deleted id=${remoteItem.id} (localSince=${localSince} > createdAt=${remoteItem.createdAt})`);
          deletedCount++;
        } else {
          result.push(remoteItem);
          addedCount++;
        }
      } else {
        if (remoteItem.updatedAt > localItem.updatedAt) {
          syncLog('MERGE', `  conflict id=${remoteItem.id}: local=${localItem.updatedAt} remote=${remoteItem.updatedAt} → remote`);
          result.push(remoteItem);
          conflictCount++;
        } else {
          result.push(localItem);
          if (remoteItem.updatedAt < localItem.updatedAt) {
            syncLog('MERGE', `  conflict id=${remoteItem.id}: local=${localItem.updatedAt} remote=${remoteItem.updatedAt} → local`);
            conflictCount++;
          }
        }
      }
    }

    // Process local-only items
    for (const localItem of local) {
      if (seen.has(localItem.id)) continue;
      if (wasDeletedByPeer(remoteSince, localItem.createdAt)) {
        syncLog('MERGE', `  deleted id=${localItem.id} (remoteSince=${remoteSince} > createdAt=${localItem.createdAt})`);
        deletedCount++;
      } else {
        result.push(localItem);
      }
    }

    result.sort((a, b) => a.position - b.position);
    merged[slot] = result.map((item, i) => ({ ...item, position: i }));
    syncLog('MERGE', `items[${slot}]: result=${merged[slot].length} (added=${addedCount} conflicts=${conflictCount} deleted=${deletedCount})`);
  }

  return merged;
}

/**
 * Merge categories: fixed 6 slots, per-slot LWW by updatedAt.
 * If one side has defaults (updatedAt=0) and the other has real data, real data wins.
 */
export function mergeCategories(
  local: Category[],
  remote: Category[],
): Category[] {
  syncLog('MERGE', `categories: local=${local.length} remote=${remote.length}`);
  const result: Category[] = [];

  for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
    const l = local[slot];
    const r = remote[slot];
    if (!r) { result.push(l || { label: '', section: 'lists', updatedAt: 0 }); continue; }
    if (!l) { result.push(r); continue; }

    if (r.updatedAt > l.updatedAt) {
      syncLog('MERGE', `  slot ${slot}: local=${l.updatedAt} remote=${r.updatedAt} → remote (${r.label})`);
      result.push(r);
    } else {
      if (r.updatedAt < l.updatedAt) {
        syncLog('MERGE', `  slot ${slot}: local=${l.updatedAt} remote=${r.updatedAt} → local (${l.label})`);
      }
      result.push(l);
    }
  }

  syncLog('MERGE', `categories: result=${result.length}`);
  return result;
}
