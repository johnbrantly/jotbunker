import React, { useMemo } from 'react';
import { StyleSheet, Keyboard, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useListsStore } from '../../stores/listsStore';
import { useTheme } from '../../hooks/useTheme';
import ListView from '../../components/ListView';

export default function ListsScreen() {
  const { colors } = useTheme();
  const categories = useListsStore((s) => s.categories);
  const activeSlot = useListsStore((s) => s.activeSlot);
  const setActiveSlot = useListsStore((s) => s.setActiveSlot);
  const addItem = useListsStore((s) => s.addItem);
  const toggleItem = useListsStore((s) => s.toggleItem);
  const deleteItem = useListsStore((s) => s.deleteItem);
  const updateItemText = useListsStore((s) => s.updateItemText);
  const reorderItems = useListsStore((s) => s.reorderItems);
  const getUncheckedCount = useListsStore((s) => s.getUncheckedCount);

  // Tombstones filtered at the slice (Phase 2 SSOT). useShallow keeps
  // re-renders bounded to actual live-item changes despite the selector
  // returning a fresh filtered array each call.
  const currentItems = useListsStore(useShallow((s) => s.getLiveItems(s.activeSlot)));

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <Pressable
      onPress={Platform.OS === 'android' ? Keyboard.dismiss : undefined}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={[]}>
      <ListView
        sectionLabel="LISTS"
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
    </Pressable>
  );
}
