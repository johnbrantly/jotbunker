import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import type { Styles } from './listViewStyles';

export interface ListItemData {
  id: string;
  text: string;
  done: boolean;
  position: number;
  createdAt: number;
  updatedAt: number;
}

interface RowItemProps {
  item: ListItemData;
  drag: () => void;
  isActive: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText?: (id: string, text: string) => void;
  styles: Styles;
  primaryColor: string;
}

// Custom comparator: keep in sync with RowItemProps.
// `drag` is intentionally excluded because the library may pass a fresh
// closure each render, and `drag` is only read inside event handlers
// (onLongPress={drag}), never rendered into the tree.
// If RowItem ever uses `drag` to affect rendered output (e.g. conditional
// styling on the handle), this comparator must start comparing it.
export const RowItem = React.memo(function RowItem({ item, drag, isActive, onToggle, onDelete, onUpdateText, styles, primaryColor }: RowItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text && onUpdateText) {
      onUpdateText(item.id, trimmed);
    }
    setEditing(false);
  }, [editText, item.id, item.text, onUpdateText]);

  const handleTextPress = useCallback(() => {
    if (onUpdateText) {
      setEditText(item.text);
      setEditing(true);
    }
  }, [item.text, onUpdateText]);

  return (
    <ScaleDecorator>
      <View style={[styles.row, isActive && styles.rowDragging]}>
        <TouchableOpacity onLongPress={drag} delayLongPress={150} disabled={isActive}>
          <Text style={styles.dragHandle}>⠿</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggle(item.id)}
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
        >
          <View
            style={[
              styles.checkInner,
              item.done && styles.checkInnerChecked,
            ]}
          >
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        {editing ? (
          <TextInput
            style={[styles.textTouchable, styles.itemText]}
            value={editText}
            onChangeText={setEditText}
            onBlur={commitEdit}
            autoFocus
            multiline
            blurOnSubmit
            selectionColor={primaryColor}
          />
        ) : (
          <TouchableOpacity
            style={styles.textTouchable}
            onPress={handleTextPress}
            onLongPress={drag}
            delayLongPress={150}
            disabled={isActive}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.itemText, item.done && styles.itemTextDone]}
              numberOfLines={2}
            >
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
        >
          <Text style={styles.deleteBtn}>×</Text>
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
},
  (a, b) =>
    a.item === b.item
    && a.isActive === b.isActive
    && a.onToggle === b.onToggle
    && a.onDelete === b.onDelete
    && a.onUpdateText === b.onUpdateText
    && a.styles === b.styles
    && a.primaryColor === b.primaryColor);
