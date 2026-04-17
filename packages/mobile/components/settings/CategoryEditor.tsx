import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, type TextStyle } from 'react-native';
import { fonts, MAX_CATEGORY_LABEL_LENGTH } from '@jotbunker/shared';
import { useTheme } from '../../hooks/useTheme';

interface CategoryEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  onFocus: () => void;
  onBlur: () => void;
  onModify?: () => Promise<boolean>;
}

interface CategoryRowProps {
  index: number;
  value: string;
  values: string[];
  onChange: (values: string[]) => void;
  onFocus: () => void;
  onBlur: () => void;
  inputStyle: TextStyle;
  rowStyle: TextStyle;
  rowNumStyle: TextStyle;
  selectionColor: string;
}

/**
 * Each row owns its own local typing state. While the user is actively
 * typing, the TextInput is effectively uncontrolled (value mirrors what
 * Android's IME sent), and we only commit to the parent store on blur —
 * at which point we also uppercase the stored value. This avoids the
 * Android "duplicate keystroke" race that happens when a controlled
 * TextInput's value is transformed in onChangeText: the IME's composing
 * buffer and the rendered value get out of sync and Android re-commits.
 * Visual uppercasing stays consistent via `textTransform: 'uppercase'`
 * on the input style, so the user always sees caps while typing.
 */
function CategoryRow({ index, value, values, onChange, onFocus, onBlur, inputStyle, rowStyle, rowNumStyle, selectionColor }: CategoryRowProps) {
  const [local, setLocal] = useState(value);

  // Re-sync if the parent value changes externally (e.g. a "reset to
  // defaults" button elsewhere mutates the array). Doesn't fire during
  // normal typing because `value` lags behind `local` (we only commit
  // onBlur).
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <View style={rowStyle}>
      <Text style={rowNumStyle}>{index + 1}</Text>
      <TextInput
        style={[inputStyle, { textTransform: 'uppercase' }]}
        value={local}
        onChangeText={setLocal}
        onFocus={onFocus}
        onBlur={() => {
          const upper = local.toUpperCase();
          if (upper !== value) {
            const next = [...values];
            next[index] = upper;
            onChange(next);
          }
          onBlur();
        }}
        maxLength={MAX_CATEGORY_LABEL_LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        selectionColor={selectionColor}
        inputAccessoryViewID={Platform.OS === 'ios' ? 'settings-done' : undefined}
      />
    </View>
  );
}

export default function CategoryEditor({ label, values, onChange, onFocus, onBlur, onModify }: CategoryEditorProps) {
  const { colors, settingsPanel: sp } = useTheme();
  const [editing, setEditing] = useState(false);

  const handleModify = async () => {
    if (onModify) {
      const allowed = await onModify();
      if (!allowed) return;
    }
    setEditing(true);
  };

  const styles = useMemo(() => StyleSheet.create({
    section: {
      marginBottom: 20,
      width: '100%',
    },
    sectionLabel: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: sp.sectionLabelFontSize + 2,
      letterSpacing: (sp.sectionLabelFontSize + 2) * sp.sectionLabelLetterSpacing,
      color: sp.sectionLabelColor,
      textAlign: 'center',
      marginBottom: sp.sectionLabelMarginBottom,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.rowGap,
      marginBottom: sp.rowMarginBottom,
    },
    rowNum: {
      fontFamily: `${fonts.mono}-Bold`,
      fontSize: sp.rowNumFontSize,
      color: sp.rowNumColor,
      width: sp.rowNumWidth,
      textAlign: 'right',
    },
    input: {
      flex: 1,
      backgroundColor: sp.inputBg,
      borderWidth: 1,
      borderColor: sp.inputBorder,
      borderRadius: sp.inputRadius,
      paddingVertical: sp.inputPaddingV,
      paddingHorizontal: sp.inputPaddingH,
      color: colors.textPrimary,
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: sp.inputFontSize,
      letterSpacing: sp.inputFontSize * sp.inputLetterSpacing,
    },
    toggleBtn: {
      alignSelf: 'center',
      paddingVertical: sp.pillPaddingV,
      paddingHorizontal: sp.pillPaddingH,
      borderRadius: sp.pillRadius,
      backgroundColor: sp.pillBg,
      borderWidth: 1,
      borderColor: sp.pillBorder,
    },
    toggleBtnText: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: sp.pillFontSize,
      letterSpacing: sp.pillFontSize * sp.pillLetterSpacing,
      color: colors.primary,
    },
  }), [colors, sp]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {editing ? (
        <>
          {values.map((val, i) => (
            <CategoryRow
              key={i}
              index={i}
              value={val}
              values={values}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              inputStyle={styles.input}
              rowStyle={styles.inputRow}
              rowNumStyle={styles.rowNum}
              selectionColor={colors.primary}
            />
          ))}
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setEditing(false)}>
            <Text style={styles.toggleBtnText}>DONE</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.toggleBtn} onPress={handleModify}>
          <Text style={styles.toggleBtnText}>MODIFY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
