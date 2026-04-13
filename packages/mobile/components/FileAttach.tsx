import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';
import type { FileAttachment } from '../stores/jotsStore';

interface Props {
  files: FileAttachment[];
  onAdd: (uri: string, fileName: string, mimeType: string, size: number) => void;
  onRemove: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith('application/pdf')) return '\u{1F4C4}';
  if (mimeType.startsWith('text/')) return '\u{1F4DD}';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '\u{1F4E6}';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '\u{1F4CA}';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '\u{1F4CA}';
  if (mimeType.includes('word') || mimeType.includes('document')) return '\u{1F4C3}';
  return '\u{1F4CE}';
}

export default function FileAttach({ files, onAdd, onRemove }: Props) {
  const { colors, imageMode: d } = useTheme();

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

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      // Use the cache URI directly — copyToCacheDirectory already copied it
      // to a persistent location within the app's cache directory
      onAdd(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', asset.size || 0);
    } catch (err) {
      console.warn('[FileAttach] pickFile failed:', err);
    }
  };

  if (files.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity style={styles.emptyAddBtn} onPress={pickFile}>
          <Text style={styles.emptyAddIcon}>+</Text>
        </TouchableOpacity>
        <Text style={styles.emptyLabel}>ATTACH FILES</Text>
      </View>
    );
  }

  const data = [...files, { id: '__add__', uri: '', fileName: '', mimeType: '', size: 0, createdAt: 0 }];

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      renderItem={({ item }) => {
        if (item.id === '__add__') {
          return (
            <TouchableOpacity style={styles.addRow} onPress={pickFile}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addLabel}>ADD FILE</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('File Preview', 'File preview coming soon.')}
            onLongPress={() => Alert.alert(
              'Delete file?',
              `Remove "${item.fileName}" from this jot?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onRemove(item.id) },
              ]
            )}
          >
            <Text style={styles.rowIcon}>{fileIcon(item.mimeType)}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>{item.fileName}</Text>
              <Text style={styles.rowMeta}>{formatSize(item.size)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
