import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

/**
 * StripTray — rounded-top, bordered container that sits directly above the
 * bottom tab bar and holds one or more horizontal strip rows.
 *
 * One-row usage (Lists / Locked Lists / Scratchpad):
 *   <StripTray>
 *     <CategoryStrip ... />
 *   </StripTray>
 *
 * Two-row usage (Jots): stack rows with <StripDivider/> between them.
 *   <StripTray>
 *     <ModeStrip ... />
 *     <StripDivider />
 *     <CategoryStrip ... />
 *   </StripTray>
 *
 * Design notes:
 *  - Solid background (colors.trayBg) — replaces the old LinearGradient that
 *    banded on Android when the tray grew taller (Jots, ~90 px).
 *  - Height is intrinsic; it shrinks to whatever children are inside.
 *  - Children are expected to own their own vertical padding.
 */
interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function StripTray({ children, style }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.trayBg,
          borderTopColor: colors.trayBorder,
          borderLeftColor: colors.trayBorder,
          borderRightColor: colors.trayBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1.5,
    borderBottomColor: 'transparent',
    // overflow: hidden so the solid bg is clipped by the rounded top corners.
    // Safe now because no child absolute-fills the tray anymore.
    overflow: 'hidden',
  },
});
