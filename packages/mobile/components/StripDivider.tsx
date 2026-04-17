import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

/**
 * StripDivider — 1 px horizontal rule used between stacked rows inside a
 * StripTray. Currently only Jots needs one (ModeStrip / CategoryStrip).
 *
 * Replaces the earlier ad-hoc:
 *   <View style={{ borderTopWidth: 1, borderTopColor: colors.border }} />
 */
export default function StripDivider() {
  const { colors } = useTheme();
  return <View style={[styles.line, { backgroundColor: colors.trayDivider }]} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    alignSelf: 'stretch',
  },
});
