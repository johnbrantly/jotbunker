import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { fonts } from '@jotbunker/shared';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettingsStyles } from './useSettingsStyles';

export interface FontSizeSaveHandle {
  save: () => void;
}

export default forwardRef<FontSizeSaveHandle>(function FontSizeSection(_props, ref) {
  const { styles, colors, sp } = useSettingsStyles();

  const scratchpadFontSize = useSettingsStore((s) => s.scratchpadFontSize);
  const setScratchpadFontSizeStore = useSettingsStore((s) => s.setScratchpadFontSize);
  const listFontSize = useSettingsStore((s) => s.listFontSize);
  const setListFontSizeStore = useSettingsStore((s) => s.setListFontSize);

  const [spFontSize, setSpFontSize] = useState(scratchpadFontSize);
  const [lsFontSize, setLsFontSize] = useState(listFontSize);

  useImperativeHandle(ref, () => ({
    save: () => {
      setScratchpadFontSizeStore(spFontSize);
      setListFontSizeStore(lsFontSize);
    },
  }), [spFontSize, lsFontSize]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>FONT SIZE</Text>
      <Text style={{ fontFamily: `${fonts.mono}-Bold`, fontSize: 9, letterSpacing: 9 * 0.08, color: colors.textSecondary, marginBottom: 6, textAlign: 'center' }}>
        SCRATCHPAD
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
        {([['S', 13], ['M', 16], ['L', 20]] as const).map(([label, size]) => (
          <TouchableOpacity
            key={label}
            style={{
              paddingVertical: sp.pillPaddingV,
              paddingHorizontal: sp.pillPaddingH,
              borderRadius: sp.pillRadius,
              backgroundColor: spFontSize === size ? sp.pillActiveBg : sp.pillBg,
              borderWidth: 1,
              borderColor: spFontSize === size ? sp.pillActiveBorder : sp.pillBorder,
            }}
            onPress={() => setSpFontSize(size)}
          >
            <Text style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: sp.pillFontSize, letterSpacing: sp.pillFontSize * sp.pillLetterSpacing, color: colors.primary }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ fontFamily: `${fonts.mono}-Bold`, fontSize: 9, letterSpacing: 9 * 0.08, color: colors.textSecondary, marginBottom: 6, textAlign: 'center' }}>
        LISTS
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        {([['S', 12], ['M', 15], ['L', 19]] as const).map(([label, size]) => (
          <TouchableOpacity
            key={label}
            style={{
              paddingVertical: sp.pillPaddingV,
              paddingHorizontal: sp.pillPaddingH,
              borderRadius: sp.pillRadius,
              backgroundColor: lsFontSize === size ? sp.pillActiveBg : sp.pillBg,
              borderWidth: 1,
              borderColor: lsFontSize === size ? sp.pillActiveBorder : sp.pillBorder,
            }}
            onPress={() => setLsFontSize(size)}
          >
            <Text style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: sp.pillFontSize, letterSpacing: sp.pillFontSize * sp.pillLetterSpacing, color: colors.primary }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});
