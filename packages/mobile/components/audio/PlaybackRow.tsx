import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { fonts } from '@jotbunker/shared';
import type { Theme } from '@jotbunker/shared';
import type { AudioRecording } from '../../stores/jotsStore';

interface PlaybackRowProps {
  item: AudioRecording;
  onRemove: (id: string) => void;
  colors: Theme['colors'];
}

export default function PlaybackRow({ item, onRemove, colors }: PlaybackRowProps) {
  const player = useAudioPlayer(item.uri);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.playing === false && isPlaying) {
        setIsPlaying(false);
      }
    });
    return () => sub.remove();
  }, [player, isPlaying]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const date = new Date(item.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <TouchableOpacity style={[styles.playBtn, { borderColor: colors.checkboxBorder, backgroundColor: colors.checkboxBg }]} onPress={togglePlay}>
        <Text style={[styles.playIcon, { color: colors.primary }]}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowDuration, { color: colors.textPrimary }]}>{formatTime(item.duration)}</Text>
        <Text style={[styles.rowTime, { color: colors.textDim }]}>{timeStr}</Text>
      </View>
      <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeBtn}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowDuration: {
    fontFamily: `${fonts.mono}-Regular`,
    fontSize: 15,
  },
  rowTime: {
    fontFamily: `${fonts.sans}-Regular`,
    fontSize: 11,
  },
  removeBtn: {
    padding: 4,
  },
  removeText: {
    fontSize: 18,
    color: 'rgba(232,64,64,0.4)',
  },
});
