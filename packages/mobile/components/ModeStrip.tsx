import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DisplayText } from './DisplayText';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { fonts, modeStrip as d, INPUT_MODES } from '@jotbunker/shared';
import type { InputModeId } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface Props {
  activeMode: InputModeId;
  onSelect: (mode: InputModeId) => void;
  contentInfo?: Record<InputModeId, boolean | number>;
}

function RecDot({ icon, color, isActive, dimOpacity }: { icon: string; color: string; isActive: boolean; dimOpacity: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (!isActive) {
      opacity.value = 1;
      return;
    }
    const id = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, 50);
    return () => { clearTimeout(id); cancelAnimation(opacity); };
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isActive ? opacity.value : dimOpacity,
  }));

  return (
    <Animated.Text style={[styles.icon, { color }, animatedStyle]}>
      {icon}
    </Animated.Text>
  );
}

export default function ModeStrip({ activeMode, onSelect, contentInfo }: Props) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: d.height,
      flexShrink: 0,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
      {INPUT_MODES.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <TouchableOpacity
            key={mode.id}
            style={styles.btn}
            onPress={() => onSelect(mode.id)}
          >
            <RecDot icon={mode.icon} color={isActive ? colors.primary : colors.textDim} isActive={isActive} dimOpacity={isActive || Platform.OS === 'android' ? 1 : 0.25} />
            <DisplayText
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textDim },
              ]}
            >
              {mode.label}
            </DisplayText>
            {(() => {
              const info = contentInfo?.[mode.id];
              const hasData = typeof info === 'number' ? info > 0 : !!info;
              const label = typeof info === 'number' && info > 0 ? `(${info})` : '✓';
              return <Text style={[styles.indicator, { color: hasData ? colors.accentFocus : 'transparent' }]}>{label}</Text>;
            })()}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Static layout styles (no color dependencies)
const styles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: d.gap,
  },
  icon: {
    fontSize: d.iconFontSize,
  },
  label: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: d.fontSize,
    letterSpacing: d.fontSize * d.letterSpacing,
  },
  indicator: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 8,
  },
});
