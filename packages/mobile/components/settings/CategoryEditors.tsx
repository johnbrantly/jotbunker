import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View } from 'react-native';
import { MAX_CATEGORY_LABEL_LENGTH } from '@jotbunker/shared';
import * as LocalAuthentication from 'expo-local-authentication';
import { useScratchpadStore } from '../../stores/scratchpadStore';
import { useListsStore } from '../../stores/listsStore';
import { useLockedListsStore } from '../../stores/lockedListsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettingsStyles } from './useSettingsStyles';
import CategoryEditor from './CategoryEditor';

export interface CategoryEditorsSaveHandle {
  save: () => void;
}

interface Props {
  onCatFocus: () => void;
  onCatBlur: () => void;
}

export default forwardRef<CategoryEditorsSaveHandle, Props>(function CategoryEditors(
  { onCatFocus, onCatBlur },
  ref,
) {
  const { styles } = useSettingsStyles();

  const scratchpadCats = useScratchpadStore((s) => s.categories);
  const updateScratchpadCats = useScratchpadStore((s) => s.updateCategories);
  const listsCats = useListsStore((s) => s.categories);
  const updateListsCats = useListsStore((s) => s.updateCategories);
  const lockedListsCats = useLockedListsStore((s) => s.categories);
  const updateLockedListsCats = useLockedListsStore((s) => s.updateCategories);
  const lockedListsLockEnabled = useSettingsStore((s) => s.lockedListsLockEnabled);

  const [scratchpadVals, setScratchpadVals] = useState(scratchpadCats.map((c) => c.label));
  const [listsVals, setListsVals] = useState(listsCats.map((c) => c.label));
  const [lockedListsVals, setSecureVals] = useState(lockedListsCats.map((c) => c.label));

  useImperativeHandle(ref, () => ({
    save: () => {
      updateScratchpadCats(
        scratchpadCats.map((c, i) => {
          const newLabel = (scratchpadVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH);
          return newLabel !== c.label
            ? { ...c, label: newLabel, updatedAt: Date.now() }
            : c;
        }),
      );
      updateListsCats(
        listsCats.map((c, i) => {
          const newLabel = (listsVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH);
          return newLabel !== c.label
            ? { ...c, label: newLabel, updatedAt: Date.now() }
            : c;
        }),
      );
      updateLockedListsCats(
        lockedListsCats.map((c, i) => {
          const newLabel = (lockedListsVals[i]?.toUpperCase() || c.label).slice(0, MAX_CATEGORY_LABEL_LENGTH);
          return newLabel !== c.label
            ? { ...c, label: newLabel, updatedAt: Date.now() }
            : c;
        }),
      );
    },
  }), [scratchpadVals, listsVals, lockedListsVals, scratchpadCats, listsCats, lockedListsCats]);

  const handleLockedListsCatModify = useCallback(async (): Promise<boolean> => {
    if (!lockedListsLockEnabled) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to modify Locked Lists',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  }, [lockedListsLockEnabled]);

  return (
    <>
      <CategoryEditor
        label="SCRATCHPAD CATEGORIES"
        values={scratchpadVals}
        onChange={setScratchpadVals}
        onFocus={onCatFocus}
        onBlur={onCatBlur}
      />

      <View style={styles.divider} />

      <CategoryEditor
        label="LISTS CATEGORIES"
        values={listsVals}
        onChange={setListsVals}
        onFocus={onCatFocus}
        onBlur={onCatBlur}
      />

      <View style={styles.divider} />

      <CategoryEditor
        label="LOCKED LISTS CATEGORIES"
        values={lockedListsVals}
        onChange={setSecureVals}
        onFocus={onCatFocus}
        onBlur={onCatBlur}
        onModify={handleLockedListsCatModify}
      />
    </>
  );
});
