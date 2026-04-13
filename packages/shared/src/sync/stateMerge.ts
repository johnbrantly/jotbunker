import type { ListItem, Category } from '../types';
import type { StateSync } from './protocol';
import { CATEGORY_COUNT } from '../constants';
import { mergeItems, mergeCategories } from './merge';
import { syncLog } from './syncLog';

/**
 * Stores to be merged — abstraction over platform-specific stores.
 * Items and scratchpad contents are fixed 6-slot arrays.
 */
export interface MergeStores {
  lists: {
    items: ListItem[][];
    categories: Category[];
  };
  lockedLists: {
    items: ListItem[][];
    categories: Category[];
  };
  scratchpad: {
    contents: { content: string; updatedAt: number }[];
    categories: Category[];
  };
}

/**
 * Merge a remote state_sync message into local state.
 * Fixed 6-slot model: per-slot LWW for categories and scratchpad, per-item LWW for list items.
 */
export function mergeStateSync(
  local: MergeStores,
  remote: StateSync,
  localSince?: number,
): MergeStores {
  const result = { ...local };

  // Per-section: if a side has only default categories (all updatedAt=0),
  // its lastSyncTimestamp is unreliable — override to 0 so deletion
  // detection is disabled for that side.
  const effectiveSince = (localCats: Category[], remoteCats: Category[]) => {
    const localHasReal = localCats.some((c) => c.updatedAt > 0);
    const remoteHasReal = remoteCats.some((c) => c.updatedAt > 0);
    const effLocal = localHasReal ? localSince : undefined;
    const effRemote = remoteHasReal ? remote.since : 0;
    if (effLocal !== localSince || effRemote !== remote.since) {
      syncLog('MERGE', `since override: localSince ${localSince}→${effLocal ?? 0} remoteSince ${remote.since}→${effRemote}`);
    }
    return { effLocal, effRemote };
  };

  // Merge lists
  const listsSince = effectiveSince(local.lists.categories, remote.listsCategories);
  result.lists = {
    items: mergeItems(local.lists.items, remote.lists, listsSince.effRemote, listsSince.effLocal),
    categories: mergeCategories(local.lists.categories, remote.listsCategories),
  };

  // Merge lockedLists
  const lockedListsSince = effectiveSince(local.lockedLists.categories, remote.lockedListsCategories);
  result.lockedLists = {
    items: mergeItems(local.lockedLists.items, remote.lockedLists, lockedListsSince.effRemote, lockedListsSince.effLocal),
    categories: mergeCategories(local.lockedLists.categories, remote.lockedListsCategories),
  };

  // Merge scratchpad (last-write-wins per slot)
  if (remote.scratchpad) {
    const merged = [...local.scratchpad.contents];
    for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
      const remoteSp = remote.scratchpad[slot];
      if (!remoteSp) continue;
      const localSp = merged[slot];
      const winner = !localSp || remoteSp.updatedAt > localSp.updatedAt ? 'remote' : 'local';
      syncLog('MERGE', `scratchpad[${slot}]: local=${localSp?.updatedAt ?? 'none'} remote=${remoteSp.updatedAt} → ${winner}`);
      if (winner === 'remote') {
        merged[slot] = remoteSp;
      }
    }
    result.scratchpad = {
      contents: merged,
      categories: remote.scratchpadCategories
        ? mergeCategories(local.scratchpad.categories, remote.scratchpadCategories)
        : local.scratchpad.categories,
    };
  }

  return result;
}
