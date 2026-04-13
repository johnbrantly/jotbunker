import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DisplayText } from './DisplayText';
import type { Category } from '@jotbunker/shared';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface Props {
  categories: Category[];
  activeSlot: number;
  onSelect: (slot: number) => void;
  getUncheckedCount: (slot: number) => number;
  getHasContent?: (slot: number) => boolean;
}

export default function CategoryStrip({
  categories,
  activeSlot,
  onSelect,
  getUncheckedCount,
  getHasContent,
}: Props) {
  const { colors, categoryStrip: d } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      paddingVertical: d.paddingVertical,
      flexShrink: 0,
    },
    inner: {
      flexDirection: 'row',
      paddingHorizontal: d.innerPaddingHorizontal,
    },
    btn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: d.btnGap,
      paddingVertical: d.btnPaddingV,
      paddingHorizontal: d.btnPaddingH,
    },
    pill: {
      height: d.pillPaddingV * 2 + d.labelFontSize + d.pillBorderWidth * 2,
      paddingHorizontal: d.pillPaddingH,
      borderRadius: d.pillRadius,
      borderWidth: d.pillBorderWidth,
      borderColor: d.pillBorderColor,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 3,
    },
    checkmark: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: 8,
    },
    pillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.labelFontSize,
      letterSpacing: d.labelFontSize * d.labelLetterSpacing,
      color: d.labelInactiveColor,
      textAlign: 'center' as const,
    },
    labelActive: {
      color: colors.navActiveText,
    },
  }), [colors, d]);

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {categories.map((cat, slot) => {
          const isActive = slot === activeSlot;
          return (
            <TouchableOpacity
              key={slot}
              style={styles.btn}
              onPress={() => onSelect(slot)}
            >
              <View style={[styles.pill, isActive && styles.pillActive]}>
                {getHasContent?.(slot) ? (
                  <View style={styles.pillInner}>
                    <DisplayText
                      style={[styles.label, isActive && styles.labelActive]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      ellipsizeMode="tail"
                    >
                      {cat.label}
                    </DisplayText>
                    <Text style={[styles.checkmark, { color: isActive ? colors.navActiveText : d.labelInactiveColor }]}>✓</Text>
                  </View>
                ) : (
                  <DisplayText
                    style={[styles.label, isActive && styles.labelActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    ellipsizeMode="tail"
                  >
                    {cat.label}
                  </DisplayText>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
