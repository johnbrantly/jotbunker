import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { Theme } from '@jotbunker/shared';

function WaveBar({ d, targetHeight, isActive }: { d: Theme['audioMode']; targetHeight: number; isActive: boolean }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (!isActive) {
      height.value = 4;
      return;
    }
    // Delay animation start to ensure Fabric view is committed
    const id = setTimeout(() => {
      height.value = withRepeat(
        withTiming(targetHeight, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    }, 50);
    return () => { clearTimeout(id); cancelAnimation(height); };
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: d.waveBarWidth,
          borderRadius: d.waveBarRadius,
          backgroundColor: '#e84040',
          opacity: isActive ? d.waveBarOpacity : 0,
        },
        animatedStyle,
      ]}
    />
  );
}

interface WaveAnimationProps {
  d: Theme['audioMode'];
  isActive: boolean;
}

export default function WaveAnimation({ d, isActive }: WaveAnimationProps) {
  // Stable random heights — computed once per mount, never recalculated
  const targetHeights = useMemo(
    () => Array.from({ length: d.waveBarCount }, () => 16 + Math.random() * 24),
    [d.waveBarCount],
  );

  return (
    <View style={[styles.waveContainer, { gap: d.waveBarGap, height: d.waveBarHeight }]} pointerEvents={isActive ? 'auto' : 'none'}>
      {targetHeights.map((h, i) => (
        <WaveBar key={i} d={d} targetHeight={h} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
