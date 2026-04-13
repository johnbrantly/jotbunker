import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  TextInput,
  InputAccessoryView,
  View,
  TouchableOpacity,
  Text,
  Keyboard,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { fonts, typeArea as d } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

const INPUT_ACCESSORY_ID = 'texteditor-done';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  fontSize?: number;
  placeholder?: string;
}

export default function TextEditor({ value, onChangeText, fontSize, placeholder }: Props) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const resolvedFontSize = fontSize ?? d.fontSize;
  const resolvedPlaceholder = placeholder ?? d.placeholder;

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(10)
        .maxDuration(400)
        .onEnd((_event, success) => {
          if (success) {
            setEditing(true);
          }
        })
        .runOnJS(true),
    [],
  );

  useEffect(() => {
    if (editing) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [editing]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => setEditing(false));
    return () => sub.remove();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: {
          flex: 1,
          width: '100%',
          backgroundColor: 'transparent',
          color: colors.textPrimary,
          fontFamily: `${fonts.sans}-Regular`,
          fontSize: resolvedFontSize,
          lineHeight: resolvedFontSize * d.lineHeight,
          paddingVertical: d.paddingV,
          paddingHorizontal: d.paddingH,
        },
        readOnlyText: {
          color: colors.textPrimary,
          fontFamily: `${fonts.sans}-Regular`,
          fontSize: resolvedFontSize,
          lineHeight: resolvedFontSize * d.lineHeight,
          paddingVertical: d.paddingV,
          paddingHorizontal: d.paddingH,
        },
        placeholder: {
          color: colors.textUltraDim,
        },
        accessory: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        doneBtn: {
          backgroundColor: colors.dialogBorder,
          borderWidth: 1,
          borderColor: colors.dragHandle,
          paddingVertical: 6,
          paddingHorizontal: 16,
          borderRadius: 6,
        },
        doneBtnText: {
          fontFamily: `${fonts.sans}-Bold`,
          fontSize: 12,
          letterSpacing: 12 * 0.08,
          color: colors.primary,
        },
      }),
    [colors, resolvedFontSize],
  );

  return (
    <>
      {editing ? (
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={colors.textUltraDim}
          multiline
          textAlignVertical="top"
          selectionColor={colors.primary}
          inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <GestureDetector gesture={tap}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.readOnlyText, !value && styles.placeholder]}>
                {value || resolvedPlaceholder}
              </Text>
            </View>
          </GestureDetector>
        </ScrollView>
      )}
      {Platform.OS === 'ios' && editing && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setEditing(false);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
}
