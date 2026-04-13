import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { fonts } from '@jotbunker/shared';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettingsStyles } from './useSettingsStyles';

export interface DebugLoggingSaveHandle {
  save: () => void;
}

export default forwardRef<DebugLoggingSaveHandle>(function DebugLoggingSection(_props, ref) {
  const { styles, colors, sp } = useSettingsStyles();

  const debugLog = useSettingsStore((s) => s.debugLog);
  const setDebugLogStore = useSettingsStore((s) => s.setDebugLog);

  const [debugLogVal, setDebugLogVal] = useState(debugLog);

  useImperativeHandle(ref, () => ({
    save: () => {
      setDebugLogStore(debugLogVal);
    },
  }), [debugLogVal]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>DEBUG LOGGING</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
          <TouchableOpacity
            key={label}
            style={{
              paddingVertical: sp.pillPaddingV,
              paddingHorizontal: sp.pillPaddingH,
              borderRadius: sp.pillRadius,
              backgroundColor: debugLogVal === val ? sp.pillActiveBg : sp.pillBg,
              borderWidth: 1,
              borderColor: debugLogVal === val ? sp.pillActiveBorder : sp.pillBorder,
            }}
            onPress={() => setDebugLogVal(val)}
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
