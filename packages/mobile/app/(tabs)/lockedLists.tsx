import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLockedListsStore } from '../../stores/lockedListsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '../../hooks/useTheme';
import AuthGate from '../../components/AuthGate';
import ListView from '../../components/ListView';

export default function LockedListsScreen() {
  const { colors } = useTheme();
  const lockedListsLockEnabled = useSettingsStore((s) => s.lockedListsLockEnabled);
  const isUnlocked = useLockedListsStore((s) => s.isUnlocked);
  const unlock = useLockedListsStore((s) => s.unlock);
  const items = useLockedListsStore((s) => s.items);
  const categories = useLockedListsStore((s) => s.categories);
  const activeSlot = useLockedListsStore((s) => s.activeSlot);
  const setActiveSlot = useLockedListsStore((s) => s.setActiveSlot);
  const addItem = useLockedListsStore((s) => s.addItem);
  const toggleItem = useLockedListsStore((s) => s.toggleItem);
  const deleteItem = useLockedListsStore((s) => s.deleteItem);
  const updateItemText = useLockedListsStore((s) => s.updateItemText);
  const reorderItems = useLockedListsStore((s) => s.reorderItems);
  const getUncheckedCount = useLockedListsStore((s) => s.getUncheckedCount);

  const rehydrateLockedLists = useCallback(
    () => useLockedListsStore.persist.rehydrate(),
    [],
  );

  const currentItems = items[activeSlot] || [];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  if (lockedListsLockEnabled && !isUnlocked) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <AuthGate
          onUnlock={unlock}
          promptMessage="Authenticate to view LOCKED LISTS"
          title="LOCKED LISTS"
          description="Authenticate to access locked list data"
          authenticateOnFocus
          onAuthenticated={rehydrateLockedLists}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ListView
        sectionLabel="LOCKED LISTS"
        isLocked
        lockEnabled={lockedListsLockEnabled}
        categories={categories}
        activeSlot={activeSlot}
        items={currentItems}
        onSelectCategory={setActiveSlot}
        onAddItem={addItem}
        onToggleItem={toggleItem}
        onDeleteItem={deleteItem}
        onUpdateItemText={updateItemText}
        onReorder={(reordered) => reorderItems(activeSlot, reordered)}
        getUncheckedCount={getUncheckedCount}
      />
    </SafeAreaView>
  );
}
