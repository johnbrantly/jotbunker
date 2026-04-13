import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { fonts, buildTheme, DEFAULT_HUE, DEFAULT_GRAYSCALE } from '@jotbunker/shared';
import HueSlider from './HueSlider';
import GrayscaleSlider from './GrayscaleSlider';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettingsStyles } from './useSettingsStyles';

export interface AccentColorSaveHandle {
  save: () => void;
}

export default forwardRef<AccentColorSaveHandle>(function AccentColorSection(_props, ref) {
  const { styles, colors, sp } = useSettingsStyles();

  const accentHue = useSettingsStore((s) => s.accentHue);
  const setAccentHue = useSettingsStore((s) => s.setAccentHue);
  const accentGrayscale = useSettingsStore((s) => s.accentGrayscale);
  const setAccentGrayscale = useSettingsStore((s) => s.setAccentGrayscale);

  const [hue, setHue] = useState(accentHue);
  const [grayscale, setGrayscale] = useState(accentGrayscale);

  const previewColor = buildTheme(hue, grayscale).colors.primary;

  useImperativeHandle(ref, () => ({
    save: () => {
      setAccentHue(hue);
      setAccentGrayscale(grayscale);
    },
  }), [hue, grayscale]);

  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: sp.sectionLabelMarginBottom }}>
        <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>ACCENT COLOR</Text>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: previewColor }} />
      </View>
      <HueSlider value={hue} onChange={setHue} />
      <View style={{ marginTop: 8 }}>
        <GrayscaleSlider value={grayscale} onChange={setGrayscale} accentHue={hue} />
      </View>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 16 }}
        onPress={() => { setHue(DEFAULT_HUE); setGrayscale(DEFAULT_GRAYSCALE); }}
      >
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: buildTheme(DEFAULT_HUE, DEFAULT_GRAYSCALE).colors.primary }} />
        <Text style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary }}>
          RESTORE DEFAULT
        </Text>
      </TouchableOpacity>
    </View>
  );
});
