import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  AudioModule,
} from 'expo-audio';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';
import { useSyncStatusStore } from '../stores/syncStatusStore';
import { copyToSandbox } from '../utils/copyToSandbox';
import type { AudioRecording } from '../stores/jotsStore';

interface Props {
  recordings: AudioRecording[];
  onAdd: (uri: string, duration: number) => void;
  onRemove: (id: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioRecorder({ recordings, onAdd, onRemove }: Props) {
  const { colors, imageMode: d } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Reentrancy guard — start/stop do long awaits and user can double-tap on slow devices
  const busyRef = useRef(false);

  // Playback — ONE shared player for all rows (per consultant; avoids the
  // per-row useAudioPlayer pattern that caused the original scroll-break).
  const [playingId, setPlayingId] = useState<string | null>(null);
  const sharedPlayer = useAudioPlayer(null);

  // Dock-state lockout (preserves 1eaf925 behavior). While docked, tweetnacl
  // encryption on the JS thread starves AVAudioRecorder on iOS and causes
  // record UI lag + audio glitches. Block recording while docked; playback is
  // unaffected and stays enabled.
  const dockState = useSyncStatusStore((s) => s.dockState);
  const canRecord = dockState === 'undocked';

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Clear playingId when the track naturally finishes. Pause/stop are handled
  // explicitly in the row onPress so the listener only needs to catch end-of-track.
  useEffect(() => {
    const sub = sharedPlayer.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.didJustFinish) setPlayingId(null);
    });
    return () => sub.remove();
  }, [sharedPlayer]);

  const styles = useMemo(() => StyleSheet.create({
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: d.emptyGap,
    },
    emptyAddBtn: {
      width: d.addBtnSize,
      height: d.addBtnSize,
      borderRadius: d.addBtnRadius,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: d.addBtnBorder,
      backgroundColor: d.addBtnBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyAddIcon: {
      fontSize: d.addBtnIconSize,
      color: d.addBtnIconColor,
    },
    emptyLabel: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.labelFontSize,
      letterSpacing: d.labelFontSize * d.labelLetterSpacing,
      color: d.labelColor,
    },
    listContainer: {
      padding: d.padding,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.dialogBg,
    },
    rowIcon: {
      fontSize: 22,
    },
    rowInfo: {
      flex: 1,
      gap: 2,
    },
    rowName: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: 12,
      color: colors.textPrimary,
    },
    rowMeta: {
      fontFamily: `${fonts.mono}-Regular`,
      fontSize: 10,
      color: colors.textSecondary,
    },
    removeBtn: {
      padding: 4,
      marginLeft: 4,
    },
    removeText: {
      fontSize: 18,
      color: 'rgba(232,64,64,0.5)',
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
    },
    addIcon: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    addLabel: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
  }), [d, colors]);

  const stopRecord = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const duration = elapsed;
      try { await recorder.stop(); } catch { /* stop may throw if not actively recording, or Android MediaRecorder race */ }
      AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (uri) {
        try {
          // Copy into app sandbox (Paths.document/jot-audio/). The recorder
          // leaves the clip in expo-audio's cache dir, which is subject to OS
          // eviction and which File.delete() from jotsStore removal can't
          // reliably cover. Mirrors the FileAttach sandbox-copy pattern.
          const sandboxUri = copyToSandbox(uri, 'jot-audio', 'm4a');
          onAdd(sandboxUri, duration);
        } catch (e) {
          console.warn('[AudioRecorder] save failed:', e);
        }
      }
      setIsRecording(false);
      setElapsed(0);
    } finally {
      busyRef.current = false;
    }
  }, [elapsed, onAdd, recorder]);

  const startRecord = useCallback(async () => {
    if (busyRef.current) return;
    // Mutex: no new recording while something is playing (defensive — UI also disables)
    if (playingId !== null) return;
    // Dock lockout (defensive — UI also disables)
    if (!canRecord) return;
    busyRef.current = true;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setElapsed(0);
      setIsRecording(true);
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRecording(false);
      setElapsed(0);
      console.warn('[AudioRecorder] start failed:', e);
    } finally {
      busyRef.current = false;
    }
  }, [canRecord, playingId, recorder]);

  const toggleRecord = useCallback(() => {
    if (isRecording) stopRecord();
    else startRecord();
  }, [isRecording, startRecord, stopRecord]);

  // If the user docks mid-recording, stop cleanly and save whatever was captured
  useEffect(() => {
    if (canRecord) return;
    if (!isRecording) return;
    stopRecord();
  }, [canRecord, isRecording, stopRecord]);

  if (recordings.length === 0) {
    const emptyDisabled = !isRecording && !canRecord;
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity
          style={[styles.emptyAddBtn, emptyDisabled && { opacity: 0.4 }]}
          onPress={toggleRecord}
          disabled={emptyDisabled}
        >
          <Text style={styles.emptyAddIcon}>{isRecording ? '■' : '●'}</Text>
        </TouchableOpacity>
        <Text style={styles.emptyLabel}>
          {isRecording
            ? `TAP TO STOP — ${formatTime(elapsed)}`
            : !canRecord
              ? 'DISCONNECT TO RECORD'
              : 'TAP TO RECORD'}
        </Text>
      </View>
    );
  }

  const data = [...recordings, { id: '__recorder__', uri: '', duration: 0, createdAt: 0 }];

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      renderItem={({ item }) => {
        if (item.id === '__recorder__') {
          // Mutex: block start-record while any clip is playing. Dock lockout: block
          // start-record while docked. Stop-record (while already recording) always allowed.
          const recordDisabled = !isRecording && (playingId !== null || !canRecord);
          const footerLabel = isRecording
            ? `TAP TO STOP — ${formatTime(elapsed)}`
            : !canRecord
              ? 'DISCONNECT TO RECORD'
              : 'RECORD NEW';
          return (
            <TouchableOpacity
              style={[styles.addRow, recordDisabled && { opacity: 0.4 }]}
              onPress={toggleRecord}
              disabled={recordDisabled}
            >
              <Text style={styles.addIcon}>{isRecording ? '■' : '●'}</Text>
              <Text style={styles.addLabel}>{footerLabel}</Text>
            </TouchableOpacity>
          );
        }
        const playing = playingId === item.id;
        // Mutex: block start-play while recording. Pause (already playing) always allowed.
        const playDisabled = isRecording && !playing;
        return (
          <TouchableOpacity
            style={[styles.row, playDisabled && { opacity: 0.4 }]}
            disabled={playDisabled}
            onPress={() => {
              if (playDisabled) return;
              if (playing) {
                sharedPlayer.pause();
                setPlayingId(null);
              } else {
                sharedPlayer.replace(item.uri);
                sharedPlayer.play();
                setPlayingId(item.id);
              }
            }}
          >
            <Text style={[styles.rowIcon, { color: playing ? colors.destructive : colors.primary }]}>
              {playing ? '⏸' : '▶'}
            </Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>{formatTime(item.duration)}</Text>
              <Text style={styles.rowMeta}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                if (playing) {
                  sharedPlayer.pause();
                  setPlayingId(null);
                }
                onRemove(item.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}
