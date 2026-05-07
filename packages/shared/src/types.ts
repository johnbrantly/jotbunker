// ─── Lists / Locked Lists ───

export interface ListItem {
  id: string; // uuid
  text: string;
  done: boolean;
  position: number; // sort order (lower = higher in list)
  slot: number; // category slot index (0-5)
  createdAt: number;
  updatedAt: number;
  // Optional so legacy persisted items (pre-Phase-2) and incoming wire
  // payloads without the field deserialise cleanly. addItem stamps
  // explicit defaults; truthy check `!item.deleted` reads undefined as live.
  deleted?: boolean;
  deletedAt?: number | null;
}

/** Category identity is its position in the array (slot 0-5). No string ID needed. */
export interface Category {
  label: string; // display name, user-editable
  section: 'lists' | 'lockedLists' | 'scratchpad';
  updatedAt: number;
}



