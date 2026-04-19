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
import { copyToSandbox } from '../utils/copyToSandbox';
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

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const ext = asset.name.includes('.')
        ? asset.name.split('.').pop()!.toLowerCase()
        : 'bin';

      // Copy into app sandbox (Paths.document/jot-files/). More durable than
      // DocumentPicker's copyToCacheDirectory — cache can be evicted and some
      // provider URIs aren't fully sandbox-readable via File.base64() later.
      try {
        const sandboxUri = copyToSandbox(asset.uri, 'jot-files', ext);
        onAdd(sandboxUri, asset.name, asset.mimeType || 'application/octet-stream', asset.size || 0);
      } catch (e) {
        console.warn('[FileAttach] copy-to-sandbox failed:', e);
        // Fallback: raw URI; user still sees the file, sync may fail later.
        onAdd(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', asset.size || 0);
      }
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
            onPress={() => Alert.alert('File Preview', 'File preview not currently supported.')}
          >
            <Text style={styles.rowIcon}>{fileIcon(item.mimeType)}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>{item.fileName}</Text>
              <Text style={styles.rowMeta}>{formatSize(item.size)}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(item.id)}
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
