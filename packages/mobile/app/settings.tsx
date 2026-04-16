import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  InputAccessoryView,
  Keyboard,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { APP_VERSION } from '@jotbunker/shared';
import { useSettingsStyles } from '../components/settings/useSettingsStyles';
import NetworkSyncSection from '../components/settings/NetworkSyncSection';
import ScreenLockSection from '../components/settings/ScreenLockSection';
import FontSizeSection from '../components/settings/FontSizeSection';
import AccentColorSection from '../components/settings/AccentColorSection';
import DebugLoggingSection from '../components/settings/DebugLoggingSection';
import CategoryEditors from '../components/settings/CategoryEditors';
import type { NetworkSyncSaveHandle } from '../components/settings/NetworkSyncSection';
import type { ScreenLockSaveHandle } from '../components/settings/ScreenLockSection';
import type { FontSizeSaveHandle } from '../components/settings/FontSizeSection';
import type { AccentColorSaveHandle } from '../components/settings/AccentColorSection';
import type { DebugLoggingSaveHandle } from '../components/settings/DebugLoggingSection';
import type { CategoryEditorsSaveHandle } from '../components/settings/CategoryEditors';

const INPUT_ACCESSORY_ID = 'settings-done';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, dialog, sp, styles } = useSettingsStyles();
  // Section save refs
  const networkRef = useRef<NetworkSyncSaveHandle>(null);
  const lockRef = useRef<ScreenLockSaveHandle>(null);
  const fontRef = useRef<FontSizeSaveHandle>(null);
  const colorRef = useRef<AccentColorSaveHandle>(null);
  const debugRef = useRef<DebugLoggingSaveHandle>(null);
  const catsRef = useRef<CategoryEditorsSaveHandle>(null);

  // Keyboard handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [catInputFocused, setCatInputFocused] = useState(false);
  const catBlurTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleCatFocus = useCallback(() => {
    clearTimeout(catBlurTimer.current);
    setCatInputFocused(true);
  }, []);

  const handleCatBlur = useCallback(() => {
    catBlurTimer.current = setTimeout(() => setCatInputFocused(false), 100);
  }, []);

  const handleSave = () => {
    networkRef.current?.save();
    lockRef.current?.save();
    fontRef.current?.save();
    colorRef.current?.save();
    debugRef.current?.save();
    catsRef.current?.save();
    router.back();
  };

  return (
    <>
    {Platform.OS === 'ios' && (
      <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
        <View style={styles.accessory}>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => Keyboard.dismiss()}
          >
            <Text style={styles.doneBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    )}
    <BlurView intensity={dialog.blurAmount} tint="dark" style={styles.overlay}>
      <View style={styles.box}>
        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
          <View style={styles.logoArea}>
            <Image source={require('../assets/icon.png')} style={styles.logoIcon} />
            <Text style={styles.logoText}>
              JotBunker v{APP_VERSION}
            </Text>
            <Text style={styles.logoSubtext}>© 2026 John Brantly</Text>
            <Text style={styles.logoSubtext}>Licensed under the GNU GPL v3.0</Text>
            <Text style={[styles.logoSubtext, { marginTop: 8 }]}>This software comes with no warranty.</Text>
            <Text style={[styles.logoSubtext, { marginTop: 8 }]}>www.jotbunker.com</Text>
            <Text style={[styles.logoSubtext, { marginTop: 12 }]}>Source code available:</Text>
            <Text style={styles.logoSubtext}>github.com/johnbrantly/jotbunker</Text>
            <TouchableOpacity
              style={[styles.modifyBtn, { marginTop: 8 }]}
              onPress={() => Linking.openURL('https://jotbunker.com/privacy')}
            >
              <Text style={styles.modifyBtnText}>VIEW PRIVACY POLICY</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <Text style={styles.title}>Settings</Text>

          <View style={styles.divider} />

          <NetworkSyncSection
            ref={networkRef}
            onCatFocus={handleCatFocus}
            onCatBlur={handleCatBlur}
          />
          <View style={styles.divider} />

          <ScreenLockSection ref={lockRef} />

          <View style={styles.divider} />

          <AccentColorSection ref={colorRef} />

          <View style={styles.divider} />

          <FontSizeSection ref={fontRef} />

          <View style={styles.divider} />

          <CategoryEditors
            ref={catsRef}
            onCatFocus={handleCatFocus}
            onCatBlur={handleCatBlur}
          />

          <View style={styles.divider} />

          <DebugLoggingSection ref={debugRef} />

        </ScrollView>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
    {Platform.OS === 'ios' && catInputFocused && keyboardHeight > 0 && (
      <View style={[styles.accessory, { position: 'absolute', bottom: keyboardHeight, left: 0, right: 0 }]}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => Keyboard.dismiss()}
        >
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>
    )}
    </>
  );
}
