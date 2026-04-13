import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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
            <View key={i} style={styles.inputRow}>
              <Text style={styles.rowNum}>{i + 1}</Text>
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={(text) => {
                  const next = [...values];
                  next[i] = text.toUpperCase();
                  onChange(next);
                }}
                maxLength={MAX_CATEGORY_LABEL_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="none"
                selectionColor={colors.primary}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </View>
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
