import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function HeaderTray({ children, style }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.outer, { borderColor: colors.trayBorder }, style]}>
      <LinearGradient
        colors={[colors.trayGradientBottom, colors.trayGradientTop]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
});
