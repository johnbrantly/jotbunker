import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { DisplayText } from '../../components/DisplayText';
import { fonts, header } from '@jotbunker/shared';
import { useTheme } from '../../hooks/useTheme';
import { useScratchpadStore } from '../../stores/scratchpadStore';
import { useSettingsStore } from '../../stores/settingsStore';
import CategoryStrip from '../../components/CategoryStrip';
import StripTray from '../../components/StripTray';
import HeaderTray from '../../components/HeaderTray';
import DotMenu from '../../components/DotMenu';
import ConfirmDialog from '../../components/ConfirmDialog';
import TextEditor from '../../components/TextEditor';

export default function ScratchpadScreen() {
  const { colors } = useTheme();
  const scratchpadFontSize = useSettingsStore((s) => s.scratchpadFontSize);
  const [showConfirm, setShowConfirm] = useState(false);
  const activeSlot = useScratchpadStore((s) => s.activeSlot);
  const contents = useScratchpadStore((s) => s.contents);
  const categories = useScratchpadStore((s) => s.categories);
  const setContent = useScratchpadStore((s) => s.setContent);
  const setActiveSlot = useScratchpadStore((s) => s.setActiveSlot);

  const content = contents[activeSlot]?.content || '';
  const activeLabel = categories[activeSlot]?.label || '';

  const getLineCount = (slot: number) => {
    const text = contents[slot]?.content || '';
    if (!text.trim()) return 0;
    return text.split('\n').filter((line) => line.trim().length > 0).length;
  };

  const handleClear = () => {
    setContent('');
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
    },
    headerLabel: {
      fontFamily: `${fonts.mono}-Light`,
      fontSize: header.headerNumberSize,
      color: colors.primary,
      lineHeight: header.headerNumberSize * header.headerNumberLineHeight,
    },
    divider: {
      height: header.dividerHeight,
      backgroundColor: colors.border,
      marginTop: header.dividerMarginTop,
      marginHorizontal: header.padding.horizontal,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <HeaderTray>
        <View style={styles.headerArea}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/nav/nav-scratchpad.png')} style={styles.headerIcon} />
            <View>
              <DisplayText style={styles.headerTitle}>SCRATCHPAD</DisplayText>
              <Text style={styles.headerLabel}>{activeLabel}</Text>
            </View>
          </View>
          <DotMenu items={[
            { label: 'CLEAR THIS SCRATCHPAD', onClick: () => setShowConfirm(true) },
          ]} />
        </View>
      </HeaderTray>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TextEditor
          key={activeSlot}
          value={content}
          onChangeText={setContent}
          fontSize={scratchpadFontSize}
        />
      </KeyboardAvoidingView>
      <StripTray>
        <CategoryStrip
          categories={categories}
          activeSlot={activeSlot}
          onSelect={setActiveSlot}
          getUncheckedCount={getLineCount}
        />
      </StripTray>

      <ConfirmDialog
        visible={showConfirm}
        title="Clear?"
        message="This will erase all content in this category. This can't be undone."
        confirmLabel="CLEAR"
        onConfirm={handleClear}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}
