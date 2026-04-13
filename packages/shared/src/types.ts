// ─── Lists / Locked Lists ───

export interface ListItem {
  id: string; // uuid
  text: string;
  done: boolean;
  position: number; // sort order (lower = higher in list)
  slot: number; // category slot index (0-5)
  createdAt: number;
  updatedAt: number;
}

/** Category identity is its position in the array (slot 0-5). No string ID needed. */
export interface Category {
  label: string; // display name, user-editable
  section: 'lists' | 'lockedLists' | 'scratchpad';
  updatedAt: number;
}



