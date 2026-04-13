import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const TRACK_HEIGHT = 24;
const THUMB_SIZE = 28;
const HUE_STOPS = Array.from({ length: 13 }, (_, i) => i * 30);

function hueToHsl(h: number) {
  return `hsl(${h}, 80%, 55%)`;
}

interface HueSliderProps {
  value: number;
  onChange: (hue: number) => void;
}

export default function HueSlider({ value, onChange }: HueSliderProps) {
  const trackWidth = useRef(0);
  const [trackW, setTrackW] = useState(0);
  const trackPageX = useRef(0);
  const trackRef = useRef<View>(null);
  const hueRef = useRef(value);
  hueRef.current = value;

  const onTrackLayout = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      trackPageX.current = x;
      trackWidth.current = w;
      setTrackW(w);
    });
  }, []);

  const clampHue = (pageX: number) => {
    const x = pageX - trackPageX.current;
    if (trackWidth.current <= 0) return hueRef.current;
    return Math.round(Math.max(0, Math.min(360, (x / trackWidth.current) * 360)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onChange(clampHue(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        onChange(clampHue(evt.nativeEvent.pageX));
      },
    })
  ).current;

  const thumbLeft = trackW > 0
    ? (value / 360) * trackW - THUMB_SIZE / 2
    : 0;

  return (
    <View
      ref={trackRef}
      style={styles.sliderTrack}
      onLayout={onTrackLayout}
      {...panResponder.panHandlers}
    >
      <Svg width="100%" height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="0">
            {HUE_STOPS.map((h) => (
              <Stop key={h} offset={`${(h / 360) * 100}%`} stopColor={hueToHsl(h)} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={TRACK_HEIGHT} rx="4" fill="url(#rainbow)" />
      </Svg>
      {/* Thumb */}
      <View style={[styles.thumb, { left: thumbLeft }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  sliderTrack: {
    height: TRACK_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
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
