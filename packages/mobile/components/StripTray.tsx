import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function StripTray({ children, style }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.outer, { borderTopColor: colors.trayBorder, borderLeftColor: colors.trayBorder, borderRightColor: colors.trayBorder }, style]}>
      <LinearGradient
        colors={[colors.trayGradientTop, colors.trayGradientBottom]}
        style={StyleSheet.absoluteFill}
      />
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
    overflow: 'hidden',
  },
});
