import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';
import { copyToSandbox } from '../utils/copyToSandbox';

interface ImageItem {
  id: string;
  uri: string;
  format: string;
  createdAt: number;
}

interface Props {
  images: ImageItem[];
  onAdd: (uri: string, format: string) => void;
  onRemove: (id: string) => void;
}

export default function ImageAttach({ images, onAdd, onRemove }: Props) {
  const { imageMode: d } = useTheme();
  const { width, height } = useWindowDimensions();
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);
  const itemSize = (width - d.padding * 2 - d.gridGap * (d.gridCols - 1)) / d.gridCols;

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
    grid: {
      padding: d.padding,
    },
    thumb: {
      borderRadius: d.thumbRadius,
      borderWidth: 1,
      borderColor: d.thumbBorder,
      overflow: 'hidden',
    },
    gridAddBtn: {
      borderRadius: d.thumbRadius,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: d.gridAddBorder,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridAddIcon: {
      fontSize: d.gridAddIconSize,
      color: d.gridAddIconColor,
    },
  }), [d]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      // Copy into app sandbox so the URI remains readable by sync later.
      // expo-file-system v19+ enforces a sandbox on File.base64(); raw
      // content:// URIs from ImagePicker lose READ access after the picker
      // grant expires.
      try {
        const sandboxUri = copyToSandbox(asset.uri, 'jot-images', ext);
        onAdd(sandboxUri, ext);
      } catch (e) {
        console.warn('[ImageAttach] copy-to-sandbox failed:', e);
        // Fallback: keep raw URI so the UI at least shows the image. Sync
        // for this specific attachment will fail later with the classic
        // READ-permission error, but recording remains usable.
        onAdd(asset.uri, ext);
      }
    }
  };

  if (images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity style={styles.emptyAddBtn} onPress={pickImage}>
          <Text style={styles.emptyAddIcon}>+</Text>
        </TouchableOpacity>
        <Text style={styles.emptyLabel}>ATTACH IMAGES</Text>
      </View>
    );
  }

  const data = [...images, { id: '__add__', uri: '', format: '', createdAt: 0 }];

  return (
    <>
    <FlatList
      data={data}
      numColumns={d.gridCols}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={{ gap: d.gridGap }}
      ItemSeparatorComponent={() => <View style={{ height: d.gridGap }} />}
      renderItem={({ item }) => {
        if (item.id === '__add__') {
          return (
            <TouchableOpacity
              style={[styles.gridAddBtn, { width: itemSize, height: itemSize }]}
              onPress={pickImage}
            >
              <Text style={styles.gridAddIcon}>+</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            onPress={() => setFullscreenUri(item.uri)}
            onLongPress={() => Alert.alert(
              'Delete image?',
              'This will remove this image from the jot.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onRemove(item.id) },
              ]
            )}
            style={[styles.thumb, { width: itemSize, height: itemSize }]}
          >
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          </TouchableOpacity>
        );
      }}
    />
    <Modal visible={!!fullscreenUri} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setFullscreenUri(null)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }}
      >
        {fullscreenUri && (
          <Image
            source={{ uri: fullscreenUri }}
            style={{ width: width, height: height * 0.85 }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </Modal>
    </>
  );
}
