import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { DisplayText } from './DisplayText';
import { fonts, buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from '@jotbunker/shared';
import { useSettingsStore } from '../stores/settingsStore';
import HueSlider from './settings/HueSlider';
import GrayscaleSlider from './settings/GrayscaleSlider';

interface Props {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  // Local theme state
  const [hueVal, setHueVal] = useState(DEFAULT_HUE);
  const [gsVal, setGsVal] = useState(DEFAULT_GRAYSCALE);

  // Build live-preview colors
  const theme = useMemo(() => buildTheme(hueVal, gsVal), [hueVal, gsVal]);
  const colors = theme.colors;
  const previewColor = colors.primary;

  const totalSteps = 2;

  const handleFinish = useCallback(() => {
    const store = useSettingsStore.getState();
    store.setAccentHue(hueVal);
    store.setAccentGrayscale(gsVal);
    store.setSetupComplete(true);
    onComplete();
  }, [hueVal, gsVal, onComplete]);

  const renderDots = () => (
    <View style={styles.dots}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i <= step ? colors.primary : 'transparent',
              borderColor: colors.primary,
            },
          ]}
        />
      ))}
    </View>
  );

  // Step 0: Welcome
  if (step === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderDots()}
        <View style={styles.content}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.appIcon}
          />
          <DisplayText style={[styles.title, { color: colors.textPrimary }]}>JOTBUNKER</DisplayText>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Jot on your phone. Work and store in your Bunker.{'\n'}Sync over local Wi-Fi with no cloud, no accounts, and no subscription.
          </Text>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.primary }]}
            onPress={() => setStep(1)}
          >
            <DisplayText style={[styles.secondaryBtnText, { color: colors.primary }]}>GET STARTED</DisplayText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 1: Theme
  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderDots()}
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <DisplayText style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>ACCENT COLOR</DisplayText>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: previewColor }} />
          </View>
          <Text style={[styles.pairDesc, { color: colors.textSecondary, marginBottom: 16 }]}>
            JotBunker uses dark mode with a single accent color to theme the entire app. Pick one you like — you can always change it later in Settings.
          </Text>
          <View style={{ width: '100%', paddingHorizontal: 16 }}>
            <HueSlider value={hueVal} onChange={setHueVal} />
            <View style={{ marginTop: 8 }}>
              <GrayscaleSlider value={gsVal} onChange={setGsVal} accentHue={hueVal} />
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}
              onPress={() => { setHueVal(DEFAULT_HUE); setGsVal(DEFAULT_GRAYSCALE); }}
            >
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE).colors.primary }} />
              <DisplayText style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary }}>
                RESTORE DEFAULT
              </DisplayText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => setStep(0)}
          >
            <DisplayText style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>BACK</DisplayText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.primary }]}
            onPress={handleFinish}
          >
            <DisplayText style={[styles.secondaryBtnText, { color: colors.primary }]}>FINISH</DisplayText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Should not reach here
  return null;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginBottom: 24,
  },
  title: {
    fontFamily: `${fonts.sans}-Black`,
    fontSize: 28,
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: `${fonts.sans}-Regular`,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 14,
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center',
  },
  pairDesc: {
    fontFamily: `${fonts.sans}-Regular`,
    fontSize: 13,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: `${fonts.sans}-Bold`,
    fontSize: 13,
    letterSpacing: 1,
  },
});
