import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { DisplayText } from './DisplayText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { fonts } from '@jotbunker/shared';
import { useSyncStatusStore } from '../stores/syncStatusStore';
import type { DockState } from '../stores/syncStatusStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../hooks/useTheme';


// ── SVG Icons ──
function UndockedIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={7} stroke={color} strokeWidth={1.4} />
      <Line x1={5.5} y1={5.5} x2={10.5} y2={10.5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={10.5} y1={5.5} x2={5.5} y2={10.5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function DockedIcon({ fillColor, strokeColor }: { fillColor: string; strokeColor: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={7} fill={fillColor} />
      <Polyline
        points="5,8 7,10.5 11,5.5"
        stroke={strokeColor}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function MonitorIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Rect x={1} y={1.5} width={11} height={7.5} rx={1.5} stroke={color} strokeWidth={1.4} />
      <Line x1={3.5} y1={9} x2={9.5} y2={9} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={6.5} y1={9} x2={6.5} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 13 13" fill="none">
      <Line x1={2} y1={2} x2={11} y2={11} stroke="#aaa" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={11} y1={2} x2={2} y2={11} stroke="#aaa" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

// ── Spinning Icon ──
function SpinningIcon({ name, size, color }: { name: React.ComponentProps<typeof Ionicons>['name']; size: number; color: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// ── Dock Zone ──
function DockZone({ dockState, onDock, onUndock, colors }: {
  dockState: DockState;
  onDock: () => void;
  onUndock: () => void;
  colors: ReturnType<typeof import('../hooks/useTheme').useTheme>['colors'];
}) {
  switch (dockState) {
    case 'undocked':
      return (
        <View style={s.zoneRow}>
          <View style={s.zone}>
            <Text style={[s.statusLabel, { color: '#555' }]}>Status:</Text>
            <UndockedIcon color="#555" />
            <DisplayText style={[s.stateText, { color: '#666' }]}>DISCONNECTED</DisplayText>
          </View>
          <TouchableOpacity style={[s.dockBtn, { backgroundColor: colors.success, borderColor: '#555', shadowColor: '#555' }]} activeOpacity={0.7} onPress={onDock}>
            <MonitorIcon color={colors.successDark} />
            <Text style={[s.dockBtnText, { color: colors.successDark }]}>Sync</Text>
          </TouchableOpacity>
          <View style={s.zoneRight} />
        </View>
      );

    case 'docking':
      return (
        <View style={s.zoneRow}>
          <View style={s.zone}>
            <Text style={[s.statusLabel, { color: colors.warning }]}>Status:</Text>
            <SpinningIcon name="sync" size={16} color={colors.warning} />
            <DisplayText style={[s.stateText, { color: colors.warning }]}>CONNECTING...</DisplayText>
          </View>
          <View style={s.spacer} />
        </View>
      );

    case 'docked':
      return (
        <View style={s.zoneRow}>
          <View style={s.zone}>
            <Text style={[s.statusLabel, { color: colors.success }]}>Status:</Text>
            <DockedIcon fillColor={colors.success} strokeColor={colors.successDark} />
            <DisplayText style={[s.stateText, { color: colors.success }]}>CONNECTED</DisplayText>
          </View>
          <View style={s.spacer} />
        </View>
      );

    default:
      return null;
  }
}

export default function TopChrome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const syncPairingSecret = useSettingsStore((s) => s.syncPairingSecret);
  const dockState = useSyncStatusStore((s) => s.dockState);
  const dockFn = useSyncStatusStore((s) => s.dockFn);
  const undockFn = useSyncStatusStore((s) => s.undockFn);
  const isPaired = !!syncPairingSecret;

  const handleDock = () => dockFn?.();
  const handleUndock = () => undockFn?.();

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={s.bar}>
        {!isPaired ? (
          <>
            <TouchableOpacity
              style={s.unpairedZone}
              activeOpacity={0.7}
              onPress={() => router.push('/scan-qr')}
            >
              <Text style={[s.statusLabel, { color: colors.info }]}>Status:</Text>
              <Ionicons name="link" size={14} color={colors.info} />
              <DisplayText style={[s.unpairedText, { color: colors.info }]}>NOT PAIRED</DisplayText>
            </TouchableOpacity>
            <View style={s.spacer} />
          </>
        ) : (
          <DockZone
            dockState={dockState}
            onDock={handleDock}
            onUndock={handleUndock}
            colors={colors}
          />
        )}

        {/* Gear */}
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={8}>
          <Ionicons name="settings-sharp" size={18} color={colors.iconDefault} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 16,
    marginBottom: 4,
  },
  zone: {
    flex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneRight: {
    flex: 15,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 0,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 13 * 0.04,
    flexShrink: 0,
  },
  dockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 100,
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dockBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  undockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  undockBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ccc',
  },
  unpairedZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  unpairedText: {
    fontFamily: `${fonts.mono}-Medium`,
    fontSize: 11,
    letterSpacing: 1,
  },
  spacer: {
    flex: 1,
  },
});
