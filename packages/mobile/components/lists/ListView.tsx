import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  InputAccessoryView,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { Category } from '@jotbunker/shared';
import { DisplayText } from '../DisplayText';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import CategoryStrip from '../CategoryStrip';
import StripTray from '../StripTray';
import HeaderTray from '../HeaderTray';
import DotMenu from '../DotMenu';
import ConfirmDialog from '../ConfirmDialog';
import { createStyles } from './listViewStyles';
import { RowItem } from './RowItem';
import type { ListItemData } from './RowItem';

export type { ListItemData };

const INPUT_ACCESSORY_ID = 'listview-done';

interface Props {
  sectionLabel: string;
  isLocked?: boolean;
  lockEnabled?: boolean;
  categories: Category[];
  activeSlot: number;
  items: ListItemData[];
  onSelectCategory: (slot: number) => void;
  onAddItem: (text: string) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItemText?: (id: string, text: string) => void;
  onReorder: (items: ListItemData[]) => void;
  getUncheckedCount: (slot: number) => number;
}

export default function ListView({
  sectionLabel,
  isLocked,
  lockEnabled,
  categories,
  activeSlot,
  items,
  onSelectCategory,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItemText,
  onReorder,
  getUncheckedCount,
}: Props) {
  const { colors, listView: lv } = useTheme();
  const listFontSize = useSettingsStore((s) => s.listFontSize);
  const [inputText, setInputText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const inputTextRef = useRef('');
  const focusTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const styles = useMemo(() => createStyles(colors, lv, listFontSize), [colors, lv, listFontSize]);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, []);

  const activeLabel = categories[activeSlot]?.label || '';

  const handleChangeText = useCallback((text: string) => {
    setInputText(text);
    inputTextRef.current = text;
  }, []);

  const handleSubmit = useCallback(() => {
    const text = inputTextRef.current.trim();
    if (!text) return;
    onAddItem(text);
    setInputText('');
    inputTextRef.current = '';
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50);
  }, [onAddItem]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ListItemData>) => (
      <RowItem
        item={item}
        drag={drag}
        isActive={isActive}
        onToggle={onToggleItem}
        onDelete={onDeleteItem}
        onUpdateText={onUpdateItemText}
        styles={styles}
        primaryColor={colors.primary}
      />
    ),
    [onToggleItem, onDeleteItem, onUpdateItemText, styles, colors.primary],
  );

  return (
    <>
      {/* Header */}
      <HeaderTray>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              // Android has no on-screen keyboard-dismiss control in gesture-nav
              // mode. Repurpose header-tap to dismiss instead of focus when
              // keyboard is up; still works as a focus shortcut on iOS.
              if (Platform.OS === 'android') {
                Keyboard.dismiss();
              } else {
                inputRef.current?.focus();
              }
            }}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <Image
              source={sectionLabel === 'LOCKED LISTS'
                ? require('../../assets/nav/nav-lockedLists.png')
                : require('../../assets/nav/nav-lists.png')}
              style={styles.headerIcon}
            />
            <View>
              <View style={styles.headerTitleRow}>
                <DisplayText style={styles.headerTitle}>{sectionLabel}</DisplayText>
                {isLocked && (
                  <Text style={styles.lockIcon}>{lockEnabled ? '🔒' : '🔓'}</Text>
                )}
              </View>
              <Text style={styles.headerLabel}>{activeLabel}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isLocked && (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>{lockEnabled ? 'LOCKED' : 'UNLOCKED'}</Text>
              </View>
            )}
            {items.length > 0 && (
              <DotMenu items={[
                { label: `DELETE ALL ${activeLabel} ITEMS`, onClick: () => setShowClearConfirm(true) },
              ]} />
            )}
          </View>
        </View>
      </HeaderTray>

      {/* List */}
      <View style={styles.listContainer}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            placeholder={lv.inputPlaceholder}
            placeholderTextColor={colors.textUltraDim}
            returnKeyType="done"
            blurOnSubmit={false}
            selectionColor={colors.primary}
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
          />
        </View>

        <View style={{ flex: 1 }} onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}>
          {availableHeight > 0 && (
            <>
              <DraggableFlatList
                data={items}
                extraData={activeSlot}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({ data }) => onReorder(data)}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={(_w, h) => setContentHeight(h)}
                style={{ height: contentHeight < availableHeight ? contentHeight : availableHeight }}
              />
              {contentHeight < availableHeight && (
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      Keyboard.dismiss();
                    } else {
                      inputRef.current?.focus();
                    }
                  }}
                  activeOpacity={1}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Category Strip */}
      <StripTray>
        <CategoryStrip
          categories={categories}
          activeSlot={activeSlot}
          onSelect={onSelectCategory}
          getUncheckedCount={getUncheckedCount}
        />
      </StripTray>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                handleSubmit();
                clearTimeout(focusTimerRef.current);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      <ConfirmDialog
        visible={showClearConfirm}
        title="Delete all items?"
        message={`This will delete all items in ${activeLabel}. This can't be undone.`}
        confirmLabel="DELETE ALL"
        onConfirm={() => { items.forEach((item) => onDeleteItem(item.id)); setShowClearConfirm(false); }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
