import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts, JOTS } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface Props {
  activeJotId: number;
  onSelect: (id: number) => void;
  hasContent: Record<number, boolean>;
}

export default function JotStrip({ activeJotId, onSelect, hasContent }: Props) {
  const { colors, jotStrip: d } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: d.paddingVertical,
      flexShrink: 0,
      backgroundColor: colors.stripBg,
    },
    inner: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingHorizontal: d.innerPaddingHorizontal,
    },
    btn: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: d.btnGap,
      padding: d.btnPadding,
    },
    circle: {
      width: d.circleSize,
      height: d.circleSize,
      borderRadius: d.circleSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleActive: {
      backgroundColor: colors.primary,
    },
    circleInactive: {
      borderWidth: d.circleBorderWidth,
      borderColor: d.circleBorderColor,
    },
    num: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.numberFontSize,
    },
    dot: {
      width: d.dotSize,
      height: d.dotSize,
      borderRadius: d.dotSize / 2,
      backgroundColor: d.dotColor,
      marginTop: d.dotMarginTop,
    },
  }), [colors, d]);

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {JOTS.map((jot) => {
          const isActive = jot === activeJotId;
          return (
            <TouchableOpacity
              key={jot}
              style={styles.btn}
              onPress={() => onSelect(jot)}
            >
              <View style={[styles.circle, isActive ? styles.circleActive : styles.circleInactive]}>
                <Text
                  style={[
                    styles.num,
                    { color: isActive ? colors.navActiveText : d.numberInactiveColor },
                  ]}
                >
                  {jot}
                </Text>
              </View>
              {!isActive && hasContent[jot] && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
