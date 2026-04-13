import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { DisplayText } from './DisplayText';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  AudioModule,
} from 'expo-audio';
import { File as ExpoFile } from 'expo-file-system';
import type { AudioRecording } from '../stores/jotsStore';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '@jotbunker/shared';
import { fonts } from '@jotbunker/shared';
import WaveAnimation from './audio/WaveAnimation';
import PlaybackRow from './audio/PlaybackRow';

interface Props {
  recordings: AudioRecording[];
  onAdd: (uri: string, duration: number) => void;
  onRemove: (id: string) => void;
}

function createStyles(colors: Theme['colors'], d: Theme['audioMode']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    listArea: {
      flex: 1,
      minHeight: 0,
    },
    recorderArea: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Platform.OS === 'android' ? 12 : 24,
      gap: Platform.OS === 'android' ? 16 : d.gap,
      flexShrink: 0,
    },
    timer: {
      fontFamily: `${fonts.mono}-Light`,
      fontSize: d.timerFontSize,
      letterSpacing: d.timerFontSize * d.timerLetterSpacing,
    },
    recordBtn: {
      width: d.btnSize,
      height: d.btnSize,
      borderRadius: d.btnSize / 2,
      borderWidth: d.btnBorderWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerIdle: {
      width: d.innerIdleSize,
      height: d.innerIdleSize,
      borderRadius: d.innerIdleSize / 2,
      backgroundColor: colors.primary,
    },
    innerRecording: {
      width: d.innerRecordingSize,
      height: d.innerRecordingSize,
      borderRadius: d.innerRecordingRadius,
      backgroundColor: colors.destructive,
    },
    label: {
      fontFamily: `${fonts.sans}-Bold`,
      fontSize: d.labelFontSize,
      letterSpacing: d.labelFontSize * d.labelLetterSpacing,
      color: d.labelColor,
    },
  });
}

export default function AudioRecorder({ recordings, onAdd, onRemove }: Props) {
  const { colors, audioMode: d } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const styles = useMemo(() => createStyles(colors, d), [colors, d]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (isRecording) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const duration = elapsed;
        if (Platform.OS === 'android') {
          try { await recorder.stop(); } catch { /* Android MediaRecorder.stop() race */ }
        } else {
          await recorder.stop();
        }
        AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const uri = recorder.uri;
        if (uri) {
          const file = new ExpoFile(uri);
          file.rename(`${Date.now()}_${Math.floor(performance.now() * 1000)}.m4a`);
          onAdd(file.uri, duration);
        }
        setIsRecording(false);
        setElapsed(0);
      } else {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) return;
        AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setElapsed(0);
        setIsRecording(true);
        intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      }
    } catch (e) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRecording(false);
      setElapsed(0);
      console.warn('[AudioRecorder] toggle failed:', e);
    }
  }, [isRecording, elapsed, onAdd, recorder]);

  return (
    <View style={styles.container}>
      <View style={styles.listArea}>
        {recordings.length > 0 && (
          <ScrollView style={styles.list} nestedScrollEnabled>
            {recordings.map((item) => (
              <PlaybackRow key={item.id} item={item} onRemove={onRemove} colors={colors} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.recorderArea}>
        <DisplayText
          style={[
            styles.timer,
            { color: isRecording ? colors.destructive : d.timerIdleColor },
          ]}
        >
          {formatTime(elapsed)}
        </DisplayText>
        <TouchableOpacity
          style={[
            styles.recordBtn,
            {
              borderColor: isRecording ? colors.destructive : colors.primary,
              backgroundColor: isRecording ? d.btnRecordingBg : d.btnIdleBg,
            },
          ]}
          onPress={toggle}
        >
          <View
            style={isRecording ? styles.innerRecording : styles.innerIdle}
          />
        </TouchableOpacity>
        <DisplayText style={styles.label}>
          {isRecording ? 'TAP TO STOP' : 'TAP TO RECORD'}
        </DisplayText>
        <WaveAnimation d={d} isActive={isRecording} />
      </View>
    </View>
  );
}
