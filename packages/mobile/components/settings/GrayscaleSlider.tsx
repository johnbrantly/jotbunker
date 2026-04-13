import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { buildTheme } from '@jotbunker/shared';

const TRACK_HEIGHT = 24;
const THUMB_SIZE = 28;

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return '#' + [v, v, v].map(x => x.toString(16).padStart(2, '0')).join(''); }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p2 = 2 * l - q2;
  const r = Math.round(hue2rgb(p2, q2, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p2, q2, h) * 255);
  const b = Math.round(hue2rgb(p2, q2, h - 1/3) * 255);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

interface GrayscaleSliderProps {
  value: number;
  onChange: (gs: number) => void;
  accentHue: number;
}

export default function GrayscaleSlider({ value, onChange, accentHue }: GrayscaleSliderProps) {
  const trackWidth = useRef(0);
  const [trackW, setTrackW] = useState(0);
  const trackPageX = useRef(0);
  const trackRef = useRef<View>(null);
  const gsRef = useRef(value);
  gsRef.current = value;

  const onTrackLayout = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      trackPageX.current = x;
      trackWidth.current = w;
      setTrackW(w);
    });
  }, []);

  const clampGs = (pageX: number) => {
    const x = pageX - trackPageX.current;
    if (trackWidth.current <= 0) return gsRef.current;
    return Math.round(Math.max(0, Math.min(100, (x / trackWidth.current) * 100)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onChange(clampGs(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        onChange(clampGs(evt.nativeEvent.pageX));
      },
    })
  ).current;

  const thumbLeft = trackW > 0
    ? (value / 100) * trackW - THUMB_SIZE / 2
    : 0;

  const colorLeft = buildTheme(accentHue, 0).colors.primary;
  const grayRight = hslToHex(0, 0, 75);

  return (
    <View
      ref={trackRef}
      style={styles.sliderTrack}
      onLayout={onTrackLayout}
      {...panResponder.panHandlers}
    >
      <Svg width="100%" height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grayscaleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colorLeft} />
            <Stop offset="100%" stopColor={grayRight} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={TRACK_HEIGHT} rx="4" fill="url(#grayscaleGrad)" />
      </Svg>
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
