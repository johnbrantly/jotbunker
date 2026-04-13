import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { DisplayText } from '../../components/DisplayText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, header } from '@jotbunker/shared';
import { JOTS, type Category } from '@jotbunker/shared';
import { useTheme } from '../../hooks/useTheme';
import { useJotsStore } from '../../stores/jotsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import TextEditor from '../../components/TextEditor';
import DrawCanvas from '../../components/DrawCanvas';
import ImageAttach from '../../components/ImageAttach';
import FileAttach from '../../components/FileAttach';
import AudioRecorder from '../../components/AudioRecorder';
import ModeStrip from '../../components/ModeStrip';
import CategoryStrip from '../../components/CategoryStrip';
import StripTray from '../../components/StripTray';
import HeaderTray from '../../components/HeaderTray';
import DotMenu from '../../components/DotMenu';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function JotsScreen() {
  const { colors } = useTheme();
  const scratchpadFontSize = useSettingsStore((s) => s.scratchpadFontSize);
  const [showConfirm, setShowConfirm] = useState(false);

  const activeJotId = useJotsStore((s) => s.activeJotId);
  const activeMode = useJotsStore((s) => s.activeMode);
  const jots = useJotsStore((s) => s.jots);
  const setActiveJot = useJotsStore((s) => s.setActiveJot);
  const setActiveMode = useJotsStore((s) => s.setActiveMode);
  const updateText = useJotsStore((s) => s.updateText);
  const setDrawing = useJotsStore((s) => s.setDrawing);
  const addImage = useJotsStore((s) => s.addImage);
  const removeImage = useJotsStore((s) => s.removeImage);
  const addAudio = useJotsStore((s) => s.addAudio);
  const removeAudio = useJotsStore((s) => s.removeAudio);
  const addFile = useJotsStore((s) => s.addFile);
  const removeFile = useJotsStore((s) => s.removeFile);
  const clearJot = useJotsStore((s) => s.clearJot);

  const jot = jots[activeJotId];
  const jotLabel = String(activeJotId);

  const jotCategories = JOTS.map((s) => ({
    label: `JOT ${s}`,
    section: 'lists' as const,
    updatedAt: 0,
  }));

  const handleClear = () => {
    clearJot(activeJotId);
    setShowConfirm(false);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerArea: {
      paddingTop: header.padding.top,
      paddingBottom: header.padding.top,
      paddingHorizontal: header.padding.horizontal,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIcon: {
      width: 52,
      height: 52,
      marginRight: 6,
      opacity: 0.5,
    },
    headerTitle: {
      fontFamily: `${fonts.sans}-Black`,
      fontSize: header.headerLabelSize,
      letterSpacing: header.headerLabelSize * header.headerLabelLetterSpacing,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    headerJotLabel: {
      fontFamily: `${fonts.mono}-Light`,
      fontSize: header.headerNumberSize,
      color: colors.primary,
      lineHeight: header.headerNumberSize * header.headerNumberLineHeight,
      textAlign: 'center',
    },
    divider: {
      height: header.dividerHeight,
      backgroundColor: colors.border,
      marginTop: header.dividerMarginTop,
      marginHorizontal: header.padding.horizontal,
    },
    contentArea: {
      flex: 1,
      minHeight: 0,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <HeaderTray>
        <View style={styles.headerArea}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/nav/nav-jots.png')} style={styles.headerIcon} />
            <View>
              <DisplayText style={styles.headerTitle}>JOT</DisplayText>
              <Text style={styles.headerJotLabel}>{jotLabel}</Text>
            </View>
          </View>
          <DotMenu items={[
            ...(activeMode === 'type' && jot?.text
              ? [{ label: 'CLEAR TEXT', onClick: () => updateText(activeJotId, '') }]
              : []),
            ...(activeMode === 'draw' && jot?.drawing
              ? [{ label: 'CLEAR DRAWING', onClick: () => setDrawing(activeJotId, null) }]
              : []),
            ...(activeMode === 'image' && jot?.images?.length
              ? [{ label: 'CLEAR ALL IMAGES', onClick: () => jot.images.forEach((img) => removeImage(activeJotId, img.id)) }]
              : []),
            ...(activeMode === 'file' && jot?.files?.length
              ? [{ label: 'CLEAR ALL FILES', onClick: () => jot.files.forEach((f) => removeFile(activeJotId, f.id)) }]
              : []),
            ...(activeMode === 'audio' && jot?.recordings?.length
              ? [{ label: 'CLEAR ALL AUDIO', onClick: () => jot.recordings.forEach((rec) => removeAudio(activeJotId, rec.id)) }]
              : []),
            { label: `CLEAR JOT ${jotLabel}`, onClick: () => setShowConfirm(true) },
          ]} />
        </View>
      </HeaderTray>

      {/* Content area — keyed for re-mount */}
      <View style={styles.contentArea} key={`${activeJotId}-${activeMode}`}>
        {activeMode === 'type' && (
          <TextEditor
            value={jot?.text || ''}
            onChangeText={(text) => updateText(activeJotId, text)}
            fontSize={scratchpadFontSize}
          />
        )}
        {activeMode === 'draw' && (
          <DrawCanvas
            savedPaths={jot?.drawing || null}
            onPathsChange={(pathsJson) => setDrawing(activeJotId, pathsJson)}
          />
        )}
        {activeMode === 'image' && (
          <ImageAttach
            images={jot?.images || []}
            onAdd={(uri, format) => addImage(activeJotId, uri, format)}
            onRemove={(id) => removeImage(activeJotId, id)}
          />
        )}
        {activeMode === 'file' && (
          <FileAttach
            files={jot?.files || []}
            onAdd={(uri, fileName, mimeType, size) => addFile(activeJotId, uri, fileName, mimeType, size)}
            onRemove={(id) => removeFile(activeJotId, id)}
          />
        )}
        {activeMode === 'audio' && (
          <AudioRecorder
            recordings={jot?.recordings || []}
            onAdd={(uri, duration) => addAudio(activeJotId, uri, duration)}
            onRemove={(id) => removeAudio(activeJotId, id)}
          />
        )}
      </View>

      <StripTray>
        <ModeStrip
          activeMode={activeMode}
          onSelect={setActiveMode}
          contentInfo={{
            type: !!jot?.text,
            draw: jot?.drawing != null,
            image: jot?.images?.length ?? 0,
            file: jot?.files?.length ?? 0,
            audio: jot?.recordings?.length ?? 0,
          }}
        />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }} />
        <CategoryStrip
          categories={jotCategories}
          activeSlot={activeJotId - 1}
          onSelect={(slot) => setActiveJot(slot + 1)}
          getUncheckedCount={() => 0}
          getHasContent={(slot) => {
            const s = jots[slot + 1];
            return !!s?.text || s?.drawing != null || (s?.images?.length ?? 0) > 0 || (s?.files?.length ?? 0) > 0 || (s?.recordings?.length ?? 0) > 0;
          }}
        />
      </StripTray>

      <ConfirmDialog
        visible={showConfirm}
        title={`Clear Jot ${jotLabel}?`}
        message="This will erase all content in this jot. This can't be undone."
        confirmLabel="CLEAR"
        onConfirm={handleClear}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}
