import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { fonts } from '@jotbunker/shared';
import LockTimeoutPicker from './LockTimeoutPicker';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettingsStyles } from './useSettingsStyles';

export interface ScreenLockSaveHandle {
  save: () => void;
}

export default forwardRef<ScreenLockSaveHandle>(function ScreenLockSection(_props, ref) {
  const { styles, colors, sp } = useSettingsStyles();

  const lockedListsLockEnabled = useSettingsStore((s) => s.lockedListsLockEnabled);
  const setLockedListsLockEnabledStore = useSettingsStore((s) => s.setLockedListsLockEnabled);
  const lockedListsLockTimeout = useSettingsStore((s) => s.lockedListsLockTimeout);
  const setLockedListsLockTimeoutStore = useSettingsStore((s) => s.setLockedListsLockTimeout);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const setAppLockEnabledStore = useSettingsStore((s) => s.setAppLockEnabled);

  const [secured, setSecured] = useState(lockedListsLockEnabled);
  const [lockTimeout, setLockTimeout] = useState(lockedListsLockTimeout);
  const [appLock, setAppLock] = useState(appLockEnabled);
  const [lockEditing, setLockEditing] = useState(false);

  useImperativeHandle(ref, () => ({
    save: () => {
      setLockedListsLockEnabledStore(secured);
      setLockedListsLockTimeoutStore(lockTimeout);
      setAppLockEnabledStore(appLock);
    },
  }), [secured, lockTimeout, appLock]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>SCREEN LOCK OPTIONS</Text>
      {lockEditing ? (
        <>
          <Text style={{ fontFamily: `${fonts.mono}-Bold`, fontSize: 9, letterSpacing: 9 * 0.08, color: colors.textSecondary, marginBottom: 6, textAlign: 'center' }}>
            REQUIRE UNLOCK FOR LOCKED LISTS:
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
              <TouchableOpacity
                key={label}
                style={{
                  paddingVertical: sp.pillPaddingV,
                  paddingHorizontal: sp.pillPaddingH,
                  borderRadius: sp.pillRadius,
                  backgroundColor: secured === val ? sp.pillActiveBg : sp.pillBg,
                  borderWidth: 1,
                  borderColor: secured === val ? sp.pillActiveBorder : sp.pillBorder,
                }}
                onPress={() => setSecured(val)}
              >
                <Text style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: sp.pillFontSize, letterSpacing: sp.pillFontSize * sp.pillLetterSpacing, color: colors.primary }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {secured && (
            <LockTimeoutPicker value={lockTimeout} onChange={setLockTimeout} />
          )}
          <Text style={{ fontFamily: `${fonts.mono}-Bold`, fontSize: 9, letterSpacing: 9 * 0.08, color: colors.textSecondary, marginBottom: 6, marginTop: 14, textAlign: 'center' }}>
            APP LOCK
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {([['OFF', false], ['ON', true]] as const).map(([label, val]) => (
              <TouchableOpacity
                key={label}
                style={{
                  paddingVertical: sp.pillPaddingV,
                  paddingHorizontal: sp.pillPaddingH,
                  borderRadius: sp.pillRadius,
                  backgroundColor: appLock === val ? sp.pillActiveBg : sp.pillBg,
                  borderWidth: 1,
                  borderColor: appLock === val ? sp.pillActiveBorder : sp.pillBorder,
                }}
                onPress={() => setAppLock(val)}
              >
                <Text style={{ fontFamily: `${fonts.sans}-Bold`, fontSize: sp.pillFontSize, letterSpacing: sp.pillFontSize * sp.pillLetterSpacing, color: colors.primary }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.modifyBtn} onPress={() => setLockEditing(false)}>
            <Text style={styles.modifyBtnText}>DONE</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.collapsedSummary}>
            LOCKED LISTS: {secured ? 'ON' : 'OFF'}{secured ? ` (${(() => { const t = Math.round(lockTimeout / 1000); const m = Math.floor(t / 60); const s = t % 60; return m > 0 && s > 0 ? `${m}m ${s}s` : m > 0 ? `${m}m` : `${s}s`; })()})` : ''}  ·  APP LOCK: {appLock ? 'ON' : 'OFF'}
          </Text>
          <TouchableOpacity style={styles.modifyBtn} onPress={() => setLockEditing(true)}>
            <Text style={styles.modifyBtnText}>MODIFY</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});
