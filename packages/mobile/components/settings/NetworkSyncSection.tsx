import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, PanResponder, StyleSheet } from 'react-native';
import { DEFAULT_SYNC_PORT } from '@jotbunker/shared';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSyncStatusStore } from '../../stores/syncStatusStore';
import { useSettingsStyles } from './useSettingsStyles';

const INPUT_ACCESSORY_ID = 'settings-done';

export interface NetworkSyncSaveHandle {
  save: () => void;
}

interface Props {
  onCatFocus: () => void;
  onCatBlur: () => void;
}

const KA_TRACK_H = 20;
const KA_THUMB = 24;

function KeepAwakeSlider({ minutes, onChange, disabled, colors }: {
  minutes: number; onChange: (m: number) => void; disabled: boolean; colors: any;
}) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWRef = useRef(0);
  const trackPX = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const fraction = disabled ? 1 : (minutes - 1) / 59; // 1-60 → 0-1

  const clamp = (pageX: number) => {
    if (trackWRef.current <= 0) return minutes;
    const x = pageX - trackPX.current;
    const f = Math.max(0, Math.min(1, x / trackWRef.current));
    return Math.round(f * 59 + 1); // 0-1 → 1-60
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (evt) => {
        trackRef.current?.measureInWindow((x) => {
          trackPX.current = x;
          onChange(clamp(evt.nativeEvent.pageX));
        });
      },
      onPanResponderMove: (evt) => {
        onChange(clamp(evt.nativeEvent.pageX));
      },
    }),
  ).current;

  const thumbLeft = trackWidth > 0 ? fraction * trackWidth - KA_THUMB / 2 : 0;

  return (
    <View style={{ marginTop: 11, marginBottom: 5, paddingHorizontal: KA_THUMB / 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: '#888', opacity: disabled ? 0.3 : 1 }}>Keep awake duration</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{disabled ? 'always' : `${minutes} minutes`}</Text>
      </View>
      <View
        ref={trackRef}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          trackWRef.current = w;
          setTrackWidth(w);
          trackRef.current?.measureInWindow((x) => { trackPX.current = x; });
        }}
        style={{ height: KA_TRACK_H, borderRadius: 4, overflow: 'hidden', position: 'relative', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}
        {...pan.panHandlers}
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }]}>
          <View style={{ height: '100%', width: `${fraction * 100}%`, backgroundColor: colors.primary + '40', borderRadius: 4 }} />
        </View>
        <View style={{ position: 'absolute', top: (KA_TRACK_H - KA_THUMB) / 2, left: thumbLeft, width: KA_THUMB, height: KA_THUMB, borderRadius: KA_THUMB / 2, backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }} />
      </View>
    </View>
  );
}

export default forwardRef<NetworkSyncSaveHandle, Props>(function NetworkSyncSection(
  { onCatFocus, onCatBlur },
  ref,
) {
  const { styles, colors } = useSettingsStyles();
  const router = useRouter();

  const syncServerIp = useSettingsStore((s) => s.syncServerIp);
  const setSyncServerIp = useSettingsStore((s) => s.setSyncServerIp);
  const syncPort = useSettingsStore((s) => s.syncPort);
  const setSyncPortStore = useSettingsStore((s) => s.setSyncPort);
  const syncPairingSecret = useSettingsStore((s) => s.syncPairingSecret);
  const setSyncPairingSecret = useSettingsStore((s) => s.setSyncPairingSecret);
  const dockState = useSyncStatusStore((s) => s.dockState);
  const undockFn = useSyncStatusStore((s) => s.undockFn);
  const autoConnectOnOpen = useSettingsStore((s) => s.autoConnectOnOpen);
  const setAutoConnectOnOpen = useSettingsStore((s) => s.setAutoConnectOnOpen);
  const autoSyncOnConnect = useSettingsStore((s) => s.autoSyncOnConnect);
  const setAutoSyncOnConnect = useSettingsStore((s) => s.setAutoSyncOnConnect);
  const keepAwakeEnabled = useSettingsStore((s) => s.keepAwakeEnabled);
  const setKeepAwakeEnabled = useSettingsStore((s) => s.setKeepAwakeEnabled);
  const keepAwakeMinutes = useSettingsStore((s) => s.keepAwakeMinutes);
  const keepAwakeAlways = useSettingsStore((s) => s.keepAwakeAlways);
  const setKeepAwakeAlways = useSettingsStore((s) => s.setKeepAwakeAlways);
  const setKeepAwakeMinutes = useSettingsStore((s) => s.setKeepAwakeMinutes);
  const isPaired = !!syncPairingSecret;

  const [ipVal, setIpVal] = useState(syncServerIp);
  const [portVal, setPortVal] = useState(String(syncPort));
  const [secretVal, setSecretVal] = useState(syncPairingSecret);
  const [syncEditing, setSyncEditing] = useState(false);

  useImperativeHandle(ref, () => ({
    save: () => {
      setSyncServerIp(ipVal);
      setSyncPortStore(Number(portVal) || syncPort);
      if (secretVal.trim()) setSyncPairingSecret(secretVal.trim());
    },
  }), [ipVal, portVal, secretVal, syncPort]);

  const handleUnpair = useCallback(() => {
    undockFn?.();
    setSyncServerIp('');
    setIpVal('');
    setSyncPortStore(DEFAULT_SYNC_PORT);
    setPortVal(String(DEFAULT_SYNC_PORT));
    setSyncPairingSecret('');
    setSecretVal('');
    setSyncEditing(false);
  }, [undockFn]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>COMPUTER SYNC</Text>
      {syncEditing ? (
        <>
          {isPaired ? (
            <>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, dockState === 'docked' ? styles.statusDotOn : styles.statusDotOff]} />
                <Text style={[styles.statusText, dockState === 'docked' ? styles.statusTextOn : styles.statusTextOff]}>
                  {dockState === 'docked' ? 'CONNECTED' : dockState === 'docking' ? 'CONNECTING' : 'DISCONNECTED'}
                </Text>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>IP ADDRESS</Text>
                <TextInput
                  style={styles.syncInput}
                  value={ipVal}
                  onChangeText={setIpVal}
                  placeholder="192.168.1.100"
                  placeholderTextColor={colors.textUltraDim}
                  keyboardType="url"
                  autoCapitalize="none"
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>PORT</Text>
                <TextInput
                  style={styles.portInput}
                  value={portVal}
                  onChangeText={setPortVal}
                  placeholder="8080"
                  placeholderTextColor={colors.textUltraDim}
                  keyboardType="number-pad"
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                  onFocus={onCatFocus}
                  onBlur={onCatBlur}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>PAIRING SECRET</Text>
                <TextInput
                  style={styles.syncInput}
                  value={secretVal}
                  onChangeText={setSecretVal}
                  placeholder="e.g. 550e8400-e29b-41d4-..."
                  placeholderTextColor={colors.textUltraDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                  onFocus={onCatFocus}
                  onBlur={onCatBlur}
                />
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan-qr')}>
                <Text style={styles.scanBtnText}>SCAN QR CODE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.unpairBtn} onPress={() => {
                Alert.alert(
                  'Are you sure you want to unpair?',
                  'This will:\n• Disconnect from computer sync\n• Clear your pairing credentials\n\nYou\'ll need to scan the computer QR code again to re-pair.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Unpair',
                      style: 'destructive',
                      onPress: handleUnpair,
                    },
                  ]
                );
              }}>
                <Text style={styles.unpairBtnText}>UNPAIR</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>IP ADDRESS</Text>
                <TextInput
                  style={styles.syncInput}
                  value={ipVal}
                  onChangeText={setIpVal}
                  placeholder="192.168.1.100"
                  placeholderTextColor={colors.textUltraDim}
                  keyboardType="url"
                  autoCapitalize="none"
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>PORT</Text>
                <TextInput
                  style={styles.portInput}
                  value={portVal}
                  onChangeText={setPortVal}
                  placeholder="8080"
                  placeholderTextColor={colors.textUltraDim}
                  keyboardType="number-pad"
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                  onFocus={onCatFocus}
                  onBlur={onCatBlur}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.syncLabel}>PAIRING SECRET</Text>
                <TextInput
                  style={styles.syncInput}
                  value={secretVal}
                  onChangeText={setSecretVal}
                  placeholder="e.g. 550e8400-e29b-41d4-..."
                  placeholderTextColor={colors.textUltraDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                  inputAccessoryViewID={INPUT_ACCESSORY_ID}
                  onFocus={onCatFocus}
                  onBlur={onCatBlur}
                />
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan-qr')}>
                <Text style={styles.scanBtnText}>SCAN QR CODE TO PAIR</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.modifyBtn} onPress={() => setSyncEditing(false)}>
            <Text style={styles.modifyBtnText}>DONE</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {isPaired ? (
            <>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, dockState === 'docked' ? styles.statusDotOn : styles.statusDotOff]} />
                <Text style={[styles.statusText, dockState === 'docked' ? styles.statusTextOn : styles.statusTextOff]}>
                  {dockState === 'docked' ? 'CONNECTED' : dockState === 'docking' ? 'CONNECTING' : 'DISCONNECTED'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.modifyBtn, { marginTop: 4, marginBottom: 12 }]} onPress={() => setSyncEditing(true)}>
                <Text style={styles.modifyBtnText}>NETWORK SETTINGS</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Auto-connect</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['OFF', 'ON'] as const).map((label) => {
                    const active = label === 'ON' ? autoConnectOnOpen : !autoConnectOnOpen;
                    return (
                      <TouchableOpacity
                        key={label}
                        onPress={() => setAutoConnectOnOpen(label === 'ON')}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: active ? colors.primary : '#444', backgroundColor: active ? colors.primary + '25' : 'transparent' }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: active ? colors.primary : '#666' }}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, opacity: autoConnectOnOpen ? 1 : 0.3 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Sync on auto-connect</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['OFF', 'ON'] as const).map((label) => {
                    const active = autoConnectOnOpen && (label === 'ON' ? autoSyncOnConnect : !autoSyncOnConnect);
                    return (
                      <TouchableOpacity
                        key={label}
                        disabled={!autoConnectOnOpen}
                        onPress={() => setAutoSyncOnConnect(label === 'ON')}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: active ? colors.primary : '#444', backgroundColor: active ? colors.primary + '25' : 'transparent' }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: active ? colors.primary : '#666' }}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Keep awake</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['OFF', 'ON'] as const).map((label) => {
                    const active = label === 'ON' ? keepAwakeEnabled : !keepAwakeEnabled;
                    return (
                      <TouchableOpacity
                        key={label}
                        onPress={() => setKeepAwakeEnabled(label === 'ON')}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: active ? colors.primary : '#444', backgroundColor: active ? colors.primary + '25' : 'transparent' }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: active ? colors.primary : '#666' }}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>Prevents phone Auto-Lock while connected to computer.</Text>
              {keepAwakeEnabled && (
                <>
                  <KeepAwakeSlider
                    minutes={keepAwakeMinutes}
                    onChange={setKeepAwakeMinutes}
                    disabled={keepAwakeAlways}
                    colors={colors}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 6, gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setKeepAwakeAlways(!keepAwakeAlways)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <View style={{ width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: keepAwakeAlways ? colors.primary : '#555', backgroundColor: keepAwakeAlways ? colors.primary + '30' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {keepAwakeAlways && <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>{'\u2713'}</Text>}
                      </View>
                      <Text style={{ fontSize: 10, color: keepAwakeAlways ? colors.primary : '#666' }}>Always keep awake</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 9, color: '#666', textAlign: 'left', marginTop: 4, marginLeft: 22 }}>
                    Keeps screen on while connected. Uses more battery.
                  </Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.collapsedSummary}>NOT PAIRED</Text>
              <TouchableOpacity style={styles.modifyBtn} onPress={() => setSyncEditing(true)}>
                <Text style={styles.modifyBtnText}>NETWORK SETTINGS</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );
});
