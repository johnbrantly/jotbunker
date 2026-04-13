import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import {
  colors,
  fonts,
  settingsPanel as sp,
} from '@jotbunker/shared';

const TRACK_HEIGHT = 24;
const THUMB_SIZE = 28;

interface LockTimeoutPickerProps {
  value: number;
  onChange: (ms: number) => void;
}

function SliderRow({
  label,
  displayValue,
  fraction,
  onFractionChange,
}: {
  label: string;
  displayValue: string;
  fraction: number;
  onFractionChange: (f: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const [trackWidthState, setTrackWidthState] = useState(0);
  const trackPageX = useRef(0);
  const fractionRef = useRef(fraction);
  fractionRef.current = fraction;

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidthState(w);
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
    });
  }, []);

  const clamp = (pageX: number) => {
    if (trackWidthRef.current <= 0) return fractionRef.current;
    const x = pageX - trackPageX.current;
    return Math.max(0, Math.min(1, x / trackWidthRef.current));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Re-measure in case the view has scrolled
        trackRef.current?.measureInWindow((x) => {
          trackPageX.current = x;
          onFractionChange(clamp(evt.nativeEvent.pageX));
        });
      },
      onPanResponderMove: (evt) => {
        onFractionChange(clamp(evt.nativeEvent.pageX));
      },
    }),
  ).current;

  const thumbLeft = trackWidthState > 0
    ? fraction * trackWidthState - THUMB_SIZE / 2
    : 0;

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{displayValue}</Text>
      </View>
      <View
        ref={trackRef}
        style={styles.sliderTrack}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackFill}>
          <View style={[styles.trackFillActive, { width: `${fraction * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

export default function LockTimeoutPicker({ value, onChange }: LockTimeoutPickerProps) {
  const totalSeconds = Math.round(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const setMinutes = useCallback((f: number) => {
    const m = Math.round(f * 15);
    const s = Math.round(value / 1000) % 60;
    const total = Math.max(1, m * 60 + s);
    onChange(total * 1000);
  }, [value, onChange]);

  const setSeconds = useCallback((f: number) => {
    const s = Math.round(f * 59);
    const m = Math.floor(Math.round(value / 1000) / 60);
    const total = Math.max(1, m * 60 + s);
    onChange(total * 1000);
  }, [value, onChange]);

  return (
    <View>
      <Text style={styles.subLabel}>LOCKED LISTS UNLOCKED FOR:</Text>
      <SliderRow
        label="MINUTES"
        displayValue={String(minutes)}
        fraction={minutes / 15}
        onFractionChange={setMinutes}
      />
      <SliderRow
        label="SECONDS"
        displayValue={String(seconds)}
        fraction={seconds / 59}
        onFractionChange={setSeconds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subLabel: {
    fontFamily: `${fonts.mono}-Bold`,
    fontSize: 9,
    letterSpacing: 9 * 0.08,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  row: {
    marginBottom: 14,
    paddingHorizontal: THUMB_SIZE / 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowLabel: {
    fontFamily: `${fonts.mono}-Bold`,
    fontSize: sp.rowNumFontSize,
    color: sp.rowNumColor,
    letterSpacing: 1,
  },
  rowValue: {
    fontFamily: `${fonts.mono}-Bold`,
    fontSize: sp.rowNumFontSize,
    color: colors.textPrimary,
  },
  sliderTrack: {
    height: TRACK_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: sp.inputBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFillActive: {
    height: '100%',
    backgroundColor: sp.pillActiveBg,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
  },
});
